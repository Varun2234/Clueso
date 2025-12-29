import express from 'express';
import { body } from 'express-validator';
import { 
  createFeedback, 
  getAllFeedback, 
  getFeedbackById,
  deleteFeedback 
} from '../controllers/feedbackController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All feedback routes are protected (require authentication)
router.use(protect);

/**
 * @route   POST /api/feedback
 * @desc    Create a new feedback entry
 * @access  Private
 */
router.post(
  '/',
  [
    body('title', 'Title is required').not().isEmpty(),
    body('description', 'Description is required').not().isEmpty(),
  ],
  createFeedback
);

/**
 * @route   GET /api/feedback
 * @desc    Get all feedback for the logged-in user
 * @access  Private
 */
router.get('/', getAllFeedback);

/**
 * @route   GET /api/feedback/:id
 * @desc    Get specific feedback detail (includes video & AI summary)
 * @access  Private
 */
router.get('/:id', getFeedbackById);

/**
 * @route   DELETE /api/feedback/:id
 * @desc    Remove a feedback entry
 * @access  Private
 */
router.delete('/:id', deleteFeedback);

export default router;