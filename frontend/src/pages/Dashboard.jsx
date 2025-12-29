import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { useAuthStore } from '../store/useAuthStore';
import Button from '../components/ui/Button';
import { Plus, MessageSquare, BarChart3, Users, Play } from 'lucide-react';

const Dashboard = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await axiosInstance.get('/feedback');
        setFeedbacks(res.data);
      } catch (error) {
        console.error("Error fetching data", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        {/* NEW COLLECTION BUTTON -> Navigate to upload */}
        <Button onClick={() => navigate('/upload')} className="flex items-center gap-2">
          <Plus size={18} /> New Collection
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Feedback" value={feedbacks.length} icon={<MessageSquare />} />
        <StatCard title="Active Videos" value={feedbacks.filter(f => f.video).length} icon={<Play />} />
        <StatCard title="Insights" value={feedbacks.filter(f => f.aiSummary).length} icon={<BarChart3 />} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Title</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Action</th>
            </tr>
          </thead>
          <tbody>
            {feedbacks.map((f) => (
  <tr key={f._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
    <td className="px-6 py-4 font-medium text-gray-900">{f.title}</td>
    <td className="px-6 py-4">
       {/* Conditional Badge for AI status */}
       <span className={`px-2 py-1 rounded-full text-xs ${f.aiSummary ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
         {f.aiSummary ? 'Analyzed' : 'Pending AI'}
       </span>
    </td>
    <td className="px-6 py-4">
      <button 
        onClick={() => navigate(`/feedback/${f._id}`)} // Uses MongoDB _id
        className="text-blue-600 hover:underline text-sm font-medium"
      >
        View AI Summary
      </button>
    </td>
  </tr>
))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon }) => (
  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
    <div className="flex items-center justify-between mb-4">
      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">{icon}</div>
    </div>
    <p className="text-sm font-medium text-gray-500">{title}</p>
    <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
  </div>
);

export default Dashboard;