import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart, Users, BookOpen, FileText, MessageCircle, Star,
  Search, Calendar, MapPin, LogOut, User, X, ExternalLink, Sparkles
} from 'lucide-react';
import { logo } from '../assets/assets';
import authService from '../services/authService';
import aiService from '../services/aiService';
import expertService from '../services/expertService';
import clinicalTrialService from '../services/clinicalTrialService';
import api from '../services/api';
import { useForumData } from '../hooks/useForumData';
import ChatWidget from '../components/ChatWidget';

const PatientDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const { questions, addQuestion } = useForumData();
  const [isAskModalOpen, setIsAskModalOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [askForm, setAskForm] = useState({
    category: 'Cancer Research',
    title: '',
    question: '',
  });
  const [askAIDrafting, setAskAIDrafting] = useState(false);
  const [askAIError, setAskAIError] = useState(null);
  const [experts, setExperts] = useState([]);
  const [expertsLoading, setExpertsLoading] = useState(false);
  const [expertsError, setExpertsError] = useState(null);
  const [expertSearch, setExpertSearch] = useState('');
  const [followedExpertIds, setFollowedExpertIds] = useState([]);
  const searchDebounceRef = useRef(null);
  const [clinicalTrials, setClinicalTrials] = useState([]);
  const [trialsLoading, setTrialsLoading] = useState(false);
  const [trialsError, setTrialsError] = useState(null);
  const [trialFilters, setTrialFilters] = useState({ phase: 'all', location: 'all' });
  const [trialSearch, setTrialSearch] = useState('');
  const trialSearchDebounceRef = useRef(null);
  const trialSearchRef = useRef('');
  const loadClinicalTrialsRef = useRef(() => {});
  const [selectedTrial, setSelectedTrial] = useState(null);
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [selectedExpert, setSelectedExpert] = useState(null);
  const [meetingForm, setMeetingForm] = useState({
    name: '',
    email: '',
    contact: '',
    notes: '',
  });
  const [meetingSubmitting, setMeetingSubmitting] = useState(false);
  const [meetingFeedback, setMeetingFeedback] = useState(null);
  const [meetingRequests, setMeetingRequests] = useState([]);
  const [meetingRequestsLoading, setMeetingRequestsLoading] = useState(false);
  const [meetingRequestsError, setMeetingRequestsError] = useState(null);
  const [aiGeneratingNotes, setAiGeneratingNotes] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Check if user is authenticated
        if (!authService.isAuthenticated()) {
          navigate('/login');
          return;
        }

        // Get current user from backend
        const userData = await authService.getCurrentUser();

        // Check if user has correct role
        if (userData.user.role !== 'patient') {
          navigate('/login');
          return;
        }

        const favorites = Array.isArray(userData.profile?.favorites?.experts)
          ? userData.profile.favorites.experts
          : [];

        setUserProfile({
          name: userData.user.name,
          email: userData.user.email,
          condition: userData.profile?.condition || 'Not specified',
          city: userData.profile?.city,
          country: userData.profile?.country,
          favorites,
        });
        setFollowedExpertIds(favorites);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
        navigate('/login');
      }
    };

    fetchUserData();
  }, [navigate]);

  useEffect(() => {
    if (!isAskModalOpen) {
      setAskAIDrafting(false);
      setAskAIError(null);
    }
  }, [isAskModalOpen]);

  const handleLogout = () => {
    authService.logout();
    navigate('/');
  };

  const categories = useMemo(
    () => [
      'Cancer Research',
      'Clinical Trials',
      'Treatment Options',
      'General Support',
    ],
    []
  );

  const handleAskQuestionSubmit = (e) => {
    e.preventDefault();
    if (!askForm.title.trim() || !askForm.question.trim()) {
      return;
    }
    setAskAIError(null);

    addQuestion({
      ...askForm,
      authorRole: 'patient',
      authorName: userProfile?.name || 'Patient',
    });
    setAskForm({
      category: 'Cancer Research',
      title: '',
      question: '',
    });
    setIsAskModalOpen(false);
  };

  const handleAskAIAssist = async () => {
    if (!askForm.title.trim()) {
      setAskAIError('Enter a title so the assistant knows what you want to ask.');
      return;
    }

    setAskAIError(null);
    setAskAIDrafting(true);
    try {
      const result = await aiService.draftPatientQuestion({
        title: askForm.title,
        category: askForm.category,
        background: askForm.question,
      });
      setAskForm((prev) => ({
        ...prev,
        title: result.title || prev.title,
        question: result.question || prev.question,
      }));
    } catch (error) {
      const message =
        error?.response?.data?.message || 'Unable to generate a question right now. Please try again.';
      setAskAIError(message);
    } finally {
      setAskAIDrafting(false);
    }
  };

  const openDiscussion = (question) => {
    setSelectedQuestion(question);
  };

  const closeDiscussion = () => {
    setSelectedQuestion(null);
  };

const handleAskFormChange = (field) => (event) => {
  setAskForm((prev) => ({
    ...prev,
    [field]: event.target.value,
  }));
};

