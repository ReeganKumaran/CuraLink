import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  Users,
  FileText,
  MessageCircle,
  Star,
  Search,
  Filter,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import { logo } from '../assets/assets';
import authService from '../services/authService';
import expertService from '../services/expertService';
import aiService from '../services/aiService';
import { useForumData } from '../hooks/useForumData';
import useCommunityChat from '../hooks/useCommunityChat';
import ChatWidget from '../components/ChatWidget';
import clinicalTrialService from '../services/clinicalTrialService';
import ResearcherSidebar from '../components/researcher/Sidebar';
import ResearcherHeader from '../components/researcher/Header';
import ResearcherOverviewSection from '../components/researcher/OverviewSection';
import ResearcherTrialsSection from '../components/researcher/TrialsSection';
import ResearcherCollaboratorsSection from '../components/researcher/CollaboratorsSection';
import ResearcherForumsSection from '../components/researcher/ForumsSection';
import ResearcherPublicationsSection from '../components/researcher/PublicationsSection';
import ResearcherFavoritesSection from '../components/researcher/FavoritesSection';
import CommunityChatModal from '../components/researcher/CommunityChatModal';
import CommunityModal from '../components/researcher/CommunityModal';
import AskQuestionModal from '../components/researcher/AskQuestionModal';
import ReplyModal from '../components/researcher/ReplyModal';
import TrialModal from '../components/researcher/TrialModal';
import TrialDetailsModal from '../components/researcher/TrialDetailsModal';
import ScheduleMeetingModal from '../components/researcher/ScheduleMeetingModal';
import DiscussionModal from '../components/researcher/DiscussionModal';
import MeetingChatModal from '../components/meetings/MeetingChatModal';

const buildGeneratedTrialSummary = (form) => {
  const { title, phase, sponsor, condition, location, city, country } = form;
  const hasMeaningfulInfo = Boolean(title || condition || sponsor || location || city || country);
  if (!hasMeaningfulInfo) {
    return '';
  }

  const titleText = title ? `The study "${title}"` : 'This study';
  const phaseText = phase ? `${phase} clinical trial` : 'clinical trial';
  const sponsorText = sponsor ? ` sponsored by ${sponsor}` : '';
  const conditionText = condition ? ` focusing on ${condition}` : '';
  const locationParts = [location, city, country].filter(Boolean);
  const locationText = locationParts.length
    ? ` The research activities will take place at ${locationParts.join(', ')}.`
    : ' The research team will coordinate activities directly with enrolled participants.';

  const summary = `${titleText} is a ${phaseText}${sponsorText}${conditionText}. It aims to evaluate safety and outcomes for participants.${locationText}`;
  return summary.trim();
};

const buildGeneratedTrialEligibility = (form) => {
  const { condition, location, city, country, isRemote, sponsor } = form;
  if (!condition && !location && !city && !country && !isRemote && !sponsor) {
    return '';
  }

  const conditionText = condition
    ? `Ideal participants include individuals diagnosed with ${condition}.`
    : "Ideal participants include individuals who meet the study's clinical criteria.";

  const locationParts = [location, city, country].filter(Boolean);
  let logisticsText;
  if (isRemote) {
    logisticsText =
      'The study supports remote or hybrid participation, allowing virtual visits when appropriate.';
  } else if (locationParts.length) {
    logisticsText = `Participants should be able to attend study visits in ${locationParts.join(', ')}.`;
  } else {
    logisticsText = 'Study visit logistics will be outlined during the screening conversation.';
  }

  const screeningText = sponsor
    ? `All candidates will complete a screening with the ${sponsor} research team to confirm eligibility.`
    : 'All candidates will complete a screening with the research team to confirm eligibility.';

  const eligibility = `${conditionText} ${logisticsText} ${screeningText}`;
  return eligibility.trim();
};

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
  const [collaborators, setCollaborators] = useState([]);
  const [collaboratorsLoading, setCollaboratorsLoading] = useState(false);
  const [collaboratorsError, setCollaboratorsError] = useState(null);
  const [trials, setTrials] = useState([]);
  const [trialsLoading, setTrialsLoading] = useState(false);
  const [trialsError, setTrialsError] = useState(null);
  const [trialsView, setTrialsView] = useState('my'); // 'my' or 'all'
  const [trialSearchTerm, setTrialSearchTerm] = useState('');
  const trialSearchDebounceRef = useRef(null);
  const [isTrialModalOpen, setIsTrialModalOpen] = useState(false);
  const [selectedTrial, setSelectedTrial] = useState(null);
  const [trialSubmitting, setTrialSubmitting] = useState(false);
  const [trialSubmitError, setTrialSubmitError] = useState(null);
  const [trialForm, setTrialForm] = useState({
    title: '',
    phase: 'Phase I',
    status: 'Recruiting',
    condition: '',
    summary: '',
    sponsor: '',
    location: '',
    city: '',
    country: '',
    isRemote: false,
    enrollmentTarget: '',
    enrollmentCurrent: '',
    startDate: '',
    endDate: '',
    eligibility: '',
    tags: '',
    signupUrl: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
  });
  const [summaryTouched, setSummaryTouched] = useState(false);
  const [eligibilityTouched, setEligibilityTouched] = useState(false);
  const [meetingRequests, setMeetingRequests] = useState([]);
  const [meetingRequestsLoading, setMeetingRequestsLoading] = useState(false);
  const [meetingRequestsError, setMeetingRequestsError] = useState(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedMeetingRequest, setSelectedMeetingRequest] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({ date: '', time: '', notes: '' });
  const [scheduleSubmitting, setScheduleSubmitting] = useState(false);
  const [isMeetingChatOpen, setIsMeetingChatOpen] = useState(false);
  const [chatMeetingRequest, setChatMeetingRequest] = useState(null);

  const trialPhases = useMemo(
    () => ['Phase I', 'Phase II', 'Phase III', 'Phase IV', 'Observational'],
    []
  );
  const trialStatuses = useMemo(
    () => ['Recruiting', 'Active', 'Completed', 'Suspended', 'Not Yet Recruiting'],
    []
  );

const handleTrialFormChange = (field) => (event) => {
  const value =
    field === 'isRemote' ? event.target.checked : event.target.value;
  if (field === 'summary') {
    setSummaryTouched(true);
  } else if (field === 'eligibility') {
    setEligibilityTouched(true);
  }
  setTrialForm((prev) => ({
    ...prev,
    [field]: value,
  }));
};

const handleTrialSearchChange = (event) => {
  const value = event.target.value;
  setTrialSearchTerm(value);

  // Debounce search
  if (trialSearchDebounceRef.current) {
    clearTimeout(trialSearchDebounceRef.current);
  }

  trialSearchDebounceRef.current = setTimeout(() => {
    loadTrials(value);
  }, 500);
};

