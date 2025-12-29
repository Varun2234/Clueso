import dotenv from 'dotenv';
dotenv.config();
import connectDB from '../config/db.js';
import Video from '../models/Video.js';
import { transcribeAudio } from '../services/transcriptionService.js';

(async () => {
  await connectDB();
  const video = await Video.findOne().sort({ createdAt: -1 });
  if (!video) return console.error('No videos found in DB');
  console.log('Testing transcription for video URL:', video.url);
  const text = await transcribeAudio(video.url);
  console.log('Transcription result:', text);
  process.exit(0);
})();
