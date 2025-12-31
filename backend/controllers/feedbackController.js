import Feedback from '../models/Feedback.js';

export const createFeedback = async (req, res) => {
  const { title, description, videoId, aiSummary } = req.body;
  try {
    const feedback = await Feedback.create({
      user: req.user._id,
      title,
      description,
      video: videoId || null,
      aiSummary: aiSummary || null
    });
    res.status(201).json(feedback);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create feedback' });
  }
};

// UPDATED: Handles pagination and sorts by most recent
export const getAllFeedback = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10; // Top 10 per page
    const skip = (page - 1) * limit;

    const feedbacks = await Feedback.find({ user: req.user._id })
      .populate('video')
      .sort({ createdAt: -1 }) // Show most recent first
      .skip(skip)
      .limit(limit);

    const total = await Feedback.countDocuments({ user: req.user._id });

    res.json({
      feedbacks,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalFeedbacks: total
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching feedback' });
  }
};

export const getFeedbackById = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id).populate('video');
    if (!feedback) return res.status(404).json({ message: 'Feedback not found' });
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching detail' });
  }
};

export const deleteFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) return res.status(404).json({ message: 'Feedback not found' });

    if (feedback.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'User not authorized to delete this feedback' });
    }

    await feedback.deleteOne();
    res.json({ message: 'Feedback removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting feedback', error: error.message });
  }
};