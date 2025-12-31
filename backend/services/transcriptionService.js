import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Initialize the Gemini SDK
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

/**
 * Analyzes video natively using Gemini 1.5.
 * This replaces the old analyzeVideoVisually that used FFmpeg and Hugging Face.
 */
export const analyzeVideoVisually = async (videoUrl) => {
  try {
    if (!process.env.GEMINI_API_KEY) return "Analysis skipped: No Gemini API Key.";

    // Download the video from Cloudinary as a buffer
    const resp = await axios.get(videoUrl, { responseType: 'arraybuffer' });
    const videoBase64 = Buffer.from(resp.data).toString('base64');

    // Define the prompt for the model
    const prompt = "Please analyze this video and describe what is happening in detail.";
    
    // Generate content using the video data
    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: "video/mp4",
          data: videoBase64
        }
      },
      { text: prompt },
    ]);

    const response = await result.response;
    return response.text() || "Analysis complete.";
  } catch (err) {
    console.error("Gemini Video Analysis Error:", err.message);
    throw new Error(`Gemini Video Analysis Failed: ${err.message}`);
  }
};

/**
 * Generates a structured summary from the visual description.
 */
export const generateAISummary = async (visualDescription) => {
  try {
    const prompt = `Based on this video analysis: "${visualDescription}", 
    generate a summary in JSON format.
    Required format: {"title": "Title", "bulletPoints": ["point1", "point2"], "sentiment": "Neutral"}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    // Extract JSON in case the model returns markdown code blocks
    const jsonMatch = text.match(/\{[\s\S]*\}/); 
    if (!jsonMatch) throw new Error("JSON formatting error");
    
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Gemini Summary Error:", error.message);
    // Fallback object to prevent backend crashes
    return {
      title: "Video Insights",
      bulletPoints: [visualDescription || "Video processed."],
      sentiment: "Neutral"
    };
  }
};