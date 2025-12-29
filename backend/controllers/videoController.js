import Video from '../models/Video.js';
import Feedback from '../models/Feedback.js';
import { transcribeAudio, generateAISummary } from '../services/transcriptionService.js';

/**
 * @desc    Upload video to Cloudinary
 * @route   POST /api/video/upload
 */
export const uploadVideo = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No video file uploaded' });

    const newVideo = await Video.create({
      user: req.user._id,
      url: req.file.path, // Cloudinary URL from multer
      cloudinaryId: req.file.filename,
      status: 'ready'
    });

    res.status(201).json(newVideo);
  } catch (error) {
    res.status(500).json({ message: 'Video upload failed', error: error.message });
  }
};

/**
 * @desc    Get video details by ID (The missing export)
 * @route   GET /api/video/:id
 */
export const getVideoDetails = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // Security: Ensure user owns this video
    if (video.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    res.json(video);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching video details', error: error.message });
  }
};

/**
 * @desc    Process AI insights (HF ASR + HF Summary)
 * @route   POST /api/video/:id/insights
 */
export const processAIInsights = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: 'Video not found' });

    // Update status to processing
    video.status = 'processing_ai';
    await video.save();

    // 1. Get Transcription (Hugging Face ASR)
    const transcript = await transcribeAudio(video.url);
    console.log('DEBUG transcript value:', transcript);

    // If no audio present, short-circuit with a friendly message and avoid text-generation
    if (transcript && transcript.toLowerCase().includes('no audio')) {
      const fallback = {
        title: 'No audio detected',
        bulletPoints: [
          'No audio track was found in the uploaded file.',
          'Please ensure the video contains an audio track for transcription.',
        ],
        sentiment: 'Neutral'
      };

      await Feedback.findOneAndUpdate(
        { video: video._id },
        {
          aiSummary: { ...fallback, transcript },
          status: 'reviewed'
        }
      );

      video.status = 'completed';
      await video.save();

      return res.json({ success: true, insights: fallback });
    }

    // 2. Get Summary/Sentiment (Hugging Face)
    const insights = await generateAISummary(transcript);

    // 3. Save directly to the Feedback entry associated with this video
    await Feedback.findOneAndUpdate(
      { video: video._id }, 
      { 
        aiSummary: { ...insights, transcript },
        status: 'reviewed' 
      }
    );

    // 4. Mark video as completed
    video.status = 'completed';
    await video.save();

    res.json({ success: true, insights });
  } catch (error) {
    console.error("AI Error:", error.message);
    res.status(500).json({ message: "AI Processing Failed", error: error.message });
  }
};