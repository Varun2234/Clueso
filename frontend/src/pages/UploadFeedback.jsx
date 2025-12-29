    import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Upload, Video } from 'lucide-react';

const UploadFeedback = () => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();

  const isMountedRef = React.useRef(true);

  React.useEffect(() => {
    return () => { isMountedRef.current = false; };
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please select a video");

    if (isUploading) return; // prevent duplicate submissions
    setIsUploading(true);

    try {
      // STEP 1: Upload the video to Cloudinary
      const formData = new FormData();
      formData.append('video', file);

      const videoRes = await axiosInstance.post('/video/upload', formData);
      const videoId = videoRes?.data?._id;

      if (!videoId) {
        throw new Error('Upload did not return a video id.');
      }

      // STEP 2: Create the feedback entry immediately
      await axiosInstance.post('/feedback', {
        title,
        description,
        videoId,
        status: 'Processing'
      });

      // STEP 3: Trigger AI in the background (DO NOT 'await' this)
      // Run in a detached async function with its own try/catch to avoid any unhandled rejections
      (async () => {
        try {
          await axiosInstance.post(`/video/${videoId}/insights`);
        } catch (err) {
          console.error("Background AI processing error:", err?.response?.data || err?.message || err);
        }
      })();

      // ensure we update state only while mounted
      if (isMountedRef.current) setIsUploading(false);

      // Move the user to the dashboard immediately (guard navigate)
      try {
        if (typeof navigate === 'function') navigate('/dashboard');
        else console.warn('navigate is not available, skipping redirect');
      } catch (navErr) {
        console.error('Navigation error after upload:', navErr);
      }

    } catch (err) {
      // Log backend error details when available for debugging
      console.error("Upload Error:", err?.response?.data || err?.message || err);
      const msg = err?.response?.data?.message || 'Upload failed. Make sure your server and Cloudinary are connected.';
      alert(msg);

      if (isMountedRef.current) setIsUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">New Collection</h1>
      <form onSubmit={handleUpload} className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <Input label="Feedback Title" placeholder="e.g., Q1 Onboarding Review" value={title} onChange={(e) => setTitle(e.target.value)} required disabled={isUploading} />
        <Input label="Description" placeholder="What is this feedback about?" value={description} onChange={(e) => setDescription(e.target.value)} required disabled={isUploading} />
        
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-blue-400 transition-colors cursor-pointer relative">
          <input disabled={isUploading} type="file" accept="video/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setFile(e.target.files[0])} />
          {file ? (
            <div className="text-blue-600 font-medium flex items-center justify-center gap-2">
              <Video /> {file.name}
            </div>
          ) : (
            <div className="text-gray-500 space-y-2">
              <Upload className="mx-auto" />
              <p>Click to upload or drag and drop video file</p>
            </div>
          )}
        </div>

        <Button type="submit" isLoading={isUploading} className="w-full py-3">
          {isUploading ? "Processing AI Insights..." : "Upload & Analyze"}
        </Button>
      </form>
    </div>
  );
};

export default UploadFeedback;