import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { v2 as cloudinary } from 'cloudinary';
// Ensure your cloudinaryConfig.js is imported or configured here
import './../config/cloudinaryConfig.js'; 

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'clueso_recordings',
    resource_type: 'video', // Specifically allow video files
    allowed_formats: ['mp4', 'webm', 'mov'],
    public_id: (req, file) => `video_${Date.now()}_${file.originalname.split('.')[0]}`,
  },
});

/**
 * Filter to ensure only video files are uploaded
 */
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Please upload a video.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB Limit
  }
});

export default upload;