import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { feedbackApi } from '../api/feedbackApi';
import Button from '../components/ui/Button';
import { Plus, MessageSquare, BarChart3, Play, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

const Dashboard = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData(pagination.currentPage);
  }, [pagination.currentPage]);

  const fetchData = async (page) => {
    setIsLoading(true);
    try {
      const data = await feedbackApi.getAll(page); // Fetches top 10 recent
      setFeedbacks(data.feedbacks);
      setPagination({ currentPage: data.currentPage, totalPages: data.totalPages });
    } catch (error) {
      console.error("Error fetching data", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this feedback?")) {
      try {
        await feedbackApi.delete(id);
        fetchData(pagination.currentPage); // Refresh list
      } catch (error) {
        alert("Failed to delete feedback");
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button onClick={() => navigate('/upload')} className="flex items-center gap-2">
          <Plus size={18} /> New Collection
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Title</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Created At</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {feedbacks.map((f) => (
              <tr key={f._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900">{f.title}</td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(f.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs ${f.aiSummary ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {f.aiSummary ? 'Analyzed' : 'Pending'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right flex justify-end gap-4">
                  <button onClick={() => navigate(`/feedback/${f._id}`)} className="text-blue-600 hover:underline text-sm font-medium">View</button>
                  <button onClick={() => handleDelete(f._id)} className="text-red-500 hover:text-red-700">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination UI */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
          <p className="text-sm text-gray-600">Page {pagination.currentPage} of {pagination.totalPages}</p>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              disabled={pagination.currentPage === 1}
              onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
            >
              <ChevronLeft size={16} /> Previous
            </Button>
            <Button 
              variant="outline" 
              disabled={pagination.currentPage >= pagination.totalPages}
              onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
            >
              Next <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;