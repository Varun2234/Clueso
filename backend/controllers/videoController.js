import Video from '../models/Video.js';
import Feedback from '../models/Feedback.js';
import { analyzeVideoVisually, generateAISummary } from '../services/transcriptionService.js';

export const uploadVideo = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No video file uploaded' });
    const newVideo = await Video.create({
      user: req.user._id,
      url: req.file.path,
      cloudinaryId: req.file.filename,
      status: 'ready'
    });
    res.status(201).json(newVideo);
  } catch (error) {
    res.status(500).json({ message: 'Video upload failed' });
  }
};

export const getVideoDetails = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video || video.user.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Video not found' });
    }
    res.json(video);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching video details' });
  }
};

export const processAIInsights = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: 'Video not found' });

    video.status = 'processing_ai';
    await video.save();

    // 1. Get Visual Analysis
    const visualDescription = await analyzeVideoVisually(video.url);

    // 2. Generate Summary
    const insights = await generateAISummary(visualDescription);

    // 3. Update associated Feedback record
    await Feedback.findOneAndUpdate(
      { video: video._id },
      { 
        aiSummary: { ...insights, transcript: visualDescription },
        status: 'reviewed' 
      }
    );

    video.status = 'completed';
    await video.save();

    res.json({ success: true, insights });
  } catch (error) {
    console.error("Visual AI Process Error:", error.message);
    res.status(500).json({ message: "Visual AI Processing Failed", error: error.message });
  }
};