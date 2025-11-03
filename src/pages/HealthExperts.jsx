import React, { useState, useEffect } from 'react';
import { Search, MapPin, BookOpen, Mail, ExternalLink, Users } from 'lucide-react';
import healthExpertsService from '../services/healthExpertsService';

const HealthExperts = () => {
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExpert, setSelectedExpert] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestForm, setRequestForm] = useState({
    notes: '',
    contact: ''
  });
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState('');

  useEffect(() => {
    fetchHealthExperts();
  }, []);

  const fetchHealthExperts = async () => {
    try {
      setLoading(true);
      const data = await healthExpertsService.getHealthExperts();
      setExperts(data.experts || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load health experts');
    } finally {
      setLoading(false);
    }
  };

  const filteredExperts = experts.filter(expert => {
    const search = searchTerm.toLowerCase();
    return (
      expert.name?.toLowerCase().includes(search) ||
      expert.institution?.toLowerCase().includes(search) ||
      expert.specialties?.some(s => s.toLowerCase().includes(search)) ||
      expert.researchInterests?.toLowerCase().includes(search)
    );
  });

  const handleRequestMeeting = (expert) => {
    setSelectedExpert(expert);
    setShowRequestModal(true);
    setRequestSuccess('');
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    setRequestLoading(true);
    setError('');

    try {
      const response = await healthExpertsService.requestMeeting({
        researcherId: selectedExpert.id,
        notes: requestForm.notes,
        contact: requestForm.contact
      });

      setRequestSuccess(response.message || 'Meeting request sent successfully!');
      setTimeout(() => {
        setShowRequestModal(false);
        setRequestForm({ notes: '', contact: '' });
        setSelectedExpert(null);
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send meeting request');
    } finally {
      setRequestLoading(false);
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Health Experts</h1>
          <p className="text-gray-600">
            Connect with leading researchers and experts in your area of interest
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, institution, or specialty..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {error && !showRequestModal && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Experts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExperts.map((expert) => (
            <div
              key={expert.id}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6"
            >
              {/* Expert Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">
                    {expert.name}
                  </h3>
                  {expert.institution && (
                    <p className="text-sm text-gray-600 flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {expert.institution}
                    </p>
                  )}
                </div>
                {expert.isActive && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                    Active
                  </span>
                )}
              </div>

              {/* Specialties */}
              {expert.specialties && expert.specialties.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {expert.specialties.slice(0, 3).map((specialty, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-primary-50 text-primary-700 text-xs font-medium rounded-full"
                      >
                        {specialty}
                      </span>
                    ))}
                    {expert.specialties.length > 3 && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                        +{expert.specialties.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Research Interests */}
              {expert.researchInterests && (
                <div className="mb-4">
                  <p className="text-sm text-gray-700 line-clamp-2">
                    <BookOpen className="w-4 h-4 inline mr-1 text-gray-400" />
                    {expert.researchInterests}
                  </p>
                </div>
              )}

              {/* Publications Count */}
              {expert.publicationsCount > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600">
                    <Users className="w-4 h-4 inline mr-1" />
                    {expert.publicationsCount} Publications
                  </p>
                </div>
              )}

              {/* Links */}
              <div className="flex gap-2 mb-4">
                {expert.orcid && (
                  <a
                    href={`https://orcid.org/${expert.orcid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary-600 hover:text-primary-700 flex items-center"
                  >
                    ORCID <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                )}
                {expert.researchGate && (
                  <a
                    href={expert.researchGate}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary-600 hover:text-primary-700 flex items-center"
                  >
                    ResearchGate <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleRequestMeeting(expert)}
                  className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                >
                  Request Meeting
                </button>
                {expert.email && (
                  <a
                    href={`mailto:${expert.email}`}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Mail className="w-5 h-5 text-gray-600" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredExperts.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500">No health experts found matching your search.</p>
          </div>
        )}
      </div>

      {/* Meeting Request Modal */}
      {showRequestModal && selectedExpert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Request Meeting
            </h2>
            <p className="text-gray-600 mb-6">
              Request a meeting with <strong>{selectedExpert.name}</strong>
            </p>

            {requestSuccess && (
              <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                {requestSuccess}
              </div>
            )}

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmitRequest}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Information *
                </label>
                <input
                  type="text"
                  value={requestForm.contact}
                  onChange={(e) => setRequestForm({ ...requestForm, contact: e.target.value })}
                  placeholder="Email or phone number"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message / Notes
                </label>
                <textarea
                  value={requestForm.notes}
                  onChange={(e) => setRequestForm({ ...requestForm, notes: e.target.value })}
                  placeholder="Tell the researcher about your condition or what you'd like to discuss..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {!selectedExpert.isActive && (
                <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg text-sm">
                  This researcher is not currently active on the platform. They will be notified to join.
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowRequestModal(false);
                    setRequestForm({ notes: '', contact: '' });
                    setError('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={requestLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={requestLoading || !requestForm.contact}
                  className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {requestLoading ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthExperts;
