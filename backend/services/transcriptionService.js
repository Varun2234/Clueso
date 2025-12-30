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
const NETWORK_TIMEOUT = 300000;

const extractFrames = (videoPath) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'v-frames-'));
  const args = [
    '-y', '-i', videoPath,
    '-vf', "fps=1,scale=336:336", 
    '-vframes', '1', 
    path.join(tmpDir, 'frame_001.jpg')
  ];

  const result = spawnSync(ffmpegPath, args, { timeout: NETWORK_TIMEOUT });
  if (result.error) throw new Error(`FFmpeg failed: ${result.error.message}`);
  return tmpDir;
};

// backend/services/transcriptionService.js
// backend/services/transcriptionService.js

// backend/services/transcriptionService.js

export const analyzeVideoVisually = async (videoUrl) => {
  const videoPath = path.join(os.tmpdir(), `input_${Date.now()}.mp4`);
  let frameDir = null;

  try {
    if (!process.env.HUGGINGFACE_API_KEY) return "Visual analysis skipped: No API Key.";

    const resp = await axios.get(videoUrl, { responseType: 'arraybuffer', timeout: 300000 });
    fs.writeFileSync(videoPath, resp.data);

    frameDir = extractFrames(videoPath);
    const frameFile = path.join(frameDir, 'frame_001.jpg');
    const imageData = fs.readFileSync(frameFile);

    // FIX: Trim spaces and ensure a reliable fallback model
    const model = (process.env.HF_VIDEO_MODEL || "Salesforce/blip-image-captioning-base").trim();
    const apiUrl = `https://router.huggingface.co/hf-inference/models/${model}`;

    const hfResp = await axios.post(apiUrl, imageData, { 
      headers: { 
        Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY.trim()}`,
        'Content-Type': 'image/jpeg' 
      },
      timeout: 300000 
    });

    // Handle array or object response
    const result = Array.isArray(hfResp.data) ? hfResp.data[0] : hfResp.data;
    return result?.generated_text || "Analysis complete.";

  } catch (err) {
    console.error(`HF Router Error (${err.response?.status}):`, err.response?.data || err.message);
    // If 404, throw a specific message to the controller
    if (err.response?.status === 404) {
      throw new Error(`Model ${process.env.HF_VIDEO_MODEL} not found on HF Router.`);
    }
    throw err; 
  } finally {
    if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
    if (frameDir && fs.existsSync(frameDir)) fs.rmSync(frameDir, { recursive: true, force: true });
  }
};

export const generateAISummary = async (visualDescription) => {
  try {
    if (!hf) throw new Error('HF Client missing');
    const model = (process.env.HF_SUMMARY_MODEL || "mistralai/Mistral-7B-Instruct-v0.2").trim();

    const prompt = `<s>[INST] Summarize this visual analysis into JSON:
    Analysis: "${visualDescription}"
    Return ONLY JSON: {"title": "Title", "bulletPoints": ["point"], "sentiment": "Neutral"} [/INST]`;

    const response = await hf.textGeneration({
      model,
      inputs: prompt,
      parameters: { max_new_tokens: 200, temperature: 0.1 },
    });

    const text = response.generated_text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/); 
    if (!jsonMatch) throw new Error("JSON formatting error");
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Summary Error:", error.message);
    return {
      title: "Video Analysis",
      bulletPoints: [visualDescription || "Video processed."],
      sentiment: "Neutral"
    };
  }
};