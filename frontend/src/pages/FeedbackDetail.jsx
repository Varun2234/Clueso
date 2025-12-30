// frontend/src/pages/FeedbackDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Sparkles, FileText, Clock, AlertCircle, Video } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import Button from '../components/ui/Button.jsx';

const FeedbackDetail = () => {
  const { id } = useParams();
  const [feedback, setFeedback] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setIsLoading(true);
        const res = await axiosInstance.get(`/feedback/${id}`);
        setFeedback(res.data);
      } catch (err) {
        setError("Could not find this feedback. It may have been deleted.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetails();
  }, [id]);
// frontend/src/pages/FeedbackDetail.jsx

const handleGenerateSummary = async () => {
  if (!feedback?.video?._id) return;
  
  setIsGenerating(true);
  try {
    const res = await axiosInstance.post(`/video/${feedback.video._id}/insights`);
    
    // FIX: Only update state if insights exist in the response
    if (res.data && res.data.insights) {
      setFeedback(prev => ({
        ...prev,
        aiSummary: res.data.insights
      }));
    }
  } catch (err) {
    console.error("AI Generation Error:", err);
    // Alert the specific backend error (e.g., the 404 message)
    const errorMsg = err.response?.data?.message || "AI Processing failed.";
    alert(`Error: ${errorMsg}`);
  } finally {
    setIsGenerating(false);
  }
};

  if (isLoading) return <div className="p-20 text-center animate-pulse">Loading feedback data...</div>;
  if (error) return (
    <div className="flex flex-col items-center justify-center p-20 text-red-500">
      <AlertCircle size={48} className="mb-4" />
      <p>{error}</p>
      <Link to="/dashboard" className="mt-4 text-blue-600 hover:underline">Return to Dashboard</Link>
    </div>
  );

  return (
    <div className="space-y-6">
      <Link to="/dashboard" className="flex items-center text-sm text-gray-500 hover:text-blue-600 w-fit">
        <ChevronLeft size={16} /> Back to Dashboard
      </Link>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <div className="bg-black rounded-xl aspect-video relative overflow-hidden shadow-2xl">
            {feedback?.video?.url ? (
              <video src={feedback.video.url} controls className="w-full h-full object-contain" />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Video size={48} className="mb-2 opacity-20" />
                <p>No video associated with this feedback</p>
              </div>
            )}
          </div>
          <div className="mt-6 bg-white p-6 rounded-xl border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-2">{feedback.title}</h3>
            <p className="text-gray-600">{feedback.description}</p>
          </div>
        </div>

        <div className="w-full lg:w-96 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="text-purple-600" size={20} />
              <h3 className="font-bold">AI Insights</h3>
            </div>
            {!feedback.aiSummary ? (
              <Button onClick={handleGenerateSummary} isLoading={isGenerating} className="w-full">
                Generate AI Summary
              </Button>
            ) : (
              <div className="space-y-4">
                <ul className="space-y-2">
                  {feedback.aiSummary.bulletPoints.map((pt, i) => (
                    <li key={i} className="text-sm text-gray-700">• {pt}</li>
                  ))}
                </ul>
                <div className="pt-4 border-t flex justify-between">
                  <span className="text-xs font-bold text-gray-400">SENTIMENT</span>
                  <span className="text-xs font-bold text-blue-600">{feedback.aiSummary.sentiment}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackDetail;