import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  Users,
  FileText,
  MessageCircle,
  Star,
  Plus,
  Search,
  Filter,
  Calendar,
  LogOut,
  User,
  TrendingUp,
  X,
  ArrowRight,
} from 'lucide-react';
import { logo } from '../assets/assets';
import authService from '../services/authService';
import aiService from '../services/aiService';
import { useForumData } from '../hooks/useForumData';
import useCommunityChat from '../hooks/useCommunityChat';

const ResearcherDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const { questions, addQuestion, addReply } = useForumData();

  const [isAskModalOpen, setIsAskModalOpen] = useState(false);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [isCommunityModalOpen, setIsCommunityModalOpen] = useState(false);
  const [discussionQuestionId, setDiscussionQuestionId] = useState(null);
  const [replyTargetId, setReplyTargetId] = useState(null);

  const {
    communities: communityList,
    communitiesLoading,
    communitiesError,
    createCommunity: createCommunityRoom,
    openCommunityChat,
    closeCommunityChat,
    sendMessage,
    activeCommunity,
    activeCommunityId,
    activeMessages,
    socketConnected,
    socketError,
    isChatOpen,
  } = useCommunityChat();

  const [communitySubmitting, setCommunitySubmitting] = useState(false);
  const [communitySubmitError, setCommunitySubmitError] = useState(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatError, setChatError] = useState(null);
  const messagesEndRef = useRef(null);

  const [askForm, setAskForm] = useState({
    category: 'Cancer Research',
    title: '',
    question: '',
  });
  const [replyForm, setReplyForm] = useState({ message: '' });
  const [replyAIProcessing, setReplyAIProcessing] = useState(false);
  const [replyAIError, setReplyAIError] = useState(null);
  const [communityForm, setCommunityForm] = useState({
    name: '',
    description: '',
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (!authService.isAuthenticated()) {
          navigate('/login');
          return;
        }

        const userData = await authService.getCurrentUser();
        const role = userData.user.role?.toLowerCase?.() || '';

        if (role !== 'researcher') {
          navigate('/login');
          return;
        }

        setUserProfile({
          name: userData.user.name,
          email: userData.user.email,
          institution: userData.profile?.institution || 'Not specified',
          specialties: userData.profile?.specialties?.join(', ') || 'Not specified',
          orcid: userData.profile?.orcid,
          researchGate: userData.profile?.researchGateProfile || userData.profile?.researchGate,
        });
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch researcher profile', error);
        navigate('/login');
      }
    };

    fetchUser();
  }, [navigate]);

  useEffect(() => {
    setChatMessage('');
    setChatError(null);
  }, [activeCommunityId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeMessages]);

  useEffect(() => {
    if (!isReplyModalOpen) {
      setReplyAIProcessing(false);
      setReplyAIError(null);
    }
  }, [isReplyModalOpen]);

  const discussionQuestion = useMemo(
    () => (discussionQuestionId ? questions.find((q) => q.id === discussionQuestionId) || null : null),
    [questions, discussionQuestionId]
  );

  const replyTarget = useMemo(
    () => (replyTargetId ? questions.find((q) => q.id === replyTargetId) || null : null),
    [questions, replyTargetId]
  );

  const handleLogout = () => {
    authService.logout();
    navigate('/');
  };

  const categories = useMemo(
    () => ['Cancer Research', 'Clinical Trials', 'Treatment Options', 'General Support'],
    []
  );

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: <Heart className="w-4 h-4" /> },
    { id: 'trials', label: 'My Clinical Trials', icon: <FileText className="w-4 h-4" /> },
    { id: 'collaborators', label: 'Collaborators', icon: <Users className="w-4 h-4" /> },
    { id: 'forums', label: 'Forums', icon: <MessageCircle className="w-4 h-4" /> },
    { id: 'publications', label: 'My Publications', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'favorites', label: 'Favorites', icon: <Star className="w-4 h-4" /> },
  ];

  const mockTrials = [
    {
      id: 1,
      title: 'Phase II Trial for Novel Cancer Treatment',
      phase: 'Phase II',
      participants: 45,
      target: 100,
      status: 'Recruiting',
    },
    {
      id: 2,
      title: 'Immunotherapy Combination Study',
      phase: 'Phase III',
      participants: 120,
      target: 150,
      status: 'Recruiting',
    },
    {
      id: 3,
      title: 'Gene Therapy Safety Study',
      phase: 'Phase I',
      participants: 12,
      target: 30,
      status: 'Active',
    },
  ];

  const mockCollaborators = [
    {
      id: 1,
      name: 'Dr. Lisa Anderson',
      institution: 'Johns Hopkins',
      specialty: 'Oncology',
      publications: 142,
    },
    {
      id: 2,
      name: 'Dr. Robert Kim',
      institution: 'Stanford Medical',
      specialty: 'Immunology',
      publications: 98,
    },
    {
      id: 3,
      name: 'Dr. Maria Garcia',
      institution: 'Mayo Clinic',
      specialty: 'Genetics',
      publications: 176,
    },
  ];

  const mockPublications = [
    {
      id: 1,
      title: 'Targeted Therapies for Glioblastoma',
      journal: 'Nature Medicine',
      year: 2024,
    },
    {
      id: 2,
      title: 'Adaptive Trial Designs in Oncology',
      journal: 'The Lancet',
      year: 2023,
    },
    {
      id: 3,
      title: 'Precision Medicine for Rare Cancers',
      journal: 'Science Translational Medicine',
      year: 2023,
    },
  ];

  const favoriteItems = [
    { id: 1, type: 'Trial', label: 'Glioblastoma Study 23A', note: 'Recruiting' },
    { id: 2, type: 'Publication', label: 'AI-assisted Diagnostics', note: 'To review' },
    { id: 3, type: 'Collaborator', label: 'Dr. Priya Nair', note: 'Requested meeting' },
  ];

  const pendingQuestions = questions.filter((question) => question.replies.length === 0);

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const handleAskFormChange = (field) => (event) => {
    setAskForm((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleAskSubmit = (event) => {
    event.preventDefault();
    if (!askForm.title.trim() || !askForm.question.trim()) {
      return;
    }

    addQuestion({
      ...askForm,
      authorRole: 'researcher',
      authorName: userProfile?.name || 'Researcher',
    });
    setAskForm({
      category: 'Cancer Research',
      title: '',
      question: '',
    });
    setIsAskModalOpen(false);
  };

  const openReplyModal = (question) => {
    setReplyTargetId(question.id);
    setReplyForm({ message: '' });
    setReplyAIError(null);
    setReplyAIProcessing(false);
    setIsReplyModalOpen(true);
  };

  const handleReplySubmit = (event) => {
    event.preventDefault();
    setReplyAIError(null);
    if (!replyTarget || !replyForm.message.trim()) {
      return;
    }

    try {
      addReply(replyTarget.id, {
        message: replyForm.message,
        authorName: userProfile?.name || 'Researcher',
        authorRole: 'researcher',
      });
      setIsReplyModalOpen(false);
      setReplyTargetId(null);
      setReplyForm({ message: '' });
      setReplyAIError(null);
      setReplyAIProcessing(false);
    } catch (error) {
      console.error('Failed to add reply', error);
    }
  };

  const handleReplyAI = async () => {
    if (!replyTarget) {
      setReplyAIError('Select a question to reply to first.');
      return;
    }

    setReplyAIError(null);
    setReplyAIProcessing(true);
    try {
      const result = await aiService.refineResearcherReply({
        questionTitle: replyTarget.title,
        questionBody: replyTarget.question,
        currentResponse: replyForm.message,
      });
      setReplyForm({ message: result.response || replyForm.message });
    } catch (error) {
      const message =
        error?.response?.data?.message || 'Unable to generate an AI reply right now. Please try again.';
      setReplyAIError(message);
    } finally {
      setReplyAIProcessing(false);
    }
  };

  const handleCommunitySubmit = async (event) => {
    event.preventDefault();
    if (!communityForm.name.trim() || !communityForm.description.trim()) {
      return;
    }

    try {
      setCommunitySubmitError(null);
      setCommunitySubmitting(true);

      const created = await createCommunityRoom({
        name: communityForm.name.trim(),
        description: communityForm.description.trim(),
      });

      await openCommunityChat(created.id);

      setCommunityForm({ name: '', description: '' });
      setIsCommunityModalOpen(false);
    } catch (error) {
      console.error('Failed to create community', error);
      setCommunitySubmitError(
        error?.response?.data?.message || 'Unable to create community. Please try again.'
      );
    } finally {
      setCommunitySubmitting(false);
    }
  };

  const handleOpenChat = async (communityId) => {
    if (!communityId) return;
    try {
      setChatError(null);
      await openCommunityChat(communityId);
    } catch (error) {
      console.error('Failed to open community chat', error);
      setChatError(error?.response?.data?.message || 'Unable to join community chat right now.');
    }
  };

  const handleCloseChat = () => {
    closeCommunityChat();
    setChatMessage('');
    setChatError(null);
  };

  const handleSendChat = (event) => {
    event.preventDefault();
    if (!activeCommunityId || !chatMessage.trim()) {
      return;
    }
    sendMessage(activeCommunityId, chatMessage);
    setChatMessage('');
  };

  const renderForumQuestionCard = (question, { showReply } = { showReply: false }) => (
    <div key={question.id} className="card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="inline-flex items-center rounded-full bg-primary-100 text-primary-700 text-xs font-medium px-3 py-1 mb-3">
            {question.category}
          </span>
          <h3 className="text-lg font-semibold text-gray-900">{question.title}</h3>
          <div className="flex items-center flex-wrap gap-2 mt-2 text-sm text-gray-600">
            <span>
              Asked by{' '}
              {question.authorRole === 'patient' ? 'Patient' : question.authorName || 'Member'}
            </span>
            <span className="text-gray-300" aria-hidden="true">
              &bull;
            </span>
            <span>
              {question.replies.length} {question.replies.length === 1 ? 'reply' : 'replies'}
            </span>
            <span className="text-gray-300" aria-hidden="true">
              &bull;
            </span>
            <span>{formatDate(question.createdAt)}</span>
          </div>
          <p className="text-sm text-gray-600 mt-3 line-clamp-2">{question.question}</p>
        </div>
        <div className="flex flex-col items-end space-y-3 shrink-0">
          {showReply && (
            <button onClick={() => openReplyModal(question)} className="btn-primary text-sm px-4 py-2">
              Reply
            </button>
          )}
          <button
            onClick={() => setDiscussionQuestionId(question.id)}
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            <span>View Discussion</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="card">
                <h3 className="text-sm font-medium text-gray-600 mb-1">Active Trials</h3>
                <p className="text-3xl font-bold text-primary-600">3</p>
                <p className="text-xs text-gray-500 mt-1">2 recruiting</p>
              </div>
              <div className="card">
                <h3 className="text-sm font-medium text-gray-600 mb-1">Total Participants</h3>
                <p className="text-3xl font-bold text-primary-600">177</p>
                <p className="text-xs text-gray-500 mt-1">+12 this month</p>
              </div>
              <div className="card">
                <h3 className="text-sm font-medium text-gray-600 mb-1">Forum Questions</h3>
                <p className="text-3xl font-bold text-primary-600">{questions.length}</p>
                <p className="text-xs text-gray-500 mt-1">Awaiting reply</p>
              </div>
              <div className="card">
                <h3 className="text-sm font-medium text-gray-600 mb-1">Collaborators</h3>
                <p className="text-3xl font-bold text-primary-600">24</p>
                <p className="text-xs text-gray-500 mt-1">3 new requests</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card">
                <h3 className="text-xl font-semibold mb-4">Trial Progress</h3>
                {mockTrials.slice(0, 2).map((trial) => (
                  <div key={trial.id} className="mb-4 last:mb-0">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-sm font-medium text-gray-700">{trial.title}</h4>
                      <span className="text-xs text-gray-500">{trial.phase}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500"
                        style={{ width: `${Math.round((trial.participants / trial.target) * 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span>{trial.participants} enrolled</span>
                      <span>Target: {trial.target}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="card">
                <h3 className="text-xl font-semibold mb-4">Upcoming Meetings</h3>
                <div className="space-y-4">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700">Patient Consultation</h4>
                        <p className="text-xs text-gray-500">Discuss eligibility for trial #23A</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center text-xs text-gray-500">
                          <Calendar className="w-3 h-3 mr-1" />
                          Apr 18, 10:30 AM
                        </div>
                        <button className="btn-secondary text-xs px-3 py-1.5">Details</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'trials':
        return (
          <div className="card">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Trial Portfolio</h3>
                <p className="text-sm text-gray-500">Monitor enrollment and milestones</p>
              </div>
              <button className="btn-primary inline-flex items-center gap-2 px-4 py-2">
                <Plus className="w-4 h-4" />
                <span>New Trial</span>
              </button>
            </div>
            <div className="space-y-4">
              {mockTrials.map((trial) => (
                <div key={trial.id} className="border rounded-2xl p-4 hover:border-primary-200 transition">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">{trial.title}</h4>
                      <div className="flex items-center flex-wrap gap-2 text-sm text-gray-500 mt-2">
                        <span>{trial.phase}</span>
                        <span className="text-gray-300" aria-hidden="true">
                          &bull;
                        </span>
                        <span>Status: {trial.status}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Participants</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {trial.participants} / {trial.target}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'collaborators':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {mockCollaborators.map((collaborator) => (
              <div key={collaborator.id} className="card">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="bg-primary-100 text-primary-700 rounded-full w-10 h-10 flex items-center justify-center font-semibold">
                        {collaborator.name
                          .split(' ')
                          .map((segment) => segment[0])
                          .join('')
                          .slice(0, 2)}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{collaborator.name}</h3>
                        <p className="text-sm text-gray-500">{collaborator.institution}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium text-gray-800">Specialty:</span> {collaborator.specialty}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      <span className="font-medium text-gray-800">Publications:</span> {collaborator.publications}
                    </p>
                  </div>
                  <button className="btn-secondary text-sm px-4 py-2">Connect</button>
                </div>
              </div>
            ))}
          </div>
        );

      case 'forums':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-[2fr,1fr] gap-6">
              <div className="space-y-6">
                <div className="card">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">Pending Questions</h3>
                    <span className="text-sm text-gray-500">
                      {pendingQuestions.length} awaiting response
                    </span>
                  </div>
                  {pendingQuestions.length === 0 ? (
                    <p className="text-sm text-gray-500">You are all caught up.</p>
                  ) : (
                    <div className="space-y-4">
                      {pendingQuestions.map((question) =>
                        renderForumQuestionCard(question, { showReply: true })
                      )}
                    </div>
                  )}
                </div>

                <div className="card">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">Latest Discussions</h3>
                    <button
                      onClick={() => setIsAskModalOpen(true)}
                      className="btn-secondary text-sm px-4 py-2"
                    >
                      Ask Question
                    </button>
                  </div>
                  <div className="space-y-4">
                    {questions.map((question) =>
                      renderForumQuestionCard(question, { showReply: true })
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="card">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Communities</h3>
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex items-center gap-2 text-xs font-medium ${
                          socketConnected ? 'text-green-600' : 'text-gray-400'
                        }`}
                      >
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            socketConnected ? 'bg-green-500' : 'bg-gray-400'
                          }`}
                        />
                        {socketConnected ? 'Live' : 'Offline'}
                      </span>
                      <button
                        onClick={() => {
                          setCommunitySubmitError(null);
                          setIsCommunityModalOpen(true);
                        }}
                        className="btn-primary text-sm px-4 py-2"
                      >
                        Create
                      </button>
                    </div>
                  </div>
                  {communitiesError && (
                    <p className="text-sm text-red-500 mb-2">
                      Unable to load communities right now. Please refresh.
                    </p>
                  )}
                  {chatError && (
                    <p className="text-sm text-red-500 mb-2">{chatError}</p>
                  )}
                  {socketError && (
                    <p className="text-sm text-red-500 mb-2">{socketError}</p>
                  )}
                  <div className="space-y-4">
                    {communitiesLoading ? (
                      <p className="text-sm text-gray-500">Loading communities...</p>
                    ) : communityList.length === 0 ? (
                      <p className="text-sm text-gray-500">
                        No communities yet. Start one to gather experts.
                      </p>
                    ) : (
                      communityList.map((community) => (
                        <div key={community.id} className="border rounded-2xl p-4">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                            <div>
                              <h4 className="text-sm font-semibold text-gray-900">{community.name}</h4>
                              <p className="text-xs text-gray-500 mt-1">
                                Created by {community.creatorName || 'Researcher'} on{' '}
                                {formatDate(community.createdAt)}
                              </p>
                              {community.description ? (
                                <p className="text-sm text-gray-600 mt-2">{community.description}</p>
                              ) : (
                                <p className="text-sm text-gray-500 mt-2">
                                  No description yet. Open the chat to introduce the topic.
                                </p>
                              )}
                            </div>
                            <div className="flex items-end sm:items-center sm:flex-col gap-2">
                              <span
                                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                                  community.isMember
                                    ? 'bg-primary-50 text-primary-700'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {community.isMember ? 'You are a member' : 'Not joined'}
                              </span>
                              <button
                                onClick={() => handleOpenChat(community.id)}
                                className="btn-secondary text-xs px-3 py-1.5"
                              >
                                {community.isMember ? 'Open Chat' : 'Join Chat'}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'publications':
        return (
          <div className="card">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent Publications</h3>
            <div className="space-y-4">
              {mockPublications.map((publication) => (
                <div key={publication.id} className="border rounded-2xl p-4">
                  <h4 className="text-lg font-semibold text-gray-900">{publication.title}</h4>
                  <p className="text-sm text-gray-500 mt-1">
                    {publication.journal} &bull; {publication.year}
                  </p>
                  <div className="flex items-center justify-end mt-4">
                    <button className="btn-secondary text-sm px-4 py-2">View Details</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'favorites':
        return (
          <div className="card">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Saved Items</h3>
            <div className="space-y-3">
              {favoriteItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border px-4 py-3 text-sm text-gray-600"
                >
                  <div>
                    <p className="font-medium text-gray-900">{item.label}</p>
                    <p className="text-xs text-gray-500">
                      {item.type} &bull; {item.note}
                    </p>
                  </div>
                  <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                    Open
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading || !userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 flex">
        <aside className="w-72 bg-white shadow-lg">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <img src={logo} alt="CuraLink" className="h-8" />
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-primary-600 transition"
                aria-label="Sign out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div className="bg-primary-50 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-sm">
                    <User className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{userProfile.name}</p>
                    <p className="text-xs text-gray-500">{userProfile.institution}</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-xs text-gray-600">
                  <p>
                    <span className="font-medium text-gray-800">Email:</span> {userProfile.email}
                  </p>
                  <p>
                    <span className="font-medium text-gray-800">Specialties:</span>{' '}
                    {userProfile.specialties}
                  </p>
                  {userProfile.orcid && (
                    <p>
                      <span className="font-medium text-gray-800">ORCID:</span> {userProfile.orcid}
                    </p>
                  )}
                  {userProfile.researchGate && (
                    <p>
                      <span className="font-medium text-gray-800">ResearchGate:</span>{' '}
                      {userProfile.researchGate}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <nav className="p-4 space-y-1">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition ${
                  activeTab === item.id
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {item.icon}
                <span className="font-medium text-sm">{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 py-8 px-6 lg:px-10 space-y-6">
          <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Welcome back, {userProfile.name.split(' ')[0]}
              </h1>
              <p className="text-sm text-gray-500">
                Track studies, engage with patients, and grow your communities.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setIsAskModalOpen(true)}
                className="btn-secondary inline-flex items-center gap-2 px-4 py-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Ask Question</span>
              </button>
              <button
                onClick={() => setIsCommunityModalOpen(true)}
                className="btn-primary inline-flex items-center gap-2 px-4 py-2"
              >
                <Plus className="w-4 h-4" />
                <span>New Community</span>
              </button>
            </div>
          </header>

          <div className="card">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search trials, collaborators, or discussions"
                  className="w-full border border-gray-200 rounded-full pl-12 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <button className="btn-secondary inline-flex items-center gap-2 px-4 py-2">
                <Filter className="w-4 h-4" />
                <span>Filters</span>
              </button>
            </div>
          </div>

          {renderContent()}
        </main>
      </div>

      {isAskModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8 relative">
            <button
              onClick={() => setIsAskModalOpen(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
              aria-label="Close ask question modal"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-semibold text-gray-900">Ask the Community</h3>
                <p className="text-sm text-gray-500">
                  Share clinical insights or invite patients to contribute.
                </p>
              </div>
              <form onSubmit={handleAskSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Category</label>
                  <select
                    value={askForm.category}
                    onChange={handleAskFormChange('category')}
                    className="w-full border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {categories.map((category) => (
                      <option key={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Title</label>
                  <input
                    type="text"
                    value={askForm.title}
                    onChange={handleAskFormChange('title')}
                    placeholder="What would you like to ask?"
                    className="w-full border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Question</label>
                  <textarea
                    value={askForm.question}
                    onChange={handleAskFormChange('question')}
                    placeholder="Provide context, goals, or supporting details..."
                    rows={6}
                    className="w-full border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                    required
                  />
                </div>
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAskModalOpen(false)}
                    className="px-5 py-2 border border-gray-200 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary px-6 py-2 rounded-full text-sm font-semibold">
                    Post Question
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {isReplyModalOpen && replyTarget && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-8 relative">
            <button
              onClick={() => {
                setIsReplyModalOpen(false);
                setReplyTargetId(null);
                setReplyForm({ message: '' });
                setReplyAIError(null);
                setReplyAIProcessing(false);
              }}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
              aria-label="Close reply modal"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-semibold text-gray-900">Reply to Question</h3>
                <p className="text-sm text-gray-500">
                  Provide evidence-based guidance from your researcher perspective.
                </p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-sm font-medium text-gray-900">{replyTarget.title}</p>
                <p className="text-xs text-gray-500 mt-1">{replyTarget.question}</p>
              </div>
              <form onSubmit={handleReplySubmit} className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Your Response</label>
                    <button
                      type="button"
                      onClick={handleReplyAI}
                      disabled={replyAIProcessing}
                      className="text-sm font-medium text-primary-600 hover:text-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {replyAIProcessing ? 'Generating…' : 'AI Assist'}
                    </button>
                  </div>
                  <textarea
                    value={replyForm.message}
                    onChange={(event) => setReplyForm({ message: event.target.value })}
                    rows={6}
                    placeholder="Compose a detailed answer with actionable next steps..."
                    className="w-full border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                    required
                  />
                  {replyAIError && <p className="text-sm text-red-500">{replyAIError}</p>}
                </div>
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsReplyModalOpen(false);
                      setReplyTargetId(null);
                      setReplyForm({ message: '' });
                      setReplyAIError(null);
                      setReplyAIProcessing(false);
                    }}
                    className="px-5 py-2 border border-gray-200 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary px-6 py-2 rounded-full text-sm font-semibold">
                    Post Reply
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {isCommunityModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-8 relative">
            <button
              onClick={() => setIsCommunityModalOpen(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
              aria-label="Close community modal"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-semibold text-gray-900">Create a Research Community</h3>
                <p className="text-sm text-gray-500">
                  Bring together experts and patients around a focused topic.
                </p>
              </div>
              <form onSubmit={handleCommunitySubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Community Name</label>
                  <input
                    type="text"
                    value={communityForm.name}
                    onChange={(event) =>
                      setCommunityForm((prev) => ({ ...prev, name: event.target.value }))
                    }
                    placeholder="Example: Glioblastoma Insights"
                    className="w-full border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={communityForm.description}
                    onChange={(event) =>
                      setCommunityForm((prev) => ({ ...prev, description: event.target.value }))
                    }
                    rows={5}
                    placeholder="Outline the community purpose, audience, and plans..."
                    className="w-full border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                    required
                  />
                </div>
                {communitySubmitError && (
                  <p className="text-sm text-red-500">{communitySubmitError}</p>
                )}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCommunityModalOpen(false)}
                    className="px-5 py-2 border border-gray-200 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary px-6 py-2 rounded-full text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={communitySubmitting}
                  >
                    {communitySubmitting ? 'Creating...' : 'Create Community'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {isChatOpen && activeCommunity && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full p-8 relative">
            <button
              onClick={handleCloseChat}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
              aria-label="Close community chat"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900">{activeCommunity.name}</h3>
                  {activeCommunity.description && (
                    <p className="text-sm text-gray-600 mt-2">{activeCommunity.description}</p>
                  )}
                  {!activeCommunity.description && (
                    <p className="text-sm text-gray-500 mt-2">
                      Start the conversation with a welcome note or research update.
                    </p>
                  )}
                </div>
                <div
                  className={`flex items-center gap-2 text-sm ${
                    socketConnected ? 'text-green-600' : 'text-gray-400'
                  }`}
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      socketConnected ? 'bg-green-500' : 'bg-gray-400'
                    }`}
                  />
                  {socketConnected ? 'Live connection' : 'Connecting...'}
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl border max-h-80 overflow-y-auto p-4 space-y-4">
                {activeMessages.length === 0 ? (
                  <p className="text-sm text-gray-500">No messages yet. Be the first to share.</p>
                ) : (
                  activeMessages.map((message) => (
                    <div key={message.id} className="bg-white rounded-xl border p-3 shadow-sm">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span className="font-medium text-gray-800">{message.senderName}</span>
                        <span>{formatDateTime(message.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{message.message}</p>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendChat} className="space-y-3">
                {socketError && (
                  <p className="text-sm text-red-500">{socketError}</p>
                )}
                <textarea
                  value={chatMessage}
                  onChange={(event) => setChatMessage(event.target.value)}
                  rows={3}
                  placeholder={
                    socketConnected
                      ? 'Share an update, ask for insights, or welcome new members...'
                      : 'Connecting to chat...'
                  }
                  className="w-full border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  disabled={!socketConnected}
                />
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCloseChat}
                    className="px-5 py-2 border border-gray-200 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-50"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="btn-primary px-6 py-2 rounded-full text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!socketConnected || !chatMessage.trim()}
                  >
                    Send
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {discussionQuestion && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full p-8 relative">
            <button
              onClick={() => setDiscussionQuestionId(null)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
              aria-label="Close discussion"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="space-y-6">
              <div>
                <span className="inline-flex items-center rounded-full bg-primary-100 text-primary-700 text-xs font-medium px-3 py-1 mb-3">
                  {discussionQuestion.category}
                </span>
                <h3 className="text-2xl font-semibold text-gray-900">{discussionQuestion.title}</h3>
                <div className="flex items-center flex-wrap gap-2 text-sm text-gray-600 mt-2">
                  <span>
                    Asked by{' '}
                    {discussionQuestion.authorRole === 'patient'
                      ? 'Patient'
                      : discussionQuestion.authorName || 'Member'}
                  </span>
                  <span className="text-gray-300" aria-hidden="true">
                    &bull;
                  </span>
                  <span>{formatDate(discussionQuestion.createdAt)}</span>
                </div>
              </div>

              <p className="text-gray-700 leading-relaxed">{discussionQuestion.question}</p>

              <div className="border-t pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold text-gray-900">
                    {discussionQuestion.replies.length > 0
                      ? `${discussionQuestion.replies.length} Responses`
                      : 'No responses yet'}
                  </h4>
                  <button
                    onClick={() => openReplyModal(discussionQuestion)}
                    className="btn-primary text-sm px-4 py-2"
                  >
                    Reply
                  </button>
                </div>
                <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                  {discussionQuestion.replies.map((reply) => (
                    <div key={reply.id} className="border rounded-2xl p-4 bg-gray-50">
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                        <span>
                          {reply.authorName}{' '}
                          <span className="text-gray-300" aria-hidden="true">
                            &bull;
                          </span>{' '}
                          {reply.authorRole === 'researcher' ? 'Researcher' : 'Member'}
                        </span>
                        <span>{formatDate(reply.createdAt)}</span>
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed">{reply.message}</p>
                    </div>
                  ))}

                  {discussionQuestion.replies.length === 0 && (
                    <p className="text-sm text-gray-500">
                      Ready to respond when you are. Patients will be notified once your reply is
                      posted.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setDiscussionQuestionId(null)}
                  className="px-5 py-2 border border-gray-200 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ResearcherDashboard;
