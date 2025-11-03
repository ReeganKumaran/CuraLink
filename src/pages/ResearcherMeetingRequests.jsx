import React, { useState, useEffect } from 'react';
import { Mail, Phone, Calendar, Clock, CheckCircle, XCircle, User } from 'lucide-react';
import healthExpertsService from '../services/healthExpertsService';

const ResearcherMeetingRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, pending, accepted, rejected, completed

  useEffect(() => {
    fetchMeetingRequests();
  }, []);

  const fetchMeetingRequests = async () => {
    try {
      setLoading(true);
      const data = await healthExpertsService.getResearcherMeetingRequests();
      setRequests(data.requests || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load meeting requests');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId, newStatus) => {
    try {
      await healthExpertsService.updateMeetingRequestStatus(requestId, newStatus);
      // Update local state
      setRequests(requests.map(req =>
        req.id === requestId ? { ...req, status: newStatus } : req
      ));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const filteredRequests = requests.filter(req => {
    if (filter === 'all') return true;
    return req.status === filter;
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      accepted: { bg: 'bg-green-100', text: 'text-green-800', label: 'Accepted' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
      completed: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Completed' },
      awaiting_researcher_join: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Awaiting Join' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-3 py-1 ${config.bg} ${config.text} text-xs font-medium rounded-full`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRequestCounts = () => {
    return {
      all: requests.length,
      pending: requests.filter(r => r.status === 'pending').length,
      accepted: requests.filter(r => r.status === 'accepted').length,
      rejected: requests.filter(r => r.status === 'rejected').length,
      completed: requests.filter(r => r.status === 'completed').length
    };
  };

  const counts = getRequestCounts();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Meeting Requests</h1>
          <p className="text-gray-600">
            Manage meeting requests from patients
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex gap-6">
            <button
              onClick={() => setFilter('all')}
              className={`pb-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                filter === 'all'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              All ({counts.all})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`pb-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                filter === 'pending'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Pending ({counts.pending})
            </button>
            <button
              onClick={() => setFilter('accepted')}
              className={`pb-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                filter === 'accepted'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Accepted ({counts.accepted})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`pb-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                filter === 'completed'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Completed ({counts.completed})
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Requests List */}
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <div
              key={request.id}
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                      {request.patient_name}
                    </h3>
                    <div className="flex flex-col gap-1 text-sm text-gray-600">
                      {request.patient_email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          <a href={`mailto:${request.patient_email}`} className="hover:text-primary-600">
                            {request.patient_email}
                          </a>
                        </div>
                      )}
                      {request.patient_contact && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          <span>{request.patient_contact}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {getStatusBadge(request.status)}
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    {formatDate(request.created_at)}
                  </div>
                </div>
              </div>

              {/* Patient Notes */}
              {request.patient_notes && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-1">Patient's Message:</p>
                  <p className="text-sm text-gray-600">{request.patient_notes}</p>
                </div>
              )}

              {/* Actions */}
              {request.status === 'pending' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleStatusUpdate(request.id, 'accepted')}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Accept
                  </button>
                  <button
                    onClick={() => handleStatusUpdate(request.id, 'rejected')}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              )}

              {request.status === 'accepted' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleStatusUpdate(request.id, 'completed')}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    Mark as Completed
                  </button>
                  <a
                    href={`mailto:${request.patient_email}`}
                    className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    Email Patient
                  </a>
                </div>
              )}

              {request.status === 'rejected' && (
                <div className="text-sm text-gray-500 italic">
                  This meeting request was declined
                </div>
              )}

              {request.status === 'completed' && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  Meeting completed
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredRequests.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {filter === 'all'
                ? 'No meeting requests yet'
                : `No ${filter} meeting requests`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResearcherMeetingRequests;
