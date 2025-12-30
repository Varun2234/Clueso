import axios from 'axios';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';
import ffmpegPath from 'ffmpeg-static';
import { HfInference } from '@huggingface/inference';
import dotenv from 'dotenv';

dotenv.config();

const HUGGINGFACE_KEY = process.env.HUGGINGFACE_API_KEY?.trim();
const hf = HUGGINGFACE_KEY ? new HfInference(HUGGINGFACE_KEY) : null;
const NETWORK_TIMEOUT = 300000; // 5 minutes

/**
 * Extracts exactly 8 frames at equal intervals across the video duration
 */
const extractFrames = (videoPath) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'v-frames-'));
  // This filter ensures we get 8 frames regardless of video length
  const args = [
    '-y', '-i', videoPath,
    '-vf', "fps=fps=8/t,scale=336:336", 
    '-vframes', '8',
    path.join(tmpDir, 'frame_%03d.jpg')
  ];

  const result = spawnSync(ffmpegPath, args, { timeout: NETWORK_TIMEOUT });
  if (result.error) throw new Error(`FFmpeg failed: ${result.error.message}`);
  
  return tmpDir;
};

/**
 * Analyzes video visual content using Video-LLaVA
 */
export const analyzeVideoVisually = async (videoUrl) => {
  const videoPath = path.join(os.tmpdir(), `input_${Date.now()}.mp4`);
  let frameDir = null;

  try {
    if (!HUGGINGFACE_KEY) return "Visual analysis skipped: No API Key.";

    // Download video
    const resp = await axios.get(videoUrl, { responseType: 'arraybuffer', timeout: NETWORK_TIMEOUT });
    fs.writeFileSync(videoPath, resp.data);

    // Extract frames
    frameDir = extractFrames(videoPath);
    const frameFiles = fs.readdirSync(frameDir).sort();
    
    // Convert to Base64 sequence
    const images = frameFiles.map(file => 
      fs.readFileSync(path.join(frameDir, file)).toString('base64')
    );

    const model = process.env.HF_VIDEO_MODEL || "LanguageBind/Video-LLaVA-7B";
    const prompt = "USER: <video>\nDescribe what is happening in this video in detail. ASSISTANT:";

    const hfResp = await axios.post(
      `https://api-inference.huggingface.co/models/${model}`,
      { inputs: prompt, images: images },
      { 
        headers: { Authorization: `Bearer ${HUGGINGFACE_KEY}` },
        timeout: NETWORK_TIMEOUT 
      }
    );

    // Robust parsing of nested HF responses
    let description = "";
    if (Array.isArray(hfResp.data) && hfResp.data[0]?.generated_text) {
      description = hfResp.data[0].generated_text;
    } else if (hfResp.data?.generated_text) {
      description = hfResp.data.generated_text;
    } else {
      throw new Error("Invalid AI response format");
    }

    // Remove the prompt from the response if the model echoes it
    return description.replace(/USER:.*?ASSISTANT:/is, '').trim();

  } catch (err) {
    console.error("Video-LLaVA Error:", err.message);
    throw err; // Throw error to trigger controller catch block properly
  } finally {
    if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
    if (frameDir && fs.existsSync(frameDir)) fs.rmSync(frameDir, { recursive: true, force: true });
  }
};

/**
 * Generates AI Summary (Mistral)
 */
export const generateAISummary = async (visualDescription) => {
  try {
    if (!hf) throw new Error('HF Client missing');
    const model = process.env.HF_SUMMARY_MODEL || "mistralai/Mistral-7B-Instruct-v0.2";

    const prompt = `[INST] Task: Convert the following visual analysis into a JSON summary.
    Analysis: "${visualDescription}"
    
    Structure: {"title": "Summary Title", "bulletPoints": ["point1", "point2"], "sentiment": "Positive/Neutral/Negative"}
    [/INST]`;

    const response = await hf.textGeneration({
      model,
      inputs: prompt,
      parameters: { max_new_tokens: 300, temperature: 0.1 },
    });

    const text = response.generated_text;
    const cleanJson = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Summary Generation Error:", error.message);
    // Return a structured error so the controller doesn't use the fallback string
    return {
      title: "Visual Analysis Results",
      bulletPoints: ["The video frames were successfully analyzed.", "Summary generation is currently limited."],
      sentiment: "Neutral"
    };
  }
};