import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  cloudinaryId: { type: String, required: true },
  url: { type: String, required: true },
  duration: { type: Number }, // in seconds
  status: { 
    type: String, 
    enum: ['uploading', 'ready', 'processing_ai', 'completed'], 
    default: 'ready' 
  },
  createdAt: { type: Date, default: Date.now }
});

const Video = mongoose.model('Video', videoSchema);
export default Video;