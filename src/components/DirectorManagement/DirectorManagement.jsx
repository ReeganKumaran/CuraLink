import React, { useState, useEffect } from 'react';
import { Users, CheckCircle, Clock, AlertCircle, TrendingUp, Filter } from 'lucide-react';
import directorReviewService from '../../services/directorReviewService';
import ReviewAnalyticsCard from './ReviewAnalyticsCard';
import DirectorReviewList from './DirectorReviewList';

const DirectorManagement = () => {
  const [analytics, setAnalytics] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDirector, setSelectedDirector] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = async (status = 'all', directorId = null) => {
    setLoading(true);
    setError(null);

    try {
      let data;
      const params = {};

      if (directorId) {
        params.directorUserId = directorId;
      }

      if (status !== 'all') {
        params.reviewStatus = status;
      }

      data = await directorReviewService.getAnalytics(params);
      setAnalytics(data);
    } catch (err) {
      setError('Failed to fetch analytics data. Please try again.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(selectedStatus, selectedDirector);
  }, [selectedStatus, selectedDirector]);

  const handleCardClick = (status) => {
    setSelectedStatus(status);
    fetchAnalytics(status, selectedDirector);
  };

  const handleDirectorFilter = (directorId) => {
    setSelectedDirector(directorId);
    fetchAnalytics(selectedStatus, directorId);
  };

  const analyticsCards = [
    {
      title: 'All Reviews',
      value: analytics?.totalReviews || 0,
      icon: <Users className="w-5 h-5" />,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      status: 'all',
    },
    {
      title: 'Completed Reviews',
      value: analytics?.completedReviews || 0,
      icon: <CheckCircle className="w-5 h-5" />,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      status: 'completed',
    },
    {
      title: 'Pending Reviews',
      value: analytics?.pendingReviews || 0,
      icon: <Clock className="w-5 h-5" />,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      status: 'pending',
    },
    {
      title: 'Completion Rate',
      value: analytics?.completionRate ? `${analytics.completionRate}%` : '0%',
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      status: null,
    },
  ];

  if (loading && !analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
        <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
        <span className="text-red-700">{error}</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Director Management</h1>
        <p className="text-gray-600">Monitor and analyze director review performance</p>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
            <select
              value={selectedDirector || ''}
              onChange={(e) => handleDirectorFilter(e.target.value || null)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Directors</option>
              {analytics?.directors?.map((director) => (
                <option key={director.id} value={director.id}>
                  {director.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Status:</span>
            <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-md text-sm font-medium">
              {selectedStatus === 'all' ? 'All' : selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)}
            </span>
          </div>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {analyticsCards.map((card, index) => (
          <ReviewAnalyticsCard
            key={index}
            title={card.title}
            value={card.value}
            icon={card.icon}
            color={card.color}
            bgColor={card.bgColor}
            borderColor={card.borderColor}
            onClick={card.status ? () => handleCardClick(card.status) : null}
            isActive={selectedStatus === card.status}
          />
        ))}
      </div>

      {/* Review Details Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {selectedStatus === 'all' ? 'All Reviews' :
             selectedStatus === 'completed' ? 'Completed Reviews' : 'Pending Reviews'}
          </h2>
        </div>
        <DirectorReviewList
          reviews={analytics?.reviews || []}
          loading={loading}
          selectedStatus={selectedStatus}
        />
      </div>
    </div>
  );
};

export default DirectorManagement;