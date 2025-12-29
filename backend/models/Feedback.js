import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  
  // Link to the Video model
  video: { type: mongoose.Schema.Types.ObjectId, ref: 'Video' },
  
  // Requirement 04: AI-Powered Insights Data
  aiSummary: {
    title: String,
    bulletPoints: [String],
    sentiment: String,
    transcript: String
  },

  status: { 
    type: String, 
    enum: ['pending', 'reviewed', 'archived'], 
    default: 'pending' 
  },
  createdAt: { type: Date, default: Date.now }
});

const Feedback = mongoose.model('Feedback', feedbackSchema);
export default Feedback;