const resetTrialForm = useCallback(() => {
  setTrialForm({
    title: '',
    phase: 'Phase I',
    status: 'Recruiting',
      condition: '',
      summary: '',
      sponsor: '',
      location: '',
      city: '',
      country: '',
      isRemote: false,
      enrollmentTarget: '',
      enrollmentCurrent: '',
      startDate: '',
      endDate: '',
      eligibility: '',
      tags: '',
      signupUrl: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
  });
  setTrialSubmitError(null);
  setSummaryTouched(false);
  setEligibilityTouched(false);
}, []);

  const openTrialModal = () => {
    resetTrialForm();
    setIsTrialModalOpen(true);
  };

  const closeTrialModal = () => {
    setIsTrialModalOpen(false);
  };

  const openTrialDetails = (trial) => {
    setSelectedTrial(trial);
  };

  const closeTrialDetails = () => {
    setSelectedTrial(null);
  };

  const handleOpenCommunityModal = useCallback(() => {
    setCommunitySubmitError(null);
    setIsCommunityModalOpen(true);
  }, []);

  const closeCommunityModal = useCallback(() => {
    setIsCommunityModalOpen(false);
  }, []);

  const closeReplyModal = useCallback(() => {
    setIsReplyModalOpen(false);
    setReplyTargetId(null);
    setReplyForm({ message: '' });
    setReplyAIError(null);
    setReplyAIProcessing(false);
  }, []);

  const closeDiscussionModal = useCallback(() => {
    setDiscussionQuestionId(null);
  }, []);

  const handleCommunityFormChange = useCallback((field, value) => {
    setCommunityForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

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
          id: userData.user.id,
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

  const loadCollaborators = useCallback(async () => {
    if (!userProfile) return;
    setCollaboratorsLoading(true);
    setCollaboratorsError(null);
    try {
      const { experts } = await expertService.fetchExperts({ search: '', condition: '' });

      // Remove duplicates by id and filter out current user
      const uniqueExperts = Array.from(
        new Map((experts || []).map(expert => [expert.id, expert])).values()
      );
      const filtered = uniqueExperts.filter((expert) => expert.id !== userProfile.id);

      setCollaborators(filtered);
    } catch (error) {
      console.error('Failed to load collaborators:', error);
      setCollaboratorsError('Unable to load collaborators right now. Please try again later.');
    } finally {
      setCollaboratorsLoading(false);
    }
  }, [userProfile]);

  const loadMeetingRequests = useCallback(async () => {
    if (!userProfile) return;
    setMeetingRequestsLoading(true);
    setMeetingRequestsError(null);
    try {
      const { requests } = await expertService.fetchResearcherMeetingRequests();
      setMeetingRequests(requests || []);
    } catch (error) {
      console.error('Failed to load meeting requests:', error);
      setMeetingRequestsError('Unable to load meeting requests right now. Please try again.');
    } finally {
      setMeetingRequestsLoading(false);
    }
  }, [userProfile]);

  const openScheduleModal = (request) => {
    setSelectedMeetingRequest(request);
    setScheduleForm({
      date: request?.scheduled_at ? new Date(request.scheduled_at).toISOString().slice(0, 10) : '',
      time: request?.scheduled_at ? new Date(request.scheduled_at).toISOString().slice(11, 16) : '',
      notes: request?.response_notes || '',
    });
    setIsScheduleModalOpen(true);
    setScheduleSubmitting(false);
  };

  const closeScheduleModal = () => {
    setIsScheduleModalOpen(false);
    setSelectedMeetingRequest(null);
  };

  const openMeetingChat = (request) => {
    setChatMeetingRequest(request);
    setIsMeetingChatOpen(true);
  };

  const closeMeetingChat = () => {
    setIsMeetingChatOpen(false);
    setChatMeetingRequest(null);
  };

  const handleScheduleFormChange = (field) => (event) => {
    const value = event.target.value;
    setScheduleForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleScheduleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedMeetingRequest) return;

    if (!scheduleForm.date || !scheduleForm.time) {
      return;
    }

    const scheduledAt = new Date(`${scheduleForm.date}T${scheduleForm.time}`);
    if (Number.isNaN(scheduledAt.getTime())) {
      return;
    }

    setScheduleSubmitting(true);
    try {
      await expertService.updateMeetingRequest(selectedMeetingRequest.id, {
        status: 'accepted',
        scheduled_at: scheduledAt.toISOString(),
        response_notes: scheduleForm.notes,
      });
      await loadMeetingRequests();
      closeScheduleModal();
    } catch (error) {
      console.error('Failed to schedule meeting:', error);
    } finally {
      setScheduleSubmitting(false);
    }
  };

  const handleMeetingStatusChange = async (request, status, notes = '') => {
    if (!request) return;
    try {
      await expertService.updateMeetingRequest(request.id, {
        status,
        response_notes: notes,
      });
      await loadMeetingRequests();
    } catch (error) {
      console.error('Failed to update meeting request status:', error);
    }
  };

  useEffect(() => {
    if (userProfile) {
      loadCollaborators();
      loadMeetingRequests();
    }
  }, [userProfile, loadCollaborators, loadMeetingRequests]);

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

  const loadTrials = useCallback(async (searchOverride) => {
    if (!userProfile?.id) return;
    setTrialsLoading(true);
    setTrialsError(null);
    try {
      const params = trialsView === 'my'
        ? { createdBy: userProfile.id, limit: 100 }
        : { includeExternal: true, limit: 50 };

      // Add search term if provided
      const searchValue = typeof searchOverride === 'string' ? searchOverride : trialSearchTerm;
      if (searchValue?.trim()) {
        params.search = searchValue.trim();
      }

      const { trials: fetchedTrials } = await clinicalTrialService.fetchClinicalTrials(params);
      setTrials(fetchedTrials || []);
    } catch (error) {
      console.error('Failed to load clinical trials:', error);
      setTrialsError('Unable to load clinical trials right now. Please try again.');
    } finally {
      setTrialsLoading(false);
    }
  }, [userProfile, trialsView, trialSearchTerm]);

  useEffect(() => {
    if (!userProfile?.id) return;
    loadTrials();
  }, [userProfile, loadTrials]);

  const handleCreateTrial = async (event) => {
    event.preventDefault();
    if (!trialForm.title.trim()) {
      setTrialSubmitError('Provide a title for the clinical trial.');
      return;
    }

    setTrialSubmitting(true);
    setTrialSubmitError(null);
    try {
      const parseNumber = (value) => {
        if (value === null || value === undefined) return undefined;
        const trimmed = String(value).trim();
        if (trimmed === '') return undefined;
        const parsed = Number(trimmed);
        return Number.isFinite(parsed) ? parsed : undefined;
      };

      const tagsArray = trialForm.tags
        ? trialForm.tags
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean)
        : [];

      const payload = {
        title: trialForm.title.trim(),
        phase: trialForm.phase,
        status: trialForm.status,
        condition: trialForm.condition.trim() || undefined,
        summary: trialForm.summary.trim() || undefined,
        sponsor: trialForm.sponsor.trim() || undefined,
        location: trialForm.location.trim() || undefined,
        city: trialForm.city.trim() || undefined,
        country: trialForm.country.trim() || undefined,
        isRemote: Boolean(trialForm.isRemote),
        enrollmentTarget: parseNumber(trialForm.enrollmentTarget),
        enrollmentCurrent: parseNumber(trialForm.enrollmentCurrent),
        startDate: trialForm.startDate || undefined,
        endDate: trialForm.endDate || undefined,
        eligibility: trialForm.eligibility.trim() || undefined,
        tags: tagsArray,
        signupUrl: trialForm.signupUrl.trim() || undefined,
        contactName: trialForm.contactName.trim() || undefined,
        contactEmail: trialForm.contactEmail.trim() || undefined,
        contactPhone: trialForm.contactPhone.trim() || undefined,
      };

      const { trial } = await clinicalTrialService.createClinicalTrial(payload);
      if (trial) {
        setTrials((prev) => [trial, ...prev]);
      }
      resetTrialForm();
      setIsTrialModalOpen(false);
    } catch (error) {
      console.error('Failed to create clinical trial:', error);
      const message =
        error?.response?.data?.message || 'Unable to create the clinical trial. Please try again.';
      setTrialSubmitError(message);
  } finally {
    setTrialSubmitting(false);
  }
};

  useEffect(() => {
    if (summaryTouched) return;
    const generated = buildGeneratedTrialSummary(trialForm);
    if (generated && generated !== trialForm.summary) {
      setTrialForm((prev) => ({ ...prev, summary: generated }));
    }
  }, [
    summaryTouched,
    trialForm.title,
    trialForm.condition,
    trialForm.phase,
    trialForm.sponsor,
    trialForm.location,
    trialForm.city,
    trialForm.country,
  ]);

  useEffect(() => {
    if (eligibilityTouched) return;
    const generated = buildGeneratedTrialEligibility(trialForm);
    if (generated && generated !== trialForm.eligibility) {
      setTrialForm((prev) => ({ ...prev, eligibility: generated }));
    }
  }, [
    eligibilityTouched,
    trialForm.title,
    trialForm.condition,
    trialForm.phase,
    trialForm.sponsor,
    trialForm.location,
    trialForm.city,
    trialForm.country,
    trialForm.isRemote,
  ]);

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: <Heart className="w-4 h-4" /> },
    { id: 'trials', label: 'My Clinical Trials', icon: <FileText className="w-4 h-4" /> },
    { id: 'collaborators', label: 'Collaborators', icon: <Users className="w-4 h-4" /> },
    { id: 'forums', label: 'Forums', icon: <MessageCircle className="w-4 h-4" /> },
    { id: 'publications', label: 'My Publications', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'favorites', label: 'Favorites', icon: <Star className="w-4 h-4" /> },
  ];

  const trialStats = useMemo(() => {
    if (!Array.isArray(trials) || trials.length === 0) {
      return {
        total: 0,
        recruiting: 0,
        enrollmentCurrent: 0,
        enrollmentTarget: 0,
      };
    }

    return trials.reduce(
      (acc, trial) => {
        const status = (trial.status || '').toLowerCase();
        const current = Number(trial.enrollmentCurrent) || 0;
        const target = Number(trial.enrollmentTarget) || 0;

        if (status.includes('recruit')) {
          acc.recruiting += 1;
        }

        acc.enrollmentCurrent += current;
        acc.enrollmentTarget += target;
        acc.total += 1;
        return acc;
      },
      { total: 0, recruiting: 0, enrollmentCurrent: 0, enrollmentTarget: 0 }
    );
  }, [trials]);

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
      closeCommunityModal();
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
          <ResearcherOverviewSection
            trialStats={trialStats}
            questions={questions}
            collaborators={collaborators}
            trials={trials}
            meetingRequests={meetingRequests}
            formatDate={formatDate}
            formatDateTime={formatDateTime}
            onOpenScheduleModal={openScheduleModal}
            onOpenChat={openMeetingChat}
          />
        );
      case 'trials':
        return (
          <ResearcherTrialsSection
            trials={trials}
            trialsError={trialsError}
            trialsLoading={trialsLoading}
            trialsView={trialsView}
            onTrialsViewChange={setTrialsView}
            onCreateTrial={openTrialModal}
            onOpenDetails={openTrialDetails}
          />
        );
      case 'collaborators':
        return (
          <ResearcherCollaboratorsSection
            meetingRequests={meetingRequests}
            meetingRequestsLoading={meetingRequestsLoading}
            meetingRequestsError={meetingRequestsError}
            onRefreshMeetingRequests={loadMeetingRequests}
            onOpenScheduleModal={openScheduleModal}
            onUpdateMeetingStatus={handleMeetingStatusChange}
             onOpenChat={openMeetingChat}
            formatDate={formatDate}
            formatDateTime={formatDateTime}
            collaborators={collaborators}
            collaboratorsLoading={collaboratorsLoading}
            collaboratorsError={collaboratorsError}
            onRefreshCollaborators={loadCollaborators}
          />
        );
      case 'forums':
        return (
          <ResearcherForumsSection
            pendingQuestions={pendingQuestions}
            questions={questions}
            renderQuestionCard={renderForumQuestionCard}
            onAskQuestion={() => setIsAskModalOpen(true)}
            communityList={communityList}
            communitiesLoading={communitiesLoading}
            communitiesError={communitiesError}
            socketConnected={socketConnected}
            socketError={socketError}
            chatError={chatError}
            formatDate={formatDate}
            onCreateCommunity={handleOpenCommunityModal}
            onOpenChat={handleOpenChat}
          />
        );
      case 'publications':
        navigate('/publications');
        return null;
      case 'favorites':
        return <ResearcherFavoritesSection items={favoriteItems} />;
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

  const content = renderContent();

  return (
    <>
      <div className="min-h-screen bg-gray-50 flex">
        <ResearcherSidebar
          logoSrc={logo}
          userProfile={userProfile}
          sidebarItems={sidebarItems}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onLogout={handleLogout}
        />
        <main className="flex-1 ml-64 py-8 px-6 lg:px-10 space-y-6">
          <ResearcherHeader
            userProfile={userProfile}
            onAskQuestion={() => setIsAskModalOpen(true)}
            onCreateCommunity={handleOpenCommunityModal}
          />
          <div className="card">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search trials, collaborators, or discussions"
                  value={trialSearchTerm}
                  onChange={handleTrialSearchChange}
                  className="w-full border border-gray-200 rounded-full pl-12 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <button className="btn-secondary inline-flex items-center gap-2 px-4 py-2">
                <Filter className="w-4 h-4" />
                <span>Filters</span>
              </button>
            </div>
          </div>
          {content}
        </main>
      </div>

      <AskQuestionModal
        isOpen={isAskModalOpen}
        categories={categories}
        askForm={askForm}
        onChange={handleAskFormChange}
        onClose={() => setIsAskModalOpen(false)}
        onSubmit={handleAskSubmit}
      />

      <ReplyModal
        isOpen={isReplyModalOpen}
        question={replyTarget}
        replyForm={replyForm}
        onChangeReply={(value) => setReplyForm({ message: value })}
        onClose={closeReplyModal}
        onSubmit={handleReplySubmit}
        onAiAssist={handleReplyAI}
        aiProcessing={replyAIProcessing}
        aiError={replyAIError}
      />

      <CommunityModal
        isOpen={isCommunityModalOpen}
        communityForm={communityForm}
        onChange={handleCommunityFormChange}
        onClose={closeCommunityModal}
        onSubmit={handleCommunitySubmit}
        submitting={communitySubmitting}
        error={communitySubmitError}
      />

      <CommunityChatModal
        isOpen={isChatOpen}
        community={activeCommunity}
        messages={activeMessages}
        socketConnected={socketConnected}
        socketError={socketError}
        chatError={chatError}
        formatDateTime={formatDateTime}
        chatMessage={chatMessage}
        onChangeMessage={setChatMessage}
        onClose={handleCloseChat}
        onSendMessage={handleSendChat}
        messagesEndRef={messagesEndRef}
      />

      <TrialModal
        isOpen={isTrialModalOpen}
        trialForm={trialForm}
        onChange={handleTrialFormChange}
        trialPhases={trialPhases}
        trialStatuses={trialStatuses}
        onSubmit={handleCreateTrial}
        onClose={closeTrialModal}
        trialSubmitError={trialSubmitError}
        trialSubmitting={trialSubmitting}
      />

      <TrialDetailsModal
        isOpen={Boolean(selectedTrial)}
        trial={selectedTrial}
        onClose={closeTrialDetails}
        formatDate={formatDate}
      />

      <DiscussionModal
        isOpen={Boolean(discussionQuestion)}
        question={discussionQuestion}
        onClose={closeDiscussionModal}
        formatDate={formatDate}
        onReply={() => discussionQuestion && openReplyModal(discussionQuestion)}
      />

      <ScheduleMeetingModal
        isOpen={isScheduleModalOpen}
        meetingRequest={selectedMeetingRequest}
        scheduleForm={scheduleForm}
        onChangeField={handleScheduleFormChange}
        onSubmit={handleScheduleSubmit}
        onClose={closeScheduleModal}
        submitting={scheduleSubmitting}
      />

      <MeetingChatModal
        isOpen={isMeetingChatOpen}
        meeting={chatMeetingRequest}
        role="researcher"
        onClose={closeMeetingChat}
      />

      <ChatWidget role="researcher" />
    </>
  );
};

export default ResearcherDashboard;
