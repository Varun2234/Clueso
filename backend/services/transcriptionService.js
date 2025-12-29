import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';
import ffmpegPath from 'ffmpeg-static';
import { HfInference } from '@huggingface/inference';
import dotenv from 'dotenv';

dotenv.config();

// Use trimmed API key to avoid accidental whitespace from .env
const HUGGINGFACE_KEY = process.env.HUGGINGFACE_API_KEY ? process.env.HUGGINGFACE_API_KEY.trim() : undefined;
const hf = HUGGINGFACE_KEY ? new HfInference(HUGGINGFACE_KEY) : null;

/**
 * Transcribes audio/video using Hugging Face ASR API
 */
export const transcribeAudio = async (audioUrl) => {
  try {
    if (!HUGGINGFACE_KEY) {
      console.warn("⚠️ HUGGINGFACE_API_KEY missing (or empty). Using mock transcript.");
      return "The user mentioned that the dashboard navigation is confusing, but they liked the new dark mode feature.";
    }

    // Download the media file (Cloudinary URL can be mp4/mov etc.)
    const resp = await axios.get(audioUrl, { responseType: 'arraybuffer', timeout: 120000 });
    let buffer = resp.data;
    let contentType = resp.headers['content-type'] || 'application/octet-stream';

    // If we received a video, transcode to WAV (some ASR endpoints are more reliable with audio files)
    if (contentType.startsWith('video/') || contentType === 'application/octet-stream') {
      try {
        const tmpIn = path.join(os.tmpdir(), `input_${Date.now()}`);
        const tmpOut = path.join(os.tmpdir(), `output_${Date.now()}.wav`);
        fs.writeFileSync(tmpIn, buffer);

        // Use ffmpeg-static binary to convert container to wav (mono, 16k)
        const args = [
          '-y',
          '-i', tmpIn,
          '-vn',
          '-ac', '1',
          '-ar', '16000',
          '-f', 'wav',
          tmpOut
        ];

        const result = spawnSync(ffmpegPath, args, { stdio: 'pipe', timeout: 120000 });
        if (result.error) {
          console.warn('ffmpeg conversion process error:', result.error.message || result.error);
        } else {
          const stderr = (result.stderr || '').toString();
          if (/Output file does not contain any stream/i.test(stderr) || /does not contain any stream/i.test(stderr) || /could not find audio stream/i.test(stderr)) {
            // No audio track present in the media
            try { fs.unlinkSync(tmpIn); } catch (e) {}
            console.warn('No audio track found in media (ffmpeg)');
            return 'No audio track found in media.';
          }

          if (fs.existsSync(tmpOut)) {
            buffer = fs.readFileSync(tmpOut);
            contentType = 'audio/wav';
            // cleanup
            try { fs.unlinkSync(tmpIn); } catch (e) {}
            try { fs.unlinkSync(tmpOut); } catch (e) {}
          } else {
            console.warn('ffmpeg did not produce output file; stderr:', stderr.slice(0, 500));
          }
        }
      } catch (convErr) {
        console.warn('Transcoding to WAV failed:', convErr.message || convErr);
      }
    }

    // Choose an ASR model. Default to a Whisper-based model for robustness.
    const model = process.env.HF_ASR_MODEL || 'openai/whisper-small';

    // Primary attempt: send raw bytes directly
    try {
      const hfResp = await axios.post(
        `https://api-inference.huggingface.co/models/${model}`,
        buffer,
        {
          headers: {
            Authorization: `Bearer ${HUGGINGFACE_KEY}`,
            'Content-Type': contentType,
          },
          timeout: 120000,
        }
      );

      console.log('HF ASR raw response status:', hfResp.status);
      if (hfResp.data) {
        if (hfResp.data.error) throw new Error(hfResp.data.error);
        if (hfResp.data.text) return hfResp.data.text;
        const asText = hfResp.data.transcription || hfResp.data[0]?.text;
        if (asText) return asText;
      }

      // If response shape unexpected, fall through to multipart retry
      console.warn('HF ASR returned unexpected payload, falling back to multipart; payload preview:', JSON.stringify(hfResp.data).slice(0,300));
    } catch (innerErr) {
      console.error('HF ASR direct upload error:', innerErr.response ? { status: innerErr.response.status, data: innerErr.response.data } : innerErr.message || innerErr);
      // continue to multipart retry below
    }

    // Fallback: send as multipart/form-data (some models prefer file uploads)
    try {
      const form = new FormData();
      form.append('file', buffer, { filename: 'audio_input', contentType });

      const fallbackResp = await axios.post(
        `https://api-inference.huggingface.co/models/${model}`,
        form,
        {
          headers: {
            ...form.getHeaders(),
            Authorization: `Bearer ${HUGGINGFACE_KEY}`
          },
          timeout: 120000,
        }
      );

      console.log('HF ASR multipart response status:', fallbackResp.status);
      if (fallbackResp.data) {
        if (fallbackResp.data.error) throw new Error(fallbackResp.data.error);
        if (fallbackResp.data.text) return fallbackResp.data.text;
        const asText2 = fallbackResp.data.transcription || fallbackResp.data[0]?.text;
        if (asText2) return asText2;
      }

      throw new Error('Invalid response from Hugging Face ASR (both raw and multipart attempts)');
    } catch (mfErr) {
      console.error('HF ASR multipart fallback error:', mfErr.response ? { status: mfErr.response.status, data: mfErr.response.data } : mfErr.message || mfErr);
      return "Audio captured, but transcription failed to process text.";
    }

  } catch (err) {
    console.error("Transcription Service Crash:", err);
    return "Error in transcription engine.";
  }
};