const formatDate = (isoString) => {
  const date = new Date(isoString);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const handleTrialFilterChange = (field) => (event) => {
  const value = event.target.value;
  setTrialFilters((prev) => ({
    ...prev,
    [field]: value,
  }));
};

const handleTrialSearchChange = (event) => {
  const value = event.target.value;
  setTrialSearch(value);
  trialSearchRef.current = value.trim();
};

const getTrialStatusStyles = (status) => {
  const normalized = (status || '').toLowerCase();
  if (normalized.includes('recruit') || normalized.includes('enroll')) {
    return 'bg-green-100 text-green-700';
  }
  if (normalized.includes('complete') || normalized.includes('closed')) {
    return 'bg-gray-100 text-gray-700';
  }
  if (normalized.includes('suspend') || normalized.includes('pause')) {
    return 'bg-yellow-100 text-yellow-700';
  }
  return 'bg-primary-100 text-primary-700';
};

const openTrialDetails = (trial) => {
  setSelectedTrial(trial);
};

const closeTrialDetails = () => {
  setSelectedTrial(null);
};

const loadClinicalTrials = useCallback(
  async (overrideSearch) => {
    if (!userProfile) return;
    setTrialsLoading(true);
    setTrialsError(null);
    try {
      const params = {
        limit: 40,
        includeExternal: true, // Always include external trials for patients
      };

      if (trialFilters.phase !== 'all') {
        params.phase = trialFilters.phase;
      }

      if (trialFilters.location === 'remote') {
        params.remote = true;
      } else if (trialFilters.location === 'near') {
        params.remote = false;
        if (userProfile?.city) params.city = userProfile.city;
        if (userProfile?.country) params.country = userProfile.country;
      }

      // Don't filter by patient condition - show all trials
      // if (userProfile?.condition && userProfile.condition !== 'Not specified') {
      //   params.condition = userProfile.condition;
      // }

      const searchTerm =
        typeof overrideSearch === 'string' ? overrideSearch.trim() : trialSearchRef.current;
      if (searchTerm) {
        params.search = searchTerm;
      }

      console.log('Patient fetching trials with params:', params);
      const { trials } = await clinicalTrialService.fetchClinicalTrials(params);
      console.log('Patient received trials:', trials?.length, 'trials');
      console.log('Trial sources:', trials?.map(t => ({ title: t.title?.substring(0, 50), source: t.source })));
      setClinicalTrials(trials || []);
    } catch (error) {
      console.error('Failed to load clinical trials:', error);
      setTrialsError('Unable to load clinical trials right now. Please try again.');
    } finally {
      setTrialsLoading(false);
    }
  },
  [userProfile, trialFilters]
);

useEffect(() => {
  loadClinicalTrialsRef.current = loadClinicalTrials;
}, [loadClinicalTrials]);

const handleFollowToggle = async (expert) => {
  if (!expert || expert.source !== 'platform' || !expert.id) {
    setExpertsError('Following is only available for CuraLink researchers.');
    return;
  }

  const isFollowed = followedExpertIds.includes(expert.id);

  try {
    setExpertsError(null);
    if (isFollowed) {
      await api.delete(`/patients/favorites/experts/${expert.id}`);
      setFollowedExpertIds((prev) => prev.filter((id) => id !== expert.id));
      setUserProfile((prev) => {
        if (!prev) return prev;
        const favorites = new Set(prev.favorites || []);
        favorites.delete(expert.id);
        return { ...prev, favorites: Array.from(favorites) };
      });
    } else {
      await api.post(`/patients/favorites/experts/${expert.id}`);
      setFollowedExpertIds((prev) => (prev.includes(expert.id) ? prev : [...prev, expert.id]));
      setUserProfile((prev) => {
        if (!prev) return prev;
        const favorites = new Set(prev.favorites || []);
        favorites.add(expert.id);
        return { ...prev, favorites: Array.from(favorites) };
      });
    }
  } catch (error) {
    console.error('Failed to toggle follow:', error);
    setExpertsError('Unable to update follow status right now. Please try again.');
  }
};

const openMeetingModal = (expert) => {
  setSelectedExpert(expert);
  setMeetingFeedback(null);
  setMeetingForm({
    name: userProfile?.name || '',
    email: userProfile?.email || '',
    contact: '',
    notes: '',
  });
  setIsMeetingModalOpen(true);
};

const closeMeetingModal = () => {
  setIsMeetingModalOpen(false);
  setSelectedExpert(null);
};

const handleRequestMeeting = (expert) => {
  openMeetingModal(expert);
};

const handleAiAssistNotes = async () => {
  if (!userProfile?.condition || userProfile.condition === 'Not specified') {
    setMeetingFeedback({
      type: 'warning',
      message: 'Please update your condition in your profile to use AI assist.',
    });
    return;
  }

  setAiGeneratingNotes(true);
  setMeetingFeedback(null);

  try {
    const prompt = `I am a patient with ${userProfile.condition}${
      selectedExpert?.specialties
        ? ` seeking to meet with a health expert specializing in ${selectedExpert.specialties.join(', ')}`
        : ''
    }. Write a brief, professional message (2-3 sentences) explaining my interest in scheduling a meeting to discuss my condition and potential treatment options.`;

    const response = await aiService.generateText({ prompt });

    setMeetingForm((prev) => ({
      ...prev,
      notes: response.output || '',
    }));

    setMeetingFeedback({
      type: 'success',
      message: 'AI-generated notes added! Feel free to edit them.',
    });
  } catch (error) {
    console.error('AI assist error:', error);
    setMeetingFeedback({
      type: 'error',
      message: 'Failed to generate notes. Please write them manually.',
    });
  } finally {
    setAiGeneratingNotes(false);
  }
};

const handleMeetingFormChange = (field) => (event) => {
  const value = event.target.value;
  setMeetingForm((prev) => ({
    ...prev,
    [field]: value,
  }));
};

const handleMeetingSubmit = async (event) => {
  event.preventDefault();
  if (!selectedExpert) {
    setMeetingFeedback({ type: 'error', message: 'Select an expert before requesting a meeting.' });
    return;
  }

  if (!meetingForm.contact.trim()) {
    setMeetingFeedback({ type: 'error', message: 'Please provide your contact details so the expert can reach you.' });
    return;
  }

  setMeetingSubmitting(true);
  setMeetingFeedback(null);

  try {
    const payload = {
      researcherId: selectedExpert.source === 'platform' ? selectedExpert.id : null,
      researcherName: selectedExpert.name,
      researcherEmail: selectedExpert.email,
      patientName: meetingForm.name || userProfile?.name,
      patientEmail: meetingForm.email || userProfile?.email,
      patientContact: meetingForm.contact,
      patientNotes: meetingForm.notes,
    };

    const result = await expertService.requestMeeting(payload);
    if (result.emailError) {
      setMeetingFeedback({
        type: 'warning',
        message: 'Request saved, but we could not notify the expert automatically. Our team will follow up.',
      });
    } else {
      setMeetingFeedback({
        type: 'success',
        message: 'Your meeting request was sent successfully. We will notify you once the expert responds.',
      });
    }
    setMeetingForm((prev) => ({ ...prev, contact: '', notes: '' }));
    await loadMeetingRequests();
  } catch (error) {
    console.error('Failed to submit meeting request:', error);
    const message =
      error?.response?.data?.message ||
      'Unable to submit the meeting request right now. Please try again later.';
    setMeetingFeedback({ type: 'error', message });
  } finally {
    setMeetingSubmitting(false);
  }
};

  const loadExperts = useCallback(
    async (term = '') => {
      if (!userProfile) return;
      setExpertsLoading(true);
      setExpertsError(null);
      try {
        const conditionFilter =
          userProfile.condition && userProfile.condition !== 'Not specified'
            ? userProfile.condition
            : undefined;

        const { experts: fetchedExperts } = await expertService.fetchExperts({
          search: term,
          condition: conditionFilter,
        });
        setExperts(fetchedExperts || []);
      } catch (error) {
        console.error('Failed to load experts:', error);
        setExpertsError('Unable to load experts right now. Please try again.');
      } finally {
        setExpertsLoading(false);
      }
    },
    [userProfile]
  );

  const loadMeetingRequests = useCallback(async () => {
    if (!userProfile) return;
    setMeetingRequestsLoading(true);
    setMeetingRequestsError(null);
    try {
      const { requests } = await expertService.fetchPatientMeetingRequests();
      console.log('Patient meeting requests received:', requests);
      console.log('First request details:', requests?.[0]);
      setMeetingRequests(requests || []);
    } catch (error) {
      console.error('Failed to load meeting requests:', error);
      setMeetingRequestsError('Unable to load meeting requests right now. Please try again.');
    } finally {
      setMeetingRequestsLoading(false);
    }
  }, [userProfile]);

  useEffect(() => {
    if (!userProfile) return;
    loadExperts('');
    loadMeetingRequests();
  }, [userProfile, loadExperts, loadMeetingRequests]);

  useEffect(() => {
    if (!userProfile) return;
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = setTimeout(() => {
      loadExperts(expertSearch);
    }, 400);
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [expertSearch, userProfile, loadExperts]);

  useEffect(() => {
    if (!userProfile) return;
    loadClinicalTrials(trialSearchRef.current);
  }, [userProfile, trialFilters, loadClinicalTrials]);

  useEffect(() => {
    if (!userProfile) return;
    if (trialSearchDebounceRef.current) {
      clearTimeout(trialSearchDebounceRef.current);
    }
    trialSearchDebounceRef.current = setTimeout(() => {
      loadClinicalTrialsRef.current(trialSearchRef.current);
    }, 400);
    return () => {
      if (trialSearchDebounceRef.current) {
        clearTimeout(trialSearchDebounceRef.current);
      }
    };
  }, [trialSearch, userProfile]);

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: <Heart /> },
    { id: 'experts', label: 'Health Experts', icon: <Users /> },
    { id: 'trials', label: 'Clinical Trials', icon: <FileText /> },
    { id: 'publications', label: 'Publications', icon: <BookOpen /> },
    { id: 'forums', label: 'Forums', icon: <MessageCircle /> },
    { id: 'favorites', label: 'My Favorites', icon: <Star /> },
  ];

  const mockPublications = [
    { id: 1, title: 'Recent Advances in Cancer Immunotherapy', journal: 'Nature Medicine', year: 2024 },
    { id: 2, title: 'Targeted Therapy for Glioblastoma', journal: 'The Lancet', year: 2024 },
    { id: 3, title: 'AI in Clinical Trial Matching', journal: 'Science', year: 2023 },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="card">
                <h3 className="text-lg font-semibold mb-2">Recommended Experts</h3>
                <p className="text-3xl font-bold text-primary-600">{experts.length}</p>
                <p className="text-sm text-gray-500">Based on your condition</p>
              </div>
              <div className="card">
                <h3 className="text-lg font-semibold mb-2">Matching Trials</h3>
                <p className="text-3xl font-bold text-primary-600">{clinicalTrials.length}</p>
                <p className="text-sm text-gray-500">Available trials</p>
              </div>
              <div className="card">
                <h3 className="text-lg font-semibold mb-2">Meeting Requests</h3>
                <p className="text-3xl font-bold text-primary-600">{meetingRequests.length}</p>
                <p className="text-sm text-gray-500">Total requests</p>
              </div>
            </div>

            <div className="card">
              <h3 className="text-xl font-semibold mb-4">Meeting Requests</h3>
              {meetingRequestsLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((item) => (
                    <div key={item} className="animate-pulse h-20 bg-gray-100 rounded-lg" />
                  ))}
                </div>
              ) : meetingRequests.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No meeting requests yet. Visit the Health Experts tab to request meetings with researchers.
                </div>
              ) : (
                <div className="space-y-3">
                  {meetingRequests.slice(0, 5).map((request) => (
                    <div key={request.id} className="border-b last:border-b-0 py-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{request.researcher_name}</p>
                          <p className="text-xs text-gray-500">
                            Requested on {formatDate(request.created_at)}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                            request.status === 'accepted'
                              ? 'bg-green-100 text-green-700'
                              : request.status === 'completed'
                              ? 'bg-blue-100 text-blue-700'
                              : request.status === 'rejected'
                              ? 'bg-red-100 text-red-600'
                              : request.status === 'pending_admin'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {request.status === 'pending_admin' ? 'pending admin' : request.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      {request.scheduled_at && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-2">
                          <p className="text-sm font-medium text-green-900">
                            📅 Scheduled for{' '}
                            {new Date(request.scheduled_at).toLocaleString(undefined, {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </p>
                          {request.response_notes && (
                            <p className="text-sm text-green-800 mt-2">
                              <span className="font-medium">Notes:</span> {request.response_notes}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {meetingRequests.length > 5 && (
                <button
                  onClick={() => setActiveTab('experts')}
                  className="mt-4 text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  View all {meetingRequests.length} requests →
                </button>
              )}
            </div>

            <div className="card">
              <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {meetingRequests.slice(0, 3).map((request, index) => (
                  <div key={request.id} className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm text-gray-600">
                      {request.status === 'accepted'
                        ? `${request.researcher_name} accepted your meeting request`
                        : request.status === 'rejected'
                        ? `${request.researcher_name} declined your meeting request`
                        : request.status === 'completed'
                        ? `Meeting with ${request.researcher_name} completed`
                        : `Meeting request sent to ${request.researcher_name}`}
                    </span>
                    <span className="text-xs text-gray-500">{formatDate(request.created_at)}</span>
                  </div>
                ))}
                {meetingRequests.length === 0 && (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    Your activity will appear here
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'experts':
        return (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">Health Experts</h2>
                <p className="text-sm text-gray-500">
                  Specialists curated for your needs
                  {userProfile?.condition ? ` (${userProfile.condition})` : ''}
                </p>
              </div>
              <div className="relative w-full md:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={expertSearch}
                  onChange={(event) => setExpertSearch(event.target.value)}
                  placeholder="Search experts by name, specialty, or institution..."
                  className="pl-10 pr-4 py-2 border rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {expertsError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {expertsError}
              </div>
            )}

            {expertsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((skeleton) => (
                  <div key={skeleton} className="card animate-pulse h-24" />
                ))}
              </div>
            ) : experts.length === 0 ? (
              <div className="card text-center py-10">
                <p className="text-sm text-gray-500">
                  No experts matched your search. Try a different keyword or broaden your filters.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {experts.map((expert) => {
                  const isFollowed = expert.id && followedExpertIds.includes(expert.id);
                  return (
                    <div
                      key={expert.id || expert.name}
                      className="card flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center shrink-0">
                          <User className="w-6 h-6 text-primary-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{expert.name}</h3>
                            {expert.source === 'external' && (
                              <span className="text-xs rounded-full bg-gray-100 text-gray-600 px-2 py-0.5">
                                External
                              </span>
                            )}
                            {expert.availableForMeetings ? (
                              <span className="text-xs rounded-full bg-green-100 text-green-600 px-2 py-0.5">
                                Accepting meetings
                              </span>
                            ) : (
                              <span className="text-xs rounded-full bg-yellow-100 text-yellow-600 px-2 py-0.5">
                                Admin follow-up
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            {expert.specialties && expert.specialties.length > 0
                              ? expert.specialties.join(', ')
                              : expert.researchInterests || 'Specialty not listed'}
                          </p>
                          <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
                            <MapPin className="w-4 h-4" />
                            <span>{expert.location || expert.institution || 'Location not specified'}</span>
                          </div>
                          {expert.researchInterests && (
                            <p className="text-sm text-gray-500 mt-2">
                              <span className="font-medium text-gray-700">Research focus:</span>{' '}
                              {expert.researchInterests}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleFollowToggle(expert)}
                          disabled={expert.source !== 'platform'}
                          className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                            isFollowed
                              ? 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                              : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                          } ${expert.source !== 'platform' ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                          {isFollowed ? 'Following' : 'Follow'}
                        </button>
                        <button
                          onClick={() => openMeetingModal(expert)}
                          className="btn-primary px-4 py-2 rounded-full text-sm font-semibold"
                        >
                          Request Meeting
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">Meeting Requests</h3>
              {meetingRequestsError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {meetingRequestsError}
                </div>
              )}
              {meetingRequestsLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((item) => (
                    <div key={item} className="card h-20 animate-pulse" />
                  ))}
                </div>
              ) : meetingRequests.length === 0 ? (
                <div className="card text-sm text-gray-500 py-6 text-center">
                  You haven’t requested any meetings yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {meetingRequests.map((request) => (
                    <div key={request.id} className="card">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <p className="text-base font-semibold text-gray-900">{request.researcher_name}</p>
                          <p className="text-xs text-gray-500">
                            Requested on {formatDate(request.created_at)}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                            request.status === 'accepted'
                              ? 'bg-green-100 text-green-700'
                              : request.status === 'completed'
                              ? 'bg-blue-100 text-blue-700'
                              : request.status === 'rejected'
                              ? 'bg-red-100 text-red-600'
                              : request.status === 'pending_admin'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {request.status === 'pending_admin' ? 'pending admin' : request.status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      {request.scheduled_at && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <div className="text-2xl">📅</div>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-green-900 mb-1">
                                Meeting Scheduled
                              </p>
                              <p className="text-sm text-green-800">
                                {new Date(request.scheduled_at).toLocaleString(undefined, {
                                  weekday: 'long',
                                  month: 'long',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                })}
                              </p>
                              {request.response_notes && (
                                <div className="mt-3 pt-3 border-t border-green-200">
                                  <p className="text-xs font-medium text-green-900 mb-1">Meeting Link / Notes:</p>
                                  <p className="text-sm text-green-800 break-all">
                                    {request.response_notes.startsWith('http') ? (
                                      <a
                                        href={request.response_notes}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary-600 hover:text-primary-700 underline"
                                      >
                                        {request.response_notes}
                                      </a>
                                    ) : (
                                      request.response_notes
                                    )}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'trials':
        return (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-2xl font-bold">Clinical Trials</h2>
                <p className="text-sm text-gray-500">
                  Curated studies for {userProfile?.condition && userProfile.condition !== 'Not specified'
                    ? userProfile.condition
                    : 'your interests'}
                </p>
              </div>
              <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={trialSearch}
                    onChange={handleTrialSearchChange}
                    placeholder="Search trials by title or condition..."
                    className="w-full rounded-lg border px-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <select
                  value={trialFilters.phase}
                  onChange={handleTrialFilterChange('phase')}
                  className="w-full rounded-lg border px-3 py-2 text-sm sm:w-auto"
                >
                  <option value="all">All Phases</option>
                  <option value="Phase I">Phase I</option>
                  <option value="Phase II">Phase II</option>
                  <option value="Phase III">Phase III</option>
                  <option value="Phase IV">Phase IV</option>
                </select>
                <select
                  value={trialFilters.location}
                  onChange={handleTrialFilterChange('location')}
                  className="w-full rounded-lg border px-3 py-2 text-sm sm:w-auto"
                >
                  <option value="all">All Locations</option>
                  <option value="near">Near Me</option>
                  <option value="remote">Remote Friendly</option>
                </select>
              </div>
            </div>

            {trialFilters.location === 'near' && !userProfile?.city && !userProfile?.country && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Add your city or country in your profile to surface trials near you.
              </div>
            )}

            {trialsError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {trialsError}
              </div>
            )}

            {trialsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((skeleton) => (
                  <div key={skeleton} className="card animate-pulse space-y-4">
                    <div className="h-4 w-3/4 rounded bg-slate-200" />
                    <div className="h-3 w-1/2 rounded bg-slate-200" />
                    <div className="h-24 w-full rounded bg-slate-100" />
                  </div>
                ))}
              </div>
            ) : clinicalTrials.length === 0 ? (
              <div className="card py-12 text-center">
                <p className="text-sm text-gray-500">
                  No trials matched your filters. Adjust your search or check back soon for new opportunities.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {clinicalTrials.map((trial) => {
                  const statusStyles = getTrialStatusStyles(trial.status);
                  const locationLabel = trial.isRemote
                    ? 'Remote Friendly'
                    : trial.location ||
                      [trial.city, trial.country].filter(Boolean).join(', ') ||
                      'Location not specified';
                  return (
                    <div key={trial.id} className="card p-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex-1">
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles}`}>
                              {trial.status || 'Status unknown'}
                            </span>
                            {trial.phase && (
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                                {trial.phase}
                              </span>
                            )}
                            {trial.isRemote && (
                              <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700">
                                Remote
                              </span>
                            )}
                            {trial.source === 'clinicaltrials.gov' && (
                              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                                ClinicalTrials.gov
                              </span>
                            )}
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">{trial.title}</h3>
                          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                            {trial.condition && <span>Condition: {trial.condition}</span>}
                            {trial.sponsor && (
                              <>
                                <span className="text-gray-300" aria-hidden="true">
                                  &bull;
                                </span>
                                <span>Sponsor: {trial.sponsor}</span>
                              </>
                            )}
                          </div>
                          {trial.summary && (
                            <p className="mt-3 text-sm text-gray-600 line-clamp-2">{trial.summary}</p>
                          )}
                          {Array.isArray(trial.tags) && trial.tags.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {trial.tags.slice(0, 4).map((tag) => (
                                <span
                                  key={`${trial.id}-${tag}`}
                                  className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="mr-2 h-4 w-4 text-primary-500" />
                            {locationLabel}
                          </div>
                          {trial.startDate && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Calendar className="mr-2 h-4 w-4 text-primary-500" />
                              Starts {formatDate(trial.startDate)}
                            </div>
                          )}
                          <button
                            onClick={() => openTrialDetails(trial)}
                            className="btn-primary rounded-full px-5 py-2 text-sm font-semibold"
                          >
                            View Details
                          </button>
                          {trial.signupUrl && (
                            <a
                              href={trial.signupUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"
                            >
                              Apply Online <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );

      case 'publications':
        navigate('/publications');
        return null;

      case 'forums':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Forum Discussions</h2>
                <p className="text-sm text-gray-600">
                  Ask questions and collaborate with the researcher community.
                </p>
              </div>
              <button
                onClick={() => setIsAskModalOpen(true)}
                className="btn-primary text-sm px-4 py-2"
              >
                Ask a Question
              </button>
            </div>

            <div className="space-y-4">
              {questions.map((question) => (
                <div key={question.id} className="card">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="inline-flex items-center rounded-full bg-primary-100 text-primary-700 text-xs font-medium px-3 py-1 mb-3">
                        {question.category}
                      </span>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {question.title}
                      </h3>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                        <span>
                          By{' '}
                          {question.authorRole === 'patient'
                            ? 'Patient'
                            : question.authorName || 'Member'}
                        </span>
                        <span aria-hidden="true">&bull;</span>
                        <span>{question.replies.length} {question.replies.length === 1 ? 'reply' : 'replies'}</span>
                        <span aria-hidden="true">&bull;</span>
                        <span>{formatDate(question.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                        {question.question}
                      </p>
                    </div>
                    <button
                      onClick={() => openDiscussion(question)}
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      View Discussion →
                    </button>
                  </div>
                </div>
              ))}

              {questions.length === 0 && (
                <div className="card text-center py-10">
                  <h3 className="text-lg font-semibold text-gray-800">No questions yet</h3>
                  <p className="text-sm text-gray-600 mt-2">
                    Be the first to ask a question and start a discussion with researchers.
                  </p>
                  <button
                    onClick={() => setIsAskModalOpen(true)}
                    className="btn-primary text-sm px-5 py-2 mt-4"
                  >
                    Ask a Question
                  </button>
                </div>
              )}
            </div>
          </div>
        );

      case 'favorites':
        const favoriteExperts = experts.filter((expert) => followedExpertIds.includes(expert.id));

        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">My Favorites</h2>
              <p className="text-sm text-gray-500 mt-1">Your followed health experts and saved items</p>
            </div>

            {/* Favorite Experts Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Followed Health Experts</h3>
              {expertsLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="card h-32 animate-pulse bg-gray-100" />
                  ))}
                </div>
              ) : favoriteExperts.length === 0 ? (
                <div className="card text-center py-12">
                  <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 mb-2">No favorite experts yet</p>
                  <p className="text-sm text-gray-500">
                    Visit the Health Experts tab to follow researchers
                  </p>
                  <button
                    onClick={() => setActiveTab('experts')}
                    className="mt-4 btn-primary px-4 py-2 text-sm"
                  >
                    Browse Experts
                  </button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {favoriteExperts.map((expert) => (
                    <div key={expert.id} className="card hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="bg-primary-100 rounded-full p-3">
                          <Users className="w-6 h-6 text-primary-600" />
                        </div>
                        <button
                          onClick={() => handleFollowToggle(expert)}
                          className="text-yellow-500 hover:text-yellow-600"
                        >
                          <Star className="w-5 h-5 fill-current" />
                        </button>
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-1">{expert.name}</h4>
                      <p className="text-sm text-gray-600 mb-2">{expert.institution || 'Institution not specified'}</p>
                      {expert.specialties && expert.specialties.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {expert.specialties.slice(0, 2).map((specialty, idx) => (
                            <span
                              key={idx}
                              className="inline-block bg-primary-50 text-primary-700 text-xs px-2 py-1 rounded"
                            >
                              {specialty}
                            </span>
                          ))}
                          {expert.specialties.length > 2 && (
                            <span className="inline-block text-xs text-gray-500 px-2 py-1">
                              +{expert.specialties.length - 2} more
                            </span>
                          )}
                        </div>
                      )}
                      <button
                        onClick={() => handleRequestMeeting(expert)}
                        className="w-full btn-primary text-sm py-2 mt-2"
                      >
                        Request Meeting
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Placeholder for future features */}
    
    

          </div>
        );

      default:
        return null;
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg fixed left-0 top-0 h-screen overflow-y-auto flex flex-col">
          <div className="p-6 border-b flex-shrink-0">
            <div className="flex items-center mb-4">

              <img src={logo} alt="CuraLink" className="h-16" />
            </div>
            <div className="bg-primary-50 rounded-lg p-3">
              <p className="text-sm font-medium text-gray-900">{userProfile?.name}</p>
              <p className="text-xs text-gray-600">{userProfile?.condition || 'Patient'}</p>
            </div>
          </div>

          <nav className="p-4 flex-1">
            {sidebarItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
                  activeTab === item.id
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="w-5 h-5">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="p-4 border-t flex-shrink-0">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8 ml-64">
          {renderContent()}
        </div>
      </div>

      {isAskModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-8 relative">
            <button
              onClick={() => setIsAskModalOpen(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
              aria-label="Close ask question"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">Ask a Question</h3>
            <form className="space-y-5" onSubmit={handleAskQuestionSubmit}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Category</label>
                <select
                  className="w-full border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={askForm.category}
                  onChange={handleAskFormChange('category')}
                >
                  {categories.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Title</label>
                  <button
                    type="button"
                    onClick={handleAskAIAssist}
                    disabled={askAIDrafting}
                    className="text-sm font-medium text-primary-600 hover:text-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {askAIDrafting ? 'Generating…' : 'AI Assist'}
                  </button>
                </div>
                <input
                  type="text"
                  value={askForm.title}
                  onChange={handleAskFormChange('title')}
                  placeholder="Enter your question title..."
                  className="w-full border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Question</label>
                <textarea
                  value={askForm.question}
                  onChange={handleAskFormChange('question')}
                  placeholder="Enter your question details..."
                  rows={5}
                  className="w-full border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  required
                />
                {askAIError && <p className="text-sm text-red-500">{askAIError}</p>}
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAskModalOpen(false)}
                  className="px-5 py-2 border border-gray-200 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary px-6 py-2 rounded-full text-sm font-semibold"
                >
                  Post Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedTrial && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-8 shadow-2xl">
            <button
              onClick={closeTrialDetails}
              className="absolute right-5 top-5 text-gray-400 transition hover:text-gray-600"
              aria-label="Close trial details"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-semibold text-gray-900">{selectedTrial.title}</h3>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${getTrialStatusStyles(
                      selectedTrial.status
                    )}`}
                  >
                    {selectedTrial.status || 'Status unknown'}
                  </span>
                  {selectedTrial.phase && (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                      {selectedTrial.phase}
                    </span>
                  )}
                  {selectedTrial.isRemote && (
                    <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700">
                      Remote
                    </span>
                  )}
                  {selectedTrial.source === 'clinicaltrials.gov' && (
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                      ClinicalTrials.gov
                    </span>
                  )}
                </div>
              </div>

              {selectedTrial.summary && (
                <p className="leading-relaxed text-gray-700">{selectedTrial.summary}</p>
              )}

              <div className="grid gap-4 text-sm text-gray-700 md:grid-cols-2">
                <div className="space-y-2">
                  <p>
                    <span className="font-semibold text-gray-900">Condition: </span>
                    {selectedTrial.condition || 'Not specified'}
                  </p>
                  <p>
                    <span className="font-semibold text-gray-900">Sponsor: </span>
                    {selectedTrial.sponsor || 'Not specified'}
                  </p>
                  <p>
                    <span className="font-semibold text-gray-900">Location: </span>
                    {selectedTrial.isRemote
                      ? 'Remote Friendly'
                      : selectedTrial.location ||
                        [selectedTrial.city, selectedTrial.country].filter(Boolean).join(', ') ||
                        'Not specified'}
                  </p>
                </div>
                <div className="space-y-2">
                  {selectedTrial.startDate && (
                    <p>
                      <span className="font-semibold text-gray-900">Starts: </span>
                      {formatDate(selectedTrial.startDate)}
                    </p>
                  )}
                  {selectedTrial.endDate && (
                    <p>
                      <span className="font-semibold text-gray-900">Ends: </span>
                      {formatDate(selectedTrial.endDate)}
                    </p>
                  )}
                  {selectedTrial.enrollmentTarget && (
                    <p>
                      <span className="font-semibold text-gray-900">Enrollment Target: </span>
                      {selectedTrial.enrollmentTarget}
                    </p>
                  )}
                  {selectedTrial.enrollmentCurrent && (
                    <p>
                      <span className="font-semibold text-gray-900">Currently Enrolled: </span>
                      {selectedTrial.enrollmentCurrent}
                    </p>
                  )}
                </div>
              </div>

              {selectedTrial.eligibility && (
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-gray-900">Eligibility</h4>
                  <p className="whitespace-pre-line text-sm text-gray-600">
                    {selectedTrial.eligibility}
                  </p>
                </div>
              )}

              {Array.isArray(selectedTrial.tags) && selectedTrial.tags.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-gray-900">Keywords</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTrial.tags.map((tag) => (
                      <span
                        key={`${selectedTrial.id}-tag-${tag}`}
                        className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-700">
                {selectedTrial.contactEmail && (
                  <span>
                    Contact{' '}
                    <a
                      href={`mailto:${selectedTrial.contactEmail}`}
                      className="font-semibold text-primary-600 hover:underline"
                    >
                      {selectedTrial.contactEmail}
                    </a>
                  </span>
                )}
                {selectedTrial.contactPhone && (
                  <span>
                    Phone{' '}
                    <a
                      href={`tel:${selectedTrial.contactPhone}`}
                      className="font-semibold text-primary-600 hover:underline"
                    >
                      {selectedTrial.contactPhone}
                    </a>
                  </span>
                )}
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={closeTrialDetails}
                  className="rounded-full border border-gray-200 px-5 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                >
                  Close
                </button>
                {selectedTrial.signupUrl && (
                  <a
                    href={selectedTrial.signupUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold"
                  >
                    Visit Trial Site <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {isMeetingModalOpen && selectedExpert && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-8 relative">
            <button
              onClick={closeMeetingModal}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
              aria-label="Close meeting request"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-semibold text-gray-900">Request a Meeting</h3>
                <p className="text-sm text-gray-500">
                  We'll forward your request to {selectedExpert.name}. If they are not active on CuraLink yet, our team
                  will reach out to them on your behalf.
                </p>
              </div>

              <div className="bg-gray-50 border rounded-2xl p-4 text-sm text-gray-700">
                <p className="font-semibold text-gray-900">{selectedExpert.name}</p>
                <p className="text-gray-600">
                  {selectedExpert.specialties && selectedExpert.specialties.length > 0
                    ? selectedExpert.specialties.join(', ')
                    : selectedExpert.researchInterests || 'Specialty not listed'}
                </p>
                <div className="flex items-center space-x-2 text-gray-500 mt-2">
                  <MapPin className="w-4 h-4" />
                  <span>{selectedExpert.location || selectedExpert.institution || 'Location not specified'}</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Meeting status:{' '}
                  {selectedExpert.availableForMeetings
                    ? 'This expert is open to meeting requests.'
                    : 'We will coordinate with our concierge team to reach this expert.'}
                </p>
              </div>

              <form onSubmit={handleMeetingSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Your Name</label>
                    <input
                      type="text"
                      value={meetingForm.name}
                      onChange={handleMeetingFormChange('name')}
                      placeholder="Enter your name"
                      className="w-full border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      value={meetingForm.email}
                      onChange={handleMeetingFormChange('email')}
                      placeholder="Enter your email (optional)"
                      className="w-full border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Contact Number</label>
                  <input
                    type="text"
                    value={meetingForm.contact}
                    onChange={handleMeetingFormChange('contact')}
                    placeholder="How can the expert reach you?"
                    className="w-full border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>

                <div className="space-y-2">
                  {/* <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Notes for the expert</label>
                    <button
                      type="button"
                      onClick={handleAiAssistNotes}
                      disabled={aiGeneratingNotes}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      {aiGeneratingNotes ? 'Generating...' : 'AI Assist'}
                    </button>
                  </div> */}
                  <textarea
                    value={meetingForm.notes}
                    onChange={handleMeetingFormChange('notes')}
                    placeholder="Share your goals for the meeting or any background info..."
                    rows={4}
                    className="w-full border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  />
                </div>

                {meetingFeedback && (
                  <div
                    className={`rounded-xl px-4 py-3 text-sm ${
                      meetingFeedback.type === 'success'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : meetingFeedback.type === 'warning'
                        ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                        : 'bg-red-50 text-red-600 border border-red-200'
                    }`}
                  >
                    {meetingFeedback.message}
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeMeetingModal}
                    className="px-5 py-2 border border-gray-200 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={meetingSubmitting}
                    className="btn-primary px-6 py-2 rounded-full text-sm font-semibold disabled:opacity-60"
                  >
                    {meetingSubmitting ? 'Sending...' : 'Send Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {selectedQuestion && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8 relative">
            <button
              onClick={closeDiscussion}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
              aria-label="Close discussion"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="space-y-4">
              <div>
                <span className="inline-flex items-center rounded-full bg-primary-100 text-primary-700 text-xs font-medium px-3 py-1 mb-3">
                  {selectedQuestion.category}
                </span>
                <h3 className="text-2xl font-semibold text-gray-900">
                  {selectedQuestion.title}
                </h3>
                <div className="flex items-center space-x-3 text-sm text-gray-600 mt-2">
                  <span>
                    Asked by{' '}
                    {selectedQuestion.authorRole === 'patient'
                      ? 'Patient'
                      : selectedQuestion.authorName || 'Member'}
                  </span>
                  <span className="text-gray-300" aria-hidden="true">&bull;</span>
                  <span>{formatDate(selectedQuestion.createdAt)}</span>
                </div>
              </div>

              <p className="text-gray-700 leading-relaxed">{selectedQuestion.question}</p>

              <div className="border-t pt-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">
                  {selectedQuestion.replies.length > 0
                    ? `${selectedQuestion.replies.length} Responses`
                    : 'No responses yet'}
                </h4>
                <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                  {selectedQuestion.replies.map((reply) => (
                    <div key={reply.id} className="border rounded-2xl p-4 bg-gray-50">
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                        <span>
                          {reply.authorName}{' '}
                          <span className="text-gray-300" aria-hidden="true">&bull;</span>{' '}
                          {reply.authorRole === 'researcher' ? 'Researcher' : 'Member'}
                        </span>
                        <span>{formatDate(reply.createdAt)}</span>
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed">{reply.message}</p>
                    </div>
                  ))}

                  {selectedQuestion.replies.length === 0 && (
                    <p className="text-sm text-gray-500">
                      Researchers will respond to your question soon. You'll receive a notification once a reply is posted.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={closeDiscussion}
                  className="px-5 py-2 border border-gray-200 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <ChatWidget role="patient" />
    </>
  );
};

export default PatientDashboard;
