import express from 'express';
import { 
  uploadVideo, 
  getVideoDetails, 
  processAIInsights 
} from '../controllers/videoController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

/**
 * @route   POST /api/video/upload
 * @desc    Upload video to Cloudinary and save metadata
 * @access  Private
 * @logic   Uses 'upload.single' to handle the multipart/form-data
 */
router.post(
  '/upload', 
  protect, 
  upload.single('video'), // 'video' matches the field name in the FormData
  uploadVideo
);

/**
 * @route   GET /api/video/:id
 * @desc    Fetch video URL and existing metadata
 * @access  Private
 */
router.get('/:id', protect, getVideoDetails);

/**
 * @route   POST /api/video/:id/insights
 * @desc    Trigger AI Transcription and Summary manually
 * @access  Private
 */
router.post('/:id/insights', protect, processAIInsights);

export default router;