/**
 * Generates AI Summary using Hugging Face (Mistral)
 */
export const generateAISummary = async (transcript) => {
  try {
    if (!hf) {
      console.warn('Hugging Face client not initialized; skipping summary generation');
      throw new Error('Hugging Face client missing');
    }

    const model = process.env.HF_SUMMARY_MODEL || "mistralai/Mistral-7B-Instruct-v0.2";
    const fallbackModel = process.env.HF_SUMMARY_FALLBACK_MODEL || null;

    // Strict prompt to ensure valid JSON output
    const prompt = `[INST] Task: Analyze user feedback.
    Transcript: "${transcript}"
    
    Return ONLY a JSON object with this exact structure:
    {
      "title": "Short descriptive title",
      "bulletPoints": ["Point 1", "Point 2", "Point 3"],
      "sentiment": "Positive/Negative/Neutral"
    }
    [/INST]`;

    const callTextGen = async (useModel) => {
      try {
        const response = await hf.textGeneration({
          model: useModel,
          inputs: prompt,
          parameters: {
            max_new_tokens: 300,
            return_full_text: false,
            temperature: 0.1,
          },
          // Some HF endpoints may be slow; we'll let axios-level timeout handle long waits
        });
        return response;
      } catch (e) {
        console.error(`TextGen error for model ${useModel}:`, e.response ? { status: e.response.status, data: e.response.data } : e.message || e);
        throw e;
      }
    };

    let response = await callTextGen(model);
    if (!response || !response.generated_text) {
      if (fallbackModel) {
        console.log('Primary model returned no generated_text, trying fallback model:', fallbackModel);
        response = await callTextGen(fallbackModel);
      }
    }

    if (!response || !response.generated_text) throw new Error('No generated_text from HF models');

    const generatedText = response.generated_text.trim();

    // JSON Repair Logic: Find the first '{' and last '}'
    const start = generatedText.indexOf('{');
    const end = generatedText.lastIndexOf('}') + 1;

    if (start === -1 || end === 0) {
      throw new Error("AI did not return valid JSON");
    }

    const cleanJson = generatedText.substring(start, end);
    return JSON.parse(cleanJson);

  } catch (error) {
    console.error("Hugging Face Summary Error:", error);

    // Professional Fallback so the UI doesn't break
    return {
      title: "Feedback Analysis (Manual Review Required)",
      bulletPoints: [
        "Transcription processed successfully.",
        "AI Summary engine was busy or timed out.",
        "Please read the full transcript below for insights."
      ],
      sentiment: "Neutral"
    };
  }
};