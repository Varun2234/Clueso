import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Upload, Video as VideoIcon } from 'lucide-react';

const UploadFeedback = () => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || isUploading) return;
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('video', file);

      // 1. Upload Video
      const vRes = await axiosInstance.post('/video/upload', formData);
      const videoId = vRes.data._id;

      // 2. Create Feedback (Critical: MUST await this)
      await axiosInstance.post('/feedback', { title, description, videoId, status: 'Processing' });

      // 3. Trigger AI (Detached)
      axiosInstance.post(`/video/${videoId}/insights`).catch(err => console.error(err));

      navigate('/dashboard');
    } catch (err) {
      alert(err.response?.data?.message || "Upload failed");
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <form onSubmit={handleUpload} className="space-y-4 bg-white p-8 rounded-xl shadow-sm border">
        <Input label="Title" value={title} onChange={e => setTitle(e.target.value)} required />
        <Input label="Description" value={description} onChange={e => setDescription(e.target.value)} required />
        <div className="border-2 border-dashed p-8 text-center relative rounded-lg">
          <input type="file" accept="video/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => setFile(e.target.files[0])} />
          {file ? <p className="text-blue-600">{file.name}</p> : <p>Click to select video</p>}
        </div>
        <Button type="submit" isLoading={isUploading} className="w-full">
          {isUploading ? "Uploading..." : "Upload & Analyze"}
        </Button>
      </form>
    </div>
  );
};

export default UploadFeedback;