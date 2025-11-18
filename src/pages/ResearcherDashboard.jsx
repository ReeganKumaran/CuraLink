import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  X,
} from 'lucide-react';
import { logo } from '../assets/assets';
import authService from '../services/authService';
import expertService from '../services/expertService';
import aiService from '../services/aiService';
import { useForumData } from '../hooks/useForumData';
import useCommunityChat from '../hooks/useCommunityChat';
import ChatWidget from '../components/ChatWidget';
import api from '../services/api';
import clinicalTrialService from '../services/clinicalTrialService';
import collaboratorChatService from '../services/collaboratorChatService';
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

const hasCoordinates = (lat, lon) => Number.isFinite(lat) && Number.isFinite(lon);

const computeDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (!hasCoordinates(lat1, lon1) || !hasCoordinates(lat2, lon2)) {
    return null;
  }
  const toRad = (degree) => (degree * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const formatDistanceLabel = (distanceKm) => {
  if (!Number.isFinite(distanceKm)) {
    return '';
  }
  if (distanceKm >= 100) {
    return `${Math.round(distanceKm)} km away`;
  }
  if (distanceKm >= 1) {
    return `${distanceKm.toFixed(1)} km away`;
  }
  return `${Math.round(distanceKm * 1000)} m away`;
};

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
  const location = useLocation();
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
  const collaboratorChatScrollRef = useRef(null);
  const collaboratorChatStatusTimeoutRef = useRef(null);

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
  const [selectedCollaborator, setSelectedCollaborator] = useState(null);
  const [isCollaboratorModalOpen, setIsCollaboratorModalOpen] = useState(false);
  const [collaboratorContactStatus, setCollaboratorContactStatus] = useState(null);
  const [collaboratorChats, setCollaboratorChats] = useState({});
  const [collaboratorChatLoading, setCollaboratorChatLoading] = useState(false);
  const [collaboratorChatError, setCollaboratorChatError] = useState(null);
  const [collaboratorChatInput, setCollaboratorChatInput] = useState('');
  const [collaboratorChatStatus, setCollaboratorChatStatus] = useState(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedMeetingRequest, setSelectedMeetingRequest] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({ date: '', time: '', notes: '' });
  const [scheduleSubmitting, setScheduleSubmitting] = useState(false);
  const [isMeetingChatOpen, setIsMeetingChatOpen] = useState(false);
  const [chatMeetingRequest, setChatMeetingRequest] = useState(null);
  const [locationUpdating, setLocationUpdating] = useState(false);
  const [locationUpdateMessage, setLocationUpdateMessage] = useState(null);

  const trialPhases = useMemo(
    () => ['Phase I', 'Phase II', 'Phase III', 'Phase IV', 'Observational'],
    []
  );
  const trialStatuses = useMemo(
    () => ['Recruiting', 'Active', 'Completed', 'Suspended', 'Not Yet Recruiting'],
    []
  );

  const researcherLocation = useMemo(
    () => ({
      latitude:
        typeof userProfile?.latitude === 'number'
          ? userProfile.latitude
          : userProfile?.latitude
          ? Number(userProfile.latitude)
          : null,
      longitude:
        typeof userProfile?.longitude === 'number'
          ? userProfile.longitude
          : userProfile?.longitude
          ? Number(userProfile.longitude)
          : null,
    }),
    [userProfile?.latitude, userProfile?.longitude]
  );

  const hasResearcherLocation = hasCoordinates(
    researcherLocation.latitude,
    researcherLocation.longitude
  );

  const annotateMeetingRequests = useCallback(
    (requests = []) =>
      requests.map((request) => {
        const patientLat =
          typeof request.patient_profile?.latitude === 'number'
            ? request.patient_profile.latitude
            : request.patient_profile?.latitude
            ? Number(request.patient_profile.latitude)
            : null;
        const patientLon =
          typeof request.patient_profile?.longitude === 'number'
            ? request.patient_profile.longitude
            : request.patient_profile?.longitude
            ? Number(request.patient_profile.longitude)
            : null;
        const distanceKm =
          hasCoordinates(researcherLocation.latitude, researcherLocation.longitude) &&
          hasCoordinates(patientLat, patientLon)
            ? computeDistanceKm(
                researcherLocation.latitude,
                researcherLocation.longitude,
                patientLat,
                patientLon
              )
            : null;
        return {
          ...request,
          distanceKm,
        };
      }),
    [researcherLocation]
  );

  const annotateCollaborators = useCallback(
    (experts = []) =>
      experts.map((expert) => {
        const expertLat =
          typeof expert.latitude === 'number' ? expert.latitude : Number(expert.latitude);
        const expertLon =
          typeof expert.longitude === 'number' ? expert.longitude : Number(expert.longitude);
        const distanceKm =
          hasCoordinates(researcherLocation.latitude, researcherLocation.longitude) &&
          hasCoordinates(expertLat, expertLon)
            ? computeDistanceKm(
                researcherLocation.latitude,
                researcherLocation.longitude,
                expertLat,
                expertLon
              )
            : null;
        return { ...expert, distanceKm };
      }),
    [researcherLocation]
  );

const getCollaboratorEmail = (collaborator) =>
  collaborator?.email ||
  collaborator?.contactEmail ||
  collaborator?.contact_email ||
  collaborator?.preferredEmail ||
  '';

const normalizeSearchText = (value) =>
  typeof value === 'string'
    ? value
        .toLowerCase()
        .replace(/[\.\,\-_\/\\]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    : '';
const getCollaboratorIdentity = (collaborator) =>
  collaborator?.id || collaborator?.userId || collaborator?.user_id || null;

  const collaboratorChatMessages = useMemo(() => {
    const collaboratorId = getCollaboratorIdentity(selectedCollaborator);
    if (!collaboratorId) {
      return [];
    }
    const key = String(collaboratorId);
    return collaboratorChats[key] || [];
  }, [collaboratorChats, selectedCollaborator]);

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

  const handleCollaboratorConnect = useCallback((collaborator) => {
    if (!collaborator) return;
    setSelectedCollaborator(collaborator);
    setCollaboratorContactStatus(null);
    setCollaboratorChatStatus(null);
    setCollaboratorChatError(null);
    setCollaboratorChatInput('');
    if (collaboratorChatStatusTimeoutRef.current) {
      clearTimeout(collaboratorChatStatusTimeoutRef.current);
      collaboratorChatStatusTimeoutRef.current = null;
    }
    setIsCollaboratorModalOpen(true);
  }, []);

  const handleCopyCollaboratorEmail = useCallback(async () => {
    if (!selectedCollaborator) return;
    const email = getCollaboratorEmail(selectedCollaborator);
    if (!email) {
      setCollaboratorContactStatus('This researcher has not shared a contact email yet.');
      return;
    }
    try {
      if (typeof navigator !== 'undefined' && navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(email);
        setCollaboratorContactStatus('Email copied to clipboard.');
      } else {
        throw new Error('Clipboard not supported');
      }
    } catch (error) {
      console.error('Failed to copy collaborator email:', error);
      setCollaboratorContactStatus('Unable to copy automatically. Please copy the email manually.');
    }
  }, [selectedCollaborator]);

  const handleEmailCollaborator = useCallback(() => {
    if (!selectedCollaborator) return;
    const email = getCollaboratorEmail(selectedCollaborator);
    if (!email) {
      setCollaboratorContactStatus('This researcher has not shared a contact email yet.');
      return;
    }
    const subject = encodeURIComponent('Collaboration inquiry via CuraLink');
    const greeting = selectedCollaborator.name
      ? `Hi ${selectedCollaborator.name.split(' ')[0]},\n\n`
      : '';
    const body = encodeURIComponent(
      `${greeting}I'd love to connect about potential collaboration opportunities.`
    );
    const mailtoLink = `mailto:${email}?subject=${subject}&body=${body}`;
    if (typeof window !== 'undefined') {
      window.open(mailtoLink, '_blank', 'noopener');
    }
  }, [selectedCollaborator]);

  const handleSendCollaboratorChatMessage = useCallback(
    async (event) => {
      event?.preventDefault?.();
      if (!selectedCollaborator || !userProfile?.id) return;
      const trimmed = collaboratorChatInput.trim();
      if (!trimmed) return;
      const collaboratorId = getCollaboratorIdentity(selectedCollaborator);
      if (!collaboratorId) return;
      const key = String(collaboratorId);

      setCollaboratorChatError(null);
      try {
        const { message: savedMessage } = await collaboratorChatService.sendCollaboratorMessage(
          collaboratorId,
          trimmed
        );

        setCollaboratorChats((prev) => ({
          ...prev,
          [key]: [...(prev[key] || []), savedMessage],
        }));

        setCollaboratorChatInput('');
        if (collaboratorChatStatusTimeoutRef.current) {
          clearTimeout(collaboratorChatStatusTimeoutRef.current);
        }
        setCollaboratorChatStatus('Message sent.');
        collaboratorChatStatusTimeoutRef.current = setTimeout(
          () => setCollaboratorChatStatus(null),
          4000
        );
      } catch (error) {
        console.error('Failed to send collaborator chat message:', error);
        setCollaboratorChatError(
          error?.response?.data?.message || 'Unable to send message. Please try again.'
        );
      }
    },
    [collaboratorChatInput, selectedCollaborator, userProfile?.id]
  );

  const closeCollaboratorModal = useCallback(() => {
    setSelectedCollaborator(null);
    setIsCollaboratorModalOpen(false);
    setCollaboratorContactStatus(null);
    setCollaboratorChatStatus(null);
    setCollaboratorChatError(null);
    setCollaboratorChatLoading(false);
    setCollaboratorChatInput('');
    if (collaboratorChatStatusTimeoutRef.current) {
      clearTimeout(collaboratorChatStatusTimeoutRef.current);
      collaboratorChatStatusTimeoutRef.current = null;
    }
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
          latitude:
            typeof userData.profile?.latitude === 'number'
              ? userData.profile.latitude
              : userData.profile?.latitude
              ? Number(userData.profile.latitude)
              : null,
          longitude:
            typeof userData.profile?.longitude === 'number'
              ? userData.profile.longitude
              : userData.profile?.longitude
              ? Number(userData.profile.longitude)
              : null,
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

  useEffect(() => {
    if (collaboratorChatScrollRef.current) {
      collaboratorChatScrollRef.current.scrollTop =
        collaboratorChatScrollRef.current.scrollHeight;
    }
  }, [collaboratorChatMessages]);

  useEffect(() => {
    const loadCollaboratorChat = async () => {
      const collaboratorId = getCollaboratorIdentity(selectedCollaborator);
      if (!userProfile?.id || !collaboratorId) return;
      const key = String(collaboratorId);
      if (collaboratorChats[key]) {
        return;
      }
      setCollaboratorChatLoading(true);
      setCollaboratorChatError(null);
      try {
        const { messages } = await collaboratorChatService.fetchCollaboratorMessages(
          collaboratorId
        );
        setCollaboratorChats((prev) => ({
          ...prev,
          [key]: messages || [],
        }));
      } catch (error) {
        console.error('Failed to load collaborator chat:', error);
        setCollaboratorChatError('Unable to load chat history.');
      } finally {
        setCollaboratorChatLoading(false);
      }
    };

    loadCollaboratorChat();
  }, [selectedCollaborator, userProfile?.id, collaboratorChats]);

  useEffect(() => {
    return () => {
      if (collaboratorChatStatusTimeoutRef.current) {
        clearTimeout(collaboratorChatStatusTimeoutRef.current);
      }
    };
  }, []);

  const loadCollaborators = useCallback(async () => {
    if (!userProfile) return;
    setCollaboratorsLoading(true);
    setCollaboratorsError(null);
    try {
      const { experts } = await expertService.fetchExperts({
        search: '',
        condition: '',
        limit: 100 // Request more collaborators to ensure all platform researchers are included
      });

      // Remove duplicates by id and filter out current user
      const uniqueExperts = Array.from(
        new Map((experts || []).map(expert => [expert.id, expert])).values()
      );
      const filtered = uniqueExperts.filter((expert) => expert.id !== userProfile.id);

      const annotated = annotateCollaborators(filtered);
      setCollaborators(annotated);
    } catch (error) {
      console.error('Failed to load collaborators:', error);
      setCollaboratorsError('Unable to load collaborators right now. Please try again later.');
    } finally {
      setCollaboratorsLoading(false);
    }
  }, [userProfile, annotateCollaborators]);

  const loadMeetingRequests = useCallback(async () => {
    if (!userProfile) return;
    setMeetingRequestsLoading(true);
    setMeetingRequestsError(null);
    try {
      const { requests } = await expertService.fetchResearcherMeetingRequests();
      const enriched = annotateMeetingRequests(requests || []);
      setMeetingRequests(enriched);
    } catch (error) {
      console.error('Failed to load meeting requests:', error);
      setMeetingRequestsError('Unable to load meeting requests right now. Please try again.');
    } finally {
      setMeetingRequestsLoading(false);
    }
  }, [userProfile, annotateMeetingRequests]);

  const handleUseCurrentLocation = useCallback(() => {
    if (!userProfile) return;
    if (!navigator.geolocation) {
      setLocationUpdateMessage('Geolocation is not supported in this browser.');
      setTimeout(() => setLocationUpdateMessage(null), 4000);
      return;
    }
    setLocationUpdating(true);
    setLocationUpdateMessage('Locating…');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          await api.put('/researchers/profile', {
            latitude,
            longitude,
          });
          setUserProfile((prev) =>
            prev
              ? {
                  ...prev,
                  latitude,
                  longitude,
                }
              : prev
          );
          setLocationUpdateMessage('Location updated.');
          await Promise.all([loadCollaborators(), loadMeetingRequests()]);
        } catch (error) {
          console.error('Failed to update location:', error);
          setLocationUpdateMessage('Unable to update location. Please try again.');
        } finally {
          setLocationUpdating(false);
          setTimeout(() => setLocationUpdateMessage(null), 4000);
        }
      },
      (error) => {
        console.warn('Geolocation error:', error);
        setLocationUpdating(false);
        setLocationUpdateMessage(error.message || 'Location permission denied.');
        setTimeout(() => setLocationUpdateMessage(null), 4000);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [userProfile, loadCollaborators, loadMeetingRequests]);

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

  const sidebarItems = useMemo(
    () => [
      { id: 'overview', label: 'Overview', icon: <Heart className="w-4 h-4" /> },
      { id: 'trials', label: 'My Clinical Trials', icon: <FileText className="w-4 h-4" /> },
      { id: 'collaborators', label: 'Collaborators', icon: <Users className="w-4 h-4" /> },
      { id: 'forums', label: 'Forums', icon: <MessageCircle className="w-4 h-4" /> },
      { id: 'publications', label: 'My Publications', icon: <TrendingUp className="w-4 h-4" /> },
      { id: 'favorites', label: 'Favorites', icon: <Star className="w-4 h-4" /> },
    ],
    []
  );

  const handleTabChange = useCallback(
    (tabId) => {
      if (!sidebarItems.some((item) => item.id === tabId)) {
        return;
      }
      setActiveTab(tabId);
      const params = new URLSearchParams(location.search);
      if (tabId === 'overview') {
        params.delete('tab');
      } else {
        params.set('tab', tabId);
      }
      const query = params.toString();
      navigate(`/researcher/dashboard${query ? `?${query}` : ''}`, { replace: true });
    },
    [location.search, navigate, sidebarItems]
  );

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const requestedTab = params.get('tab');

    if (requestedTab && sidebarItems.some((item) => item.id === requestedTab)) {
      setActiveTab(requestedTab);
    } else if (!requestedTab) {
      setActiveTab('overview');
    }
  }, [location.search, sidebarItems]);

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

  const filteredCollaborators = useMemo(() => {
    const query = normalizeSearchText(trialSearchTerm);
    if (!query) return collaborators;

    return collaborators.filter((collaborator) => {
      const specialties =
        Array.isArray(collaborator.specialties) && collaborator.specialties.length > 0
          ? collaborator.specialties.join(' ')
          : collaborator.specialties;

      const searchPool = [
        collaborator.name,
        collaborator.institution,
        specialties,
        collaborator.researchInterests,
        collaborator.focus,
        collaborator.city,
        collaborator.country,
      ]
        .map((field) => normalizeSearchText(field))
        .filter(Boolean);

      return searchPool.some((field) => field.includes(query));
    });
  }, [collaborators, trialSearchTerm]);

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
          <div className="space-y-4">
            {!hasResearcherLocation && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  Share your current location to unlock distance insights for patient requests.
                </span>
                <div className="flex items-center gap-3">
                  {locationUpdateMessage && (
                    <span className="text-xs text-gray-500">{locationUpdateMessage}</span>
                  )}
                  <button
                    onClick={handleUseCurrentLocation}
                    disabled={locationUpdating}
                    className="btn-secondary text-xs px-4 py-2 disabled:opacity-60"
                  >
                    {locationUpdating ? 'Detecting…' : 'Use current location'}
                  </button>
                </div>
              </div>
            )}
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
              formatDistanceLabel={formatDistanceLabel}
            />
          </div>
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
          <div className="space-y-4">
            {!hasResearcherLocation && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span>
                  Share your location to see how far patients and collaborators are from you.
                </span>
                <div className="flex items-center gap-3">
                  {locationUpdateMessage && (
                    <span className="text-gray-500">{locationUpdateMessage}</span>
                  )}
                  <button
                    onClick={handleUseCurrentLocation}
                    disabled={locationUpdating}
                    className="btn-secondary text-xs px-4 py-2 disabled:opacity-60"
                  >
                    {locationUpdating ? 'Detecting…' : 'Use current location'}
                  </button>
                </div>
              </div>
            )}
            <ResearcherCollaboratorsSection
              meetingRequests={meetingRequests}
              meetingRequestsLoading={meetingRequestsLoading}
              meetingRequestsError={meetingRequestsError}
              onRefreshMeetingRequests={loadMeetingRequests}
              onOpenScheduleModal={openScheduleModal}
              onUpdateMeetingStatus={handleMeetingStatusChange}
              onOpenChat={openMeetingChat}
              onConnectCollaborator={handleCollaboratorConnect}
              formatDistanceLabel={formatDistanceLabel}
              formatDate={formatDate}
              formatDateTime={formatDateTime}
              collaborators={filteredCollaborators}
              collaboratorsLoading={collaboratorsLoading}
              collaboratorsError={collaboratorsError}
              onRefreshCollaborators={loadCollaborators}
            />
          </div>
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
        return <ResearcherPublicationsSection publications={mockPublications} />;
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
          onSelectTab={handleTabChange}
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

      {isCollaboratorModalOpen && selectedCollaborator && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeCollaboratorModal} />
          <div className="relative z-50 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-primary-600">
                  Collaborator contact
                </p>
                <h3 className="text-xl font-semibold text-gray-900 mt-1">
                  {selectedCollaborator.name || 'Researcher'}
                </h3>
                {selectedCollaborator.institution && (
                  <p className="text-sm text-gray-500">{selectedCollaborator.institution}</p>
                )}
                {Number.isFinite(selectedCollaborator.distanceKm) && (
                  <p className="text-xs text-primary-600 mt-1">
                    {formatDistanceLabel(selectedCollaborator.distanceKm)}
                  </p>
                )}
              </div>
              <button
                onClick={closeCollaboratorModal}
                className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
                aria-label="Close collaborator modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm text-gray-600">
              {selectedCollaborator.specialties && selectedCollaborator.specialties.length > 0 && (
                <p>
                  <span className="font-medium text-gray-800">Specialties:</span>{' '}
                  {selectedCollaborator.specialties.join(', ')}
                </p>
              )}
              {selectedCollaborator.researchInterests && (
                <p>
                  <span className="font-medium text-gray-800">Focus:</span>{' '}
                  {selectedCollaborator.researchInterests}
                </p>
              )}
              <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {getCollaboratorEmail(selectedCollaborator) || 'Not provided'}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900">Direct chat</p>
                <span className="text-[11px] uppercase tracking-wide text-primary-500">Beta</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Start a quick conversation before sending a formal email. Messages are stored so both
                researchers can revisit the thread.
              </p>
              <div className="mt-3 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                {collaboratorChatError && (
                  <p className="text-xs text-red-600 mb-2">{collaboratorChatError}</p>
                )}
                <div
                  ref={collaboratorChatScrollRef}
                  className="h-48 overflow-y-auto space-y-3 pr-1"
                >
                  {collaboratorChatLoading ? (
                    <div className="text-center text-sm text-gray-500 py-6">Loading chat…</div>
                  ) : collaboratorChatMessages.length === 0 ? (
                    <div className="text-center text-sm text-gray-500 py-6">
                      No messages yet. Say hello to break the ice.
                    </div>
                  ) : (
                    collaboratorChatMessages.map((message) => {
                      const senderId = message.senderId || message.sender;
                      const isSelf = senderId === userProfile?.id || message.sender === 'researcher';
                      const body = message.message || message.text;
                      const timestamp = message.createdAt || message.timestamp;
                      return (
                        <div
                          key={message.id}
                          className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                              isSelf
                                ? 'bg-primary-600 text-white rounded-br-sm'
                                : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm'
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{body}</p>
                            <p
                              className={`text-[11px] mt-1 ${
                                isSelf ? 'text-primary-100 text-right' : 'text-gray-500'
                              }`}
                            >
                              {timestamp
                                ? new Date(timestamp).toLocaleTimeString([], {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                  })
                                : ''}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <form onSubmit={handleSendCollaboratorChatMessage} className="mt-3 space-y-3">
                  <textarea
                    value={collaboratorChatInput}
                    onChange={(event) => setCollaboratorChatInput(event.target.value)}
                    className="w-full rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Write a quick hello or share context..."
                    rows={3}
                  />
                  <div className="flex items-center justify-end">
                    <button
                      type="submit"
                      className="btn-primary px-6 py-2 text-sm disabled:opacity-60"
                      disabled={!collaboratorChatInput.trim() || collaboratorChatLoading}
                    >
                      Send message
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {collaboratorChatStatus && (
              <p className="mt-4 text-xs text-primary-600">{collaboratorChatStatus}</p>
            )}
            {collaboratorContactStatus && (
              <p className="mt-2 text-sm text-primary-600">{collaboratorContactStatus}</p>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={handleCopyCollaboratorEmail}
                className="btn-secondary w-full sm:w-auto"
                disabled={!getCollaboratorEmail(selectedCollaborator)}
              >
                Copy email
              </button>
              <button
                onClick={handleEmailCollaborator}
                className="btn-primary w-full sm:w-auto"
                disabled={!getCollaboratorEmail(selectedCollaborator)}
              >
                Email collaborator
              </button>
            </div>
          </div>
        </div>
      )}

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
