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
        console.error("Error fetching feedback:", err);
        setError("Could not find this feedback. It may have been deleted.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  /**
   * FIXED: Added robust async error handling to prevent Promise rejections.
   */
  const handleGenerateSummary = async () => {
    if (!feedback?.video?._id) return;
    
    setIsGenerating(true);
    try {
      const res = await axiosInstance.post(`/video/${feedback.video._id}/insights`);
      
      setFeedback(prev => ({
        ...prev,
        aiSummary: res.data.insights
      }));
    } catch (err) {
      console.error("AI Generation Error:", err);
      const errorMsg = err.response?.data?.message || "AI Processing failed. Please check backend logs.";
      alert(errorMsg);
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
    <div className="space-y-6 fade-in">
      <Link to="/dashboard" className="flex items-center text-sm text-gray-500 hover:text-blue-600 w-fit">
        <ChevronLeft size={16} /> Back to Dashboard
      </Link>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <div className="bg-black rounded-xl aspect-video relative overflow-hidden shadow-2xl border border-gray-800">
            {feedback?.video?.url ? (
              <video src={feedback.video.url} controls className="w-full h-full object-contain" />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Video size={48} className="mb-2 opacity-20" />
                <p>No video associated with this feedback</p>
              </div>
            )}
            <div className="absolute bottom-4 left-4 z-10">
              <h2 className="font-semibold text-white bg-black/40 px-2 py-1 rounded">{feedback.title}</h2>
              <p className="text-xs text-gray-300 mt-1"><Clock size={12} className="inline mr-1"/> {new Date(feedback.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="mt-6 bg-white p-6 rounded-xl border border-gray-200">
            <h3 className="font-bold text-gray-900 mb-2">Description</h3>
            <p className="text-gray-600 leading-relaxed">{feedback.description}</p>
          </div>
        </div>

        <div className="w-full lg:w-96 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-blue-500"></div>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="text-purple-600" size={20} />
              <h3 className="font-bold text-gray-900">AI Insights</h3>
            </div>
            {!feedback.aiSummary ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500 mb-4">Insights haven't been generated yet.</p>
                <Button 
                  onClick={handleGenerateSummary} 
                  isLoading={isGenerating}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 border-none text-white"
                >
                  Generate AI Summary
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Key Findings</label>
                <ul className="mt-3 space-y-4">
                  {(feedback.aiSummary.bulletPoints || []).map((pt, i) => (
                    <li key={i} className="text-sm text-gray-700 flex gap-3">
                      <span className="flex-shrink-0 w-5 h-5 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center text-[10px] font-bold">{i + 1}</span> {pt}
                    </li>
                  ))}
                </ul>
                <div className="pt-6 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Sentiment</span>
                  <span className={`px-2 py-1 rounded-md font-bold text-[10px] uppercase ${
                    feedback.aiSummary.sentiment?.toLowerCase().includes('positive') 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {feedback.aiSummary.sentiment || 'Neutral'}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 text-white shadow-xl">
            <div className="flex gap-3 items-center mb-4">
              <FileText className="text-blue-400" size={20} />
              <h4 className="text-sm font-bold">Visual Analysis</h4>
            </div>
            <div className="max-h-48 overflow-y-auto text-xs italic text-gray-400 leading-relaxed">
              {feedback.aiSummary?.transcript ? `"${feedback.aiSummary.transcript}"` : "No visual analysis available."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackDetail;