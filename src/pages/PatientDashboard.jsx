import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Heart, Users, BookOpen, FileText, MessageCircle, Star,
  Search, Calendar, MapPin, LogOut, User, X, ExternalLink, Sparkles,
  Share2, ClipboardCheck, BookmarkPlus, BookmarkCheck, Loader, ArrowRight,
} from 'lucide-react';
import { logo } from '../assets/assets';
import authService from '../services/authService';
import aiService from '../services/aiService';
import expertService from '../services/expertService';
import clinicalTrialService from '../services/clinicalTrialService';
import publicationService from '../services/publicationService';
import api from '../services/api';
import { useForumData } from '../hooks/useForumData';
import ChatWidget from '../components/ChatWidget';
import UnifiedSearchModal from '../components/search/UnifiedSearchModal';
import MeetingChatModal from '../components/meetings/MeetingChatModal';
import * as XLSX from 'xlsx';

const EXPERTS_REFRESH_INTERVAL_MS = 4 * 60 * 1000;
const TRIALS_REFRESH_INTERVAL_MS = 6 * 60 * 1000;

const normalizeLocationText = (value) =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

const hasCoordinates = (lat, lon) =>
  Number.isFinite(lat) && Number.isFinite(lon);

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

const normalizeText = (value = '') => value.toLowerCase();

const tokenizeSearchTerm = (term = '') =>
  term
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter(Boolean);

const computeTextMatch = (text = '', keywords = []) => {
  if (!text || keywords.length === 0) return 0;
  const normalized = normalizeText(text);
  if (!normalized) return 0;
  const matches = keywords.filter((keyword) => normalized.includes(keyword));
  return matches.length / keywords.length;
};

const computeTrialMatchScore = (trial, { condition, searchTerm, location }) => {
  let score = 0;
  const keywords = tokenizeSearchTerm(searchTerm);

  if (condition) {
    const normalizedCondition = normalizeText(condition);
    const conditionFields = [trial.condition, trial.title, trial.summary, trial.sponsor]
      .filter(Boolean)
      .map(normalizeText);

    const conditionHit = conditionFields.some((field) => field.includes(normalizedCondition));
    if (conditionHit) {
      score += trial.source === 'clinicaltrials.gov' ? 55 : 50;
    }
  }

  if (keywords.length > 0) {
    const content = [
      trial.title,
      trial.summary,
      trial.condition,
      trial.sponsor,
      Array.isArray(trial.tags) ? trial.tags.join(' ') : '',
    ]
      .filter(Boolean)
      .join(' ');
    score += computeTextMatch(content, keywords) * 40;
  }

  if (location) {
    const locationText = [trial.location, trial.city, trial.country].filter(Boolean).join(' ').toLowerCase();
    if (locationText.includes(location.toLowerCase())) {
      score += 12;
    }
  }

  if (trial.isRemote) {
    score += 3;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
};

const MatchScoreBadge = ({ score }) => {
  if (!Number.isFinite(score)) {
    return null;
  }
  const rounded = Math.max(1, Math.min(100, Math.round(score)));
  return (
    <span className="inline-flex items-center rounded-full bg-fuchsia-50 text-fuchsia-700 text-xs font-semibold px-2.5 py-0.5">
      {rounded}% match
    </span>
  );
};

const computeLocationScore = (fields = [], patientLocation = {}, extras = {}) => {
  const patientLat = Number(patientLocation.latitude);
  const patientLon = Number(patientLocation.longitude);
  const targetLat = extras.latitude;
  const targetLon = extras.longitude;

  if (hasCoordinates(patientLat, patientLon) && hasCoordinates(targetLat, targetLon)) {
    const distanceKm = computeDistanceKm(patientLat, patientLon, targetLat, targetLon);
    const score = Math.max(0, 200 - distanceKm);
    return {
      score,
      label: formatDistanceLabel(distanceKm),
      distanceKm,
    };
  }

  const normalizedFields = fields
    .map((field) => normalizeLocationText(field))
    .filter(Boolean);
  if (normalizedFields.length === 0 && !extras.isRemote) {
    return { score: 0, label: '', distanceKm: null };
  }

  const patientCity = normalizeLocationText(patientLocation.city);
  const patientCountry = normalizeLocationText(patientLocation.country);
  let score = 0;
  let label = '';

  if (patientCity) {
    const hasCityMatch = normalizedFields.some((field) => field.includes(patientCity));
    if (hasCityMatch) {
      score += 60;
      label = patientLocation.city ? `Near ${patientLocation.city}` : 'Nearby';
    }
  }

  if (!label && patientCountry) {
    const hasCountryMatch = normalizedFields.some((field) => field.includes(patientCountry));
    if (hasCountryMatch) {
      score += 40;
      label = patientLocation.country ? `Matches ${patientLocation.country}` : 'Regional match';
    }
  }

  if (!label && extras.isRemote) {
    score += 20;
    label = 'Remote friendly';
  }

  if (extras.baseScore) {
    score += extras.baseScore;
  }

  return { score, label, distanceKm: null };
};

const annotateAndSortByLocation = (items = [], patientLocation = {}, resolver) => {
  if (
    !patientLocation?.city &&
    !patientLocation?.country &&
    !hasCoordinates(patientLocation?.latitude, patientLocation?.longitude)
  ) {
    return items;
  }

  return items
    .map((item, index) => {
      const config = resolver(item) || {};
      const { score, label, distanceKm } = computeLocationScore(config.fields, patientLocation, config.extras);
      return {
        ...item,
        locationScore: score,
        locationMatchLabel: label,
        distanceKm,
        normalizedMatchScore: Number.isFinite(item.matchScore) ? item.matchScore : 0,
        _originalIndex: index,
      };
    })
    .sort((a, b) => {
      const matchDiff = b.normalizedMatchScore - a.normalizedMatchScore;
      if (Math.abs(matchDiff) > 0.0001) {
        return matchDiff;
      }
      if (b.locationScore === a.locationScore) {
        return a._originalIndex - b._originalIndex;
      }
      return b.locationScore - a.locationScore;
    })
    .map(({ _originalIndex, normalizedMatchScore, ...rest }) => rest);
};

const formatLastUpdatedLabel = (timestamp) => {
  if (!timestamp) {
    return 'Updating...';
  }
  const diff = Date.now() - timestamp;
  if (diff < 60 * 1000) {
    return 'Updated just now';
  }
  const minutes = Math.floor(diff / (60 * 1000));
  if (minutes < 60) {
    return `Updated ${minutes} min${minutes > 1 ? 's' : ''} ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `Updated ${hours} hr${hours > 1 ? 's' : ''} ago`;
  }
  const days = Math.floor(hours / 24);
  return `Updated ${days} day${days > 1 ? 's' : ''} ago`;
};

const PatientDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
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
  const [expertActiveQuery, setExpertActiveQuery] = useState('');
  const [followedExpertIds, setFollowedExpertIds] = useState([]);
  const [clinicalTrials, setClinicalTrials] = useState([]);
  const [trialsLoading, setTrialsLoading] = useState(false);
  const [trialsError, setTrialsError] = useState(null);
  const [trialFilters, setTrialFilters] = useState({ phase: 'all', location: 'all' });
  const [trialSearch, setTrialSearch] = useState('');
  const [trialActiveQuery, setTrialActiveQuery] = useState('');
  const trialActiveQueryRef = useRef('');
  const [trialInitialized, setTrialInitialized] = useState(false);
  const [selectedTrial, setSelectedTrial] = useState(null);
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [selectedExpert, setSelectedExpert] = useState(null);
  const [profileModalExpert, setProfileModalExpert] = useState(null);
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
  const [isUnifiedSearchOpen, setIsUnifiedSearchOpen] = useState(false);
  const [isMeetingChatOpen, setIsMeetingChatOpen] = useState(false);
  const [chatMeetingRequest, setChatMeetingRequest] = useState(null);
  const [expertsUpdatedAt, setExpertsUpdatedAt] = useState(null);
  const [trialsUpdatedAt, setTrialsUpdatedAt] = useState(null);
  const [favoriteCollections, setFavoriteCollections] = useState({
    experts: [],
    trials: [],
    publications: [],
  });
  const [expertCache, setExpertCache] = useState({});
  const [favoriteTrialsCache, setFavoriteTrialsCache] = useState({});
  const [favoritePublications, setFavoritePublications] = useState([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [favoritesError, setFavoritesError] = useState(null);
  const [selectedExpertIds, setSelectedExpertIds] = useState(() => new Set());
  const [selectedTrialIds, setSelectedTrialIds] = useState(() => new Set());
  const [selectedPublicationIds, setSelectedPublicationIds] = useState(() => new Set());
  const [exportStatus, setExportStatus] = useState(null);
  const [isExportingFavorites, setIsExportingFavorites] = useState(false);
  const [exportSummaryText, setExportSummaryText] = useState('');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [copySummaryStatus, setCopySummaryStatus] = useState(null);
  const pendingTrialFetches = useRef(new Set());
  const [followProcessingIds, setFollowProcessingIds] = useState(() => new Set());
  const [locationUpdating, setLocationUpdating] = useState(false);
  const [locationUpdateMessage, setLocationUpdateMessage] = useState(null);
  const buildExpertQuery = useCallback(
    (input = '') => {
      const baseCondition =
        userProfile?.condition && userProfile.condition !== 'Not specified'
          ? userProfile.condition.trim()
          : '';
      const trimmedInput = input.trim();
      if (!baseCondition) {
        return trimmedInput;
      }
      if (!trimmedInput) {
        return baseCondition;
      }
      if (trimmedInput.toLowerCase().includes(baseCondition.toLowerCase())) {
        return trimmedInput;
      }
      return `${baseCondition} ${trimmedInput}`.trim();
    },
    [userProfile?.condition]
  );
  const buildTrialQuery = useCallback(
    (input = '') => {
      const baseCondition =
        userProfile?.condition && userProfile.condition !== 'Not specified'
          ? userProfile.condition.trim()
          : '';
      const trimmedInput = input.trim();
      if (!baseCondition) {
        return trimmedInput;
      }
      if (!trimmedInput) {
        return baseCondition;
      }
      if (trimmedInput.toLowerCase().includes(baseCondition.toLowerCase())) {
        return trimmedInput;
      }
      return `${baseCondition} ${trimmedInput}`.trim();
    },
    [userProfile?.condition]
  );

  const unifiedSearchContext = useMemo(() => {
    const conditionValue =
      userProfile?.condition && userProfile.condition !== 'Not specified'
        ? userProfile.condition
        : '';
    const locationValue = userProfile?.city || userProfile?.country || '';
    return { condition: conditionValue, location: locationValue };
  }, [userProfile?.condition, userProfile?.city, userProfile?.country]);

  const patientLocation = useMemo(
    () => ({
      city: (userProfile?.city || '').trim(),
      country: (userProfile?.country || '').trim(),
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
    [userProfile?.city, userProfile?.country, userProfile?.latitude, userProfile?.longitude]
  );

  const topMatchExperts = useMemo(() => {
    if (!Array.isArray(experts) || experts.length === 0) {
      return [];
    }
    const sorted = [...experts].sort((a, b) => {
      const aScore = Number.isFinite(a.matchScore) ? a.matchScore : -1;
      const bScore = Number.isFinite(b.matchScore) ? b.matchScore : -1;
      if (aScore === bScore) {
        return 0;
      }
      return bScore - aScore;
    });
    return sorted.slice(0, 3);
  }, [experts]);

  const applyExpertLocationSort = useCallback(
    (items = []) =>
      annotateAndSortByLocation(items, patientLocation, (expert) => {
        const latitude =
          typeof expert.latitude === 'number'
            ? expert.latitude
            : expert.latitude
            ? Number(expert.latitude)
            : null;
        const longitude =
          typeof expert.longitude === 'number'
            ? expert.longitude
            : expert.longitude
            ? Number(expert.longitude)
            : null;
        return {
          fields: [expert.location, expert.institution, expert.city, expert.country],
          extras: {
            latitude,
            longitude,
            isRemote: Boolean(expert.availableForMeetings && !hasCoordinates(latitude, longitude)),
          },
        };
      }),
    [patientLocation]
  );

  const applyTrialLocationSort = useCallback(
    (items = []) =>
      annotateAndSortByLocation(items, patientLocation, (trial) => ({
        fields: [trial.city, trial.country, trial.location],
        extras: {
          isRemote: Boolean(trial.isRemote),
          latitude:
            typeof trial.latitude === 'number'
              ? trial.latitude
              : trial.latitude
              ? Number(trial.latitude)
              : null,
          longitude:
            typeof trial.longitude === 'number'
              ? trial.longitude
              : trial.longitude
              ? Number(trial.longitude)
              : null,
        },
      })),
    [patientLocation]
  );

  const favoriteExpertsList = useMemo(
    () =>
      applyExpertLocationSort(
        favoriteCollections.experts
          .map((id) => expertCache[id])
          .filter(Boolean)
      ),
    [favoriteCollections.experts, expertCache, applyExpertLocationSort]
  );

  const favoriteTrialsList = useMemo(
    () =>
      applyTrialLocationSort(
        favoriteCollections.trials
          .map((id) => favoriteTrialsCache[id])
          .filter(Boolean)
      ),
    [favoriteCollections.trials, favoriteTrialsCache, applyTrialLocationSort]
  );

  const favoritePublicationsList = useMemo(
    () =>
      favoriteCollections.publications
        .map((pmid) => favoritePublications.find((pub) => pub.pmid === pmid))
        .filter(Boolean),
    [favoriteCollections.publications, favoritePublications]
  );

  useEffect(() => {
    setFollowedExpertIds(favoriteCollections.experts);
  }, [favoriteCollections.experts]);

  const selectedFavoritesCount =
    selectedExpertIds.size + selectedTrialIds.size + selectedPublicationIds.size;
  const hasFavoriteSelections = selectedFavoritesCount > 0;

  const updateFavoriteCollections = useCallback((type, values) => {
    setFavoriteCollections((prev) => ({
      ...prev,
      [type]: values,
    }));
    setUserProfile((prev) => {
      if (!prev) return prev;
      const nextFavorites = {
        ...(prev.favorites || {}),
        [type]: values,
      };
      return { ...prev, favorites: nextFavorites };
    });
  }, []);

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

        const profileFavorites = {
          experts: Array.isArray(userData.profile?.favorites?.experts)
            ? userData.profile.favorites.experts
            : [],
          trials: Array.isArray(userData.profile?.favorites?.trials)
            ? userData.profile.favorites.trials
            : [],
          publications: Array.isArray(userData.profile?.favorites?.publications)
            ? userData.profile.favorites.publications
            : [],
        };

        setUserProfile({
          name: userData.user.name,
          email: userData.user.email,
          condition: userData.profile?.condition || 'Not specified',
          city: userData.profile?.city,
          country: userData.profile?.country,
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
          favorites: profileFavorites,
        });
        setFavoriteCollections(profileFavorites);
        setFollowedExpertIds(profileFavorites.experts);
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
};

const loadClinicalTrials = useCallback(
  async ({ query, location } = {}) => {
    if (!userProfile) return;
    setTrialsLoading(true);
    setTrialsError(null);
    try {
      const params = {
        limit: 40,
        includeExternal: true,
      };

      if (trialFilters.phase !== 'all') {
        params.phase = trialFilters.phase;
      }

      const locationFilter = location || trialFilters.location;
      if (locationFilter === 'remote') {
        params.remote = true;
      } else if (locationFilter === 'near') {
        params.remote = false;
        if (userProfile?.city) params.city = userProfile.city;
        if (userProfile?.country) params.country = userProfile.country;
      }

      const combinedQuery =
        typeof query === 'string' && query.trim().length > 0
          ? query.trim()
          : trialActiveQueryRef.current || buildTrialQuery('');
      if (combinedQuery) {
        params.search = combinedQuery;
      }

      console.log('Patient fetching trials with params:', params);
      const { trials } = await clinicalTrialService.fetchClinicalTrials(params);
      console.log('Patient received trials:', trials?.length, 'trials');
      console.log(
        'Trial sources:',
        trials?.map((t) => ({ title: t.title?.substring(0, 50), source: t.source }))
      );
      const locationLabel = [userProfile?.city, userProfile?.country].filter(Boolean).join(', ');
      const context = {
        condition: userProfile?.condition,
        searchTerm: combinedQuery,
        location: locationLabel,
      };
      const enrichedTrials = (trials || []).map((trial) => ({
        ...trial,
        matchScore: computeTrialMatchScore(trial, context),
      }));
      const sortedTrials = applyTrialLocationSort(enrichedTrials);

      const patientCity = (userProfile?.city || '').toLowerCase();
      const patientCountry = (userProfile?.country || '').toLowerCase();
      const isNearTrial = (trial) => {
        const locationText = [trial.location, trial.city, trial.country]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        const textMatch =
          (patientCity && locationText.includes(patientCity)) ||
          (patientCountry && locationText.includes(patientCountry));
        const distanceMatch = Number.isFinite(trial.distanceKm) && trial.distanceKm <= 200;
        return Boolean(textMatch || distanceMatch);
      };
      const isRemoteTrial = (trial) => {
        const remoteKeywords = ['remote', 'virtual', 'online', 'telehealth', 'hybrid'];
        const haystack = [trial.location, trial.summary, Array.isArray(trial.tags) ? trial.tags.join(' ') : '', trial.locationMatchLabel]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        const keywordMatch = remoteKeywords.some((keyword) => haystack.includes(keyword));
        return Boolean(trial.isRemote || keywordMatch);
      };

      let prioritizedTrials = sortedTrials;
      if (locationFilter === 'near') {
        prioritizedTrials = [...sortedTrials].sort(
          (a, b) => Number(isNearTrial(b)) - Number(isNearTrial(a))
        );
      } else if (locationFilter === 'remote') {
        prioritizedTrials = [...sortedTrials].sort(
          (a, b) => Number(isRemoteTrial(b)) - Number(isRemoteTrial(a))
        );
      }

      setClinicalTrials(prioritizedTrials);
      setTrialsUpdatedAt(Date.now());
    } catch (error) {
      console.error('Failed to load clinical trials:', error);
      setTrialsError('Unable to load clinical trials right now. Please try again.');
    } finally {
      setTrialsLoading(false);
    }
  },
  [userProfile, trialFilters.phase, trialFilters.location, buildTrialQuery, applyTrialLocationSort]
);

const handleTrialSearchSubmit = useCallback(
  (event) => {
    event?.preventDefault();
    const combined = buildTrialQuery(trialSearch);
    const finalQuery = combined || buildTrialQuery('');
    setTrialActiveQuery(finalQuery);
    setTrialInitialized(true);
    loadClinicalTrials({ query: finalQuery });
  },
  [buildTrialQuery, trialSearch, loadClinicalTrials]
);

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

const handleFollowToggle = async (expert) => {
  if (!expert || expert.source !== 'platform' || !expert.id) {
    setExpertsError('Following is only available for CuraLink researchers.');
    return;
  }

  const isFollowed = favoriteCollections.experts.includes(expert.id);
  setFollowProcessingIds((prev) => {
    const next = new Set(prev);
    next.add(expert.id);
    return next;
  });

  try {
    setExpertsError(null);
    if (isFollowed) {
      await api.delete(`/patients/favorites/experts/${expert.id}`);
      const nextFavorites = favoriteCollections.experts.filter((id) => id !== expert.id);
      updateFavoriteCollections('experts', nextFavorites);
      setFollowedExpertIds(nextFavorites);
      setSelectedExpertIds((prev) => {
        if (!prev.has(expert.id)) {
          return prev;
        }
        const next = new Set(prev);
        next.delete(expert.id);
        return next;
      });
    } else {
      await api.post(`/patients/favorites/experts/${expert.id}`);
      const nextFavorites = favoriteCollections.experts.includes(expert.id)
        ? favoriteCollections.experts
        : [...favoriteCollections.experts, expert.id];
      updateFavoriteCollections('experts', nextFavorites);
      setFollowedExpertIds(nextFavorites);
      setExpertCache((prev) => ({
        ...prev,
        [expert.id]: expert,
      }));
    }
  } catch (error) {
    console.error('Failed to toggle follow:', error);
    setExpertsError('Unable to update follow status right now. Please try again.');
  } finally {
    setFollowProcessingIds((prev) => {
      const next = new Set(prev);
      next.delete(expert.id);
      return next;
    });
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

  const openMeetingChat = (request) => {
    setChatMeetingRequest(request);
    setIsMeetingChatOpen(true);
  };

const closeMeetingChat = () => {
  setIsMeetingChatOpen(false);
  setChatMeetingRequest(null);
};

const handleUnifiedExpertView = (expert) => {
  openExpertProfile(expert);
  setIsUnifiedSearchOpen(false);
};

const handleUnifiedTrialView = (trial) => {
  setSelectedTrial(trial);
  setIsUnifiedSearchOpen(false);
};

const handleUnifiedDiscussionView = (question) => {
  openDiscussion(question);
  setIsUnifiedSearchOpen(false);
};

  const loadExperts = useCallback(
    async (queryOverride = '') => {
      if (!userProfile) return;
      setExpertsLoading(true);
      setExpertsError(null);
      try {
        const combinedQuery = queryOverride.trim()
          ? queryOverride.trim()
          : expertActiveQuery.trim()
          ? expertActiveQuery.trim()
          : buildExpertQuery('');

        const conditionFilter =
          userProfile.condition && userProfile.condition !== 'Not specified'
            ? userProfile.condition
            : undefined;

        const locationHint = [userProfile.city, userProfile.country].filter(Boolean).join(', ') || undefined;

        const { experts: fetchedExperts } = await expertService.fetchExperts({
          search: combinedQuery || conditionFilter,
          condition: conditionFilter,
          location: locationHint,
        });
        const sortedExperts = applyExpertLocationSort(fetchedExperts || []);
        setExperts(sortedExperts);
        setExpertsUpdatedAt(Date.now());
        setExpertCache((prev) => {
          if (!Array.isArray(sortedExperts)) return prev;
          const next = { ...prev };
          sortedExperts.forEach((expert) => {
            if (expert?.id) {
              next[expert.id] = expert;
            }
          });
          return next;
        });
      } catch (error) {
        console.error('Failed to load experts:', error);
        setExpertsError('Unable to load experts right now. Please try again.');
      } finally {
        setExpertsLoading(false);
      }
    },
    [userProfile, expertActiveQuery, buildExpertQuery, applyExpertLocationSort]
  );

  const handleExpertSearchSubmit = useCallback(
    (event) => {
      event?.preventDefault();
      const combined = buildExpertQuery(expertSearch);
      const finalQuery = combined || buildExpertQuery('');
      setExpertActiveQuery(finalQuery);
      loadExperts(finalQuery);
    },
    [buildExpertQuery, expertSearch, loadExperts]
  );
  useEffect(() => {
    trialActiveQueryRef.current = trialActiveQuery;
  }, [trialActiveQuery]);

const handleTrialFavoriteToggle = async (trial) => {
  if (!trial?.id) return;
  const trialId = trial.id;
  const isFavorite = favoriteCollections.trials.includes(trialId);

  try {
    setFavoritesError(null);
    if (isFavorite) {
      await clinicalTrialService.removeTrialFavorite(trialId);
      const next = favoriteCollections.trials.filter((id) => id !== trialId);
      updateFavoriteCollections('trials', next);
      setSelectedTrialIds((prev) => {
        if (!prev.has(trialId)) {
          return prev;
        }
        const nextSet = new Set(prev);
        nextSet.delete(trialId);
        return nextSet;
      });
      setFavoriteTrialsCache((prev) => {
        const nextCache = { ...prev };
        delete nextCache[trialId];
        return nextCache;
      });
    } else {
      await clinicalTrialService.saveTrialFavorite(trialId);
      const next = favoriteCollections.trials.includes(trialId)
        ? favoriteCollections.trials
        : [...favoriteCollections.trials, trialId];
      updateFavoriteCollections('trials', next);
      await ensureTrialInCache(trialId);
    }
  } catch (error) {
    console.error('Failed to update trial favorite:', error);
    setFavoritesError('Unable to update saved trials right now. Please try again.');
  }
};

const handlePublicationFavoriteToggle = async (publication) => {
  if (!publication?.pmid) return;
  const pmid = publication.pmid;
  const isFavorite = favoriteCollections.publications.includes(pmid);

  try {
    setFavoritesError(null);
    if (isFavorite) {
      await Promise.all([
        api.delete(`/patients/favorites/publications/${pmid}`),
        publicationService.unsavePublication(pmid),
      ]);
      const next = favoriteCollections.publications.filter((id) => id !== pmid);
      updateFavoriteCollections('publications', next);
      setFavoritePublications((prev) => prev.filter((pub) => pub.pmid !== pmid));
      setSelectedPublicationIds((prev) => {
        if (!prev.has(pmid)) {
          return prev;
        }
        const nextSet = new Set(prev);
        nextSet.delete(pmid);
        return nextSet;
      });
    } else {
      await Promise.all([
        api.post(`/patients/favorites/publications/${pmid}`),
        publicationService.savePublication(pmid),
      ]);
      const next = favoriteCollections.publications.includes(pmid)
        ? favoriteCollections.publications
        : [...favoriteCollections.publications, pmid];
      updateFavoriteCollections('publications', next);
    }
  } catch (error) {
    console.error('Failed to update publication favorite:', error);
    setFavoritesError('Unable to update saved publications right now. Please try again.');
  }
};

const toggleExpertSelection = useCallback((id) => {
  if (!id) return;
  setSelectedExpertIds((prev) => {
    const next = new Set(prev);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    return next;
  });
}, []);

const toggleTrialSelection = useCallback((id) => {
  if (!id) return;
  setSelectedTrialIds((prev) => {
    const next = new Set(prev);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    return next;
  });
}, []);

const togglePublicationSelection = useCallback((pmid) => {
  if (!pmid) return;
  setSelectedPublicationIds((prev) => {
    const next = new Set(prev);
    if (next.has(pmid)) {
      next.delete(pmid);
    } else {
      next.add(pmid);
    }
    return next;
  });
}, []);

const clearFavoriteSelections = useCallback(() => {
  setSelectedExpertIds(new Set());
  setSelectedTrialIds(new Set());
  setSelectedPublicationIds(new Set());
  setExportStatus(null);
}, []);

const buildFavoritesWorkbook = useCallback(() => {
  const expertIds = Array.from(selectedExpertIds);
  const trialIds = Array.from(selectedTrialIds);
  const publicationIds = Array.from(selectedPublicationIds);

  const expertRows = expertIds
    .map((id) => {
      const expert = expertCache[id] || experts.find((candidate) => candidate.id === id);
      if (!expert) return null;
      const specialties = Array.isArray(expert.specialties) ? expert.specialties.join(', ') : '';
      const location = expert.location || [expert.city, expert.country].filter(Boolean).join(', ');
      return {
        Name: expert.name || 'N/A',
        Institution: expert.institution || 'N/A',
        Specialties: specialties || 'N/A',
        'Research Focus': expert.researchInterests || 'N/A',
        Location: location || 'N/A',
        'Match Score': Number.isFinite(expert.matchScore) ? `${expert.matchScore}%` : '',
      };
    })
    .filter(Boolean);

  const trialRows = trialIds
    .map((id) => {
      const trial = favoriteTrialsCache[id] || clinicalTrials.find((item) => item.id === id);
      if (!trial) return null;
      const location = trial.location || [trial.city, trial.country].filter(Boolean).join(', ');
      return {
        Title: trial.title || 'N/A',
        Condition: trial.condition || 'N/A',
        Phase: trial.phase || 'N/A',
        Status: trial.status || 'N/A',
        Sponsor: trial.sponsor || 'N/A',
        Location: location || 'N/A',
        'Start Date': trial.startDate || trial.start_date || 'N/A',
        'Match Score': Number.isFinite(trial.matchScore) ? `${trial.matchScore}%` : '',
        Source: trial.source || 'CuraLink',
      };
    })
    .filter(Boolean);

  const publicationRows = publicationIds
    .map((pmid) => {
      const publication = favoritePublications.find((pub) => pub.pmid === pmid);
      if (!publication) return null;
      return {
        Title: publication.title || 'Untitled',
        Journal: publication.journal || 'N/A',
        Year: publication.year || 'N/A',
        PMID: publication.pmid || 'N/A',
      };
    })
    .filter(Boolean);

  if (expertRows.length === 0 && trialRows.length === 0 && publicationRows.length === 0) {
    return null;
  }

  const workbook = XLSX.utils.book_new();
  if (expertRows.length > 0) {
    const sheet = XLSX.utils.json_to_sheet(expertRows);
    XLSX.utils.book_append_sheet(workbook, sheet, 'Experts');
  }
  if (trialRows.length > 0) {
    const sheet = XLSX.utils.json_to_sheet(trialRows);
    XLSX.utils.book_append_sheet(workbook, sheet, 'Clinical Trials');
  }
  if (publicationRows.length > 0) {
    const sheet = XLSX.utils.json_to_sheet(publicationRows);
    XLSX.utils.book_append_sheet(workbook, sheet, 'Publications');
  }
  return workbook;
}, [
  selectedExpertIds,
  selectedTrialIds,
  selectedPublicationIds,
  expertCache,
  experts,
  favoriteTrialsCache,
  clinicalTrials,
  favoritePublications,
]);

const buildFavoritesExportSummary = useCallback(() => {
  const patientCondition = userProfile?.condition?.trim() || 'Not specified';
  const patientLocation =
    [userProfile?.city, userProfile?.country].filter(Boolean).join(', ') || 'Not provided';

  const selectedExpertsList = favoriteExpertsList.filter(
    (expert) => expert?.id && selectedExpertIds.has(expert.id)
  );
  const selectedTrialsList = favoriteTrialsList.filter(
    (trial) => trial?.id && selectedTrialIds.has(trial.id)
  );
  const selectedPublicationsList = favoritePublicationsList.filter(
    (publication) => publication?.pmid && selectedPublicationIds.has(publication.pmid)
  );

  if (
    selectedExpertsList.length === 0 &&
    selectedTrialsList.length === 0 &&
    selectedPublicationsList.length === 0
  ) {
    return '';
  }

  const lines = [
    'CuraLink Favorites Summary',
    '',
    `Patient condition: ${patientCondition}`,
    `Location: ${patientLocation}`,
  ];

  lines.push('');
  lines.push('Selected Health Experts:');
  if (selectedExpertsList.length === 0) {
    lines.push('- None selected.');
  } else {
    selectedExpertsList.forEach((expert) => {
      const specialties = Array.isArray(expert.specialties)
        ? expert.specialties.join(', ')
        : expert.specialties || expert.specialty || expert.researchInterests || '';
      const locationText =
        expert.location || [expert.institution, expert.city, expert.country].filter(Boolean).join(', ');
      const specialtyText = specialties ? ` – ${specialties}` : '';
      const locationSuffix = locationText ? ` (${locationText})` : '';
      lines.push(`- ${expert.name || 'Health expert'}${specialtyText}${locationSuffix}`);
      const researchFocus =
        expert.researchSummary ||
        expert.researchInterests ||
        expert.researchFocus ||
        expert.bio ||
        '';
      if (researchFocus) {
        lines.push(`  Research focus: ${researchFocus}`);
      }
    });
  }

  lines.push('');
  lines.push('Selected Clinical Trials:');
  if (selectedTrialsList.length === 0) {
    lines.push('- None selected.');
  } else {
    selectedTrialsList.forEach((trial) => {
      const condition = trial.condition || 'Condition not listed';
      const phase = trial.phase || 'Phase not specified';
      const status = trial.status || 'Status not specified';
      lines.push(
        `- ${trial.title || 'Clinical Trial'} (${condition}, ${phase}, ${status})`
      );
      const trialLocation =
        trial.location || [trial.city, trial.country].filter(Boolean).join(', ') || 'Multiple locations / TBD';
      lines.push(`  Location: ${trialLocation}`);
      const identifier = trial.nctId || trial.nct_id || trial.id || 'N/A';
      lines.push(`  Identifier: ${identifier}`);
      if (trial.isRemote) {
        lines.push('  Notes: Remote-friendly / virtual participation available.');
      }
      const notes =
        trial.aiSummary ||
        trial.summary ||
        trial.briefSummary ||
        trial.description ||
        trial.eligibility;
      if (notes) {
        lines.push(`  Notes: ${notes}`);
      }
    });
  }

  lines.push('');
  lines.push('Selected Publications:');
  if (selectedPublicationsList.length === 0) {
    lines.push('- None selected.');
  } else {
    selectedPublicationsList.forEach((publication) => {
      const journalLine = publication.journal || 'Journal not listed';
      const yearLine = publication.year || 'Year not listed';
      lines.push(`- "${publication.title || 'Untitled'}" – ${journalLine}, ${yearLine}`);
      const url =
        publication.url ||
        publication.link ||
        (publication.pmid ? `https://pubmed.ncbi.nlm.nih.gov/${publication.pmid}/` : '');
      if (url) {
        lines.push(`  Link: ${url}`);
      }
      if (publication.pmid) {
        lines.push(`  PMID: ${publication.pmid}`);
      }
    });
  }

  return lines.join('\n').trim();
}, [
  userProfile?.condition,
  userProfile?.city,
  userProfile?.country,
  favoriteExpertsList,
  favoriteTrialsList,
  favoritePublicationsList,
  selectedExpertIds,
  selectedTrialIds,
  selectedPublicationIds,
]);

const handleCopyExportSummary = useCallback(async () => {
  if (!exportSummaryText) return;
  try {
    if (typeof navigator !== 'undefined' && navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(exportSummaryText);
      setCopySummaryStatus('Summary copied to clipboard.');
    } else {
      throw new Error('Clipboard API not available');
    }
  } catch (error) {
    console.error('Failed to copy summary:', error);
    setCopySummaryStatus('Unable to copy automatically. Please copy the text manually.');
  }
}, [exportSummaryText]);

const closeExportModal = useCallback(() => {
  setIsExportModalOpen(false);
  setCopySummaryStatus(null);
  setExportSummaryText('');
}, []);

const handleExportFavorites = useCallback(() => {
  if (!hasFavoriteSelections) {
    setExportStatus('Select at least one favorite to export.');
    return;
  }
  const summary = buildFavoritesExportSummary();
  if (!summary) {
    setExportStatus('Select at least one favorite to export.');
    return;
  }
  setExportSummaryText(summary);
  setIsExportModalOpen(true);
  setCopySummaryStatus(null);

  const workbook = buildFavoritesWorkbook();
  if (!workbook) {
    return;
  }
  setIsExportingFavorites(true);
  setExportStatus(null);
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `curalink-favorites-${timestamp}.xlsx`;
    XLSX.writeFile(workbook, filename);
    setExportStatus('Downloaded favorites as an Excel file.');
  } catch (error) {
    console.error('Failed to export favorites:', error);
    setExportStatus('Unable to export favorites. Please try again.');
  } finally {
    setIsExportingFavorites(false);
  }
}, [
  hasFavoriteSelections,
  buildFavoritesExportSummary,
  buildFavoritesWorkbook,
]);

const ensureTrialInCache = useCallback(async (trialId) => {
  if (!trialId || favoriteTrialsCache[trialId]) return;
  const fromList = clinicalTrials.find((trial) => trial.id === trialId);
  if (fromList) {
    setFavoriteTrialsCache((prev) => ({
      ...prev,
      [trialId]: fromList,
    }));
    return;
  }

  if (pendingTrialFetches.current.has(trialId)) return;
  pendingTrialFetches.current.add(trialId);
  try {
    const trialResponse = await clinicalTrialService.fetchClinicalTrialById(trialId);
    const trialData = trialResponse?.trial || trialResponse;
    if (trialData) {
      setFavoriteTrialsCache((prev) => ({
        ...prev,
        [trialId]: trialData,
      }));
    }
  } catch (error) {
    console.warn('Unable to hydrate favorite trial', trialId, error);
  } finally {
    pendingTrialFetches.current.delete(trialId);
  }
}, [clinicalTrials, favoriteTrialsCache]);

  const loadFavoritePublications = useCallback(async () => {
    try {
      const savedResponse = await publicationService.getSavedPublications();
      const savedList = savedResponse?.publications || [];
      setFavoritePublications(savedList);
    const savedIds = savedList.map((pub) => pub.pmid);
    updateFavoriteCollections('publications', savedIds);
  } catch (error) {
    console.error('Failed to load saved publications:', error);
    setFavoritePublications([]);
  }
}, [updateFavoriteCollections]);

  const hydrateFollowedExperts = useCallback(async () => {
    const ids = favoriteCollections.experts.filter(Boolean);
    const missingIds = ids.filter((id) => !expertCache[id]);
    if (missingIds.length === 0) {
      return;
    }
    try {
      const { experts: fetched } = await expertService.fetchExperts({
        search: '',
        condition: '',
        location: '',
        limit: Math.max(50, ids.length * 2),
      });
      setExpertCache((prev) => {
        const next = { ...prev };
        (fetched || []).forEach((expert) => {
          if (expert?.id && ids.includes(expert.id)) {
            next[expert.id] = expert;
          }
        });
        return next;
      });
    } catch (error) {
      console.error('Failed to hydrate followed experts:', error);
    }
  }, [favoriteCollections.experts, expertCache]);
const openExpertProfile = (expert) => {
  setProfileModalExpert(expert);
};

const closeExpertProfile = () => {
  setProfileModalExpert(null);
};

const handleRequestMeeting = (expert) => {
  openMeetingModal(expert);
};

const _handleAiAssistNotes = async () => {
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

  const handleUseCurrentLocation = useCallback(() => {
    if (!userProfile) return;
    if (!navigator.geolocation) {
      setLocationUpdateMessage('Geolocation is not available in this browser.');
      setTimeout(() => setLocationUpdateMessage(null), 4000);
      return;
    }

    setLocationUpdating(true);
    setLocationUpdateMessage('Locating...');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          await api.put('/patients/profile', {
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
          loadExperts(expertActiveQuery || buildExpertQuery(expertSearch));
          loadClinicalTrials();
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
  }, [expertActiveQuery, buildExpertQuery, expertSearch, loadExperts, loadClinicalTrials, userProfile]);

useEffect(() => {
  if (!userProfile) return;
  const initialQuery = buildExpertQuery('');
  setExpertSearch(initialQuery);
  setExpertActiveQuery(initialQuery);
  loadExperts(initialQuery);
  loadMeetingRequests();
}, [userProfile, buildExpertQuery, loadExperts, loadMeetingRequests]);

useEffect(() => {
  if (!userProfile) return;
  const initialTrialQuery = buildTrialQuery('');
  setTrialSearch(initialTrialQuery);
  setTrialActiveQuery(initialTrialQuery);
  trialActiveQueryRef.current = initialTrialQuery;
  loadClinicalTrials({ query: initialTrialQuery });
  setTrialInitialized(true);
}, [userProfile, buildTrialQuery, loadClinicalTrials]);

useEffect(() => {
  if (!favoriteCollections.experts.length) return;
  hydrateFollowedExperts();
}, [favoriteCollections.experts, hydrateFollowedExperts]);

  useEffect(() => {
    if (!userProfile) return;
    const intervalId = setInterval(() => {
      loadExperts(expertActiveQuery || buildExpertQuery(expertSearch));
    }, EXPERTS_REFRESH_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [userProfile, loadExperts, expertActiveQuery, buildExpertQuery]);

  useEffect(() => {
    if (!userProfile || !trialInitialized) return;
    loadClinicalTrials();
  }, [userProfile, trialInitialized, trialFilters.phase, trialFilters.location, loadClinicalTrials]);

useEffect(() => {
  if (!Array.isArray(clinicalTrials) || clinicalTrials.length === 0) return;
  setFavoriteTrialsCache((prev) => {
    const next = { ...prev };
    clinicalTrials.forEach((trial) => {
      if (trial?.id) {
        next[trial.id] = trial;
      }
    });
    return next;
  });
}, [clinicalTrials]);

useEffect(() => {
  favoriteCollections.trials.forEach((trialId) => {
    ensureTrialInCache(trialId);
  });
}, [favoriteCollections.trials, ensureTrialInCache]);

useEffect(() => {
  if (!userProfile || !trialInitialized) return;
  const intervalId = setInterval(() => {
    loadClinicalTrials();
  }, TRIALS_REFRESH_INTERVAL_MS);
  return () => clearInterval(intervalId);
}, [userProfile, trialInitialized, loadClinicalTrials]);

useEffect(() => {
  if (activeTab !== 'favorites') return;
  let isMounted = true;
  const hydrateFavorites = async () => {
    setFavoritesLoading(true);
    setFavoritesError(null);
    try {
      await hydrateFollowedExperts();
      await loadFavoritePublications();
      await Promise.all(favoriteCollections.trials.map((id) => ensureTrialInCache(id)));
    } catch (error) {
      if (isMounted) {
        console.error('Favorites hydration failed:', error);
        setFavoritesError('Unable to load favorites right now. Please try again.');
      }
    } finally {
      if (isMounted) {
        setFavoritesLoading(false);
      }
    }
  };
  hydrateFavorites();
  return () => {
    isMounted = false;
  };
}, [activeTab, favoriteCollections.trials, loadFavoritePublications, ensureTrialInCache, hydrateFollowedExperts]);

useEffect(() => {
  setSelectedExpertIds((prev) => {
    if (prev.size === 0) {
      return prev;
    }
    const allowed = new Set(favoriteCollections.experts);
    const filtered = new Set([...prev].filter((id) => allowed.has(id)));
    return filtered.size === prev.size ? prev : filtered;
  });
  setSelectedTrialIds((prev) => {
    if (prev.size === 0) {
      return prev;
    }
    const allowed = new Set(favoriteCollections.trials);
    const filtered = new Set([...prev].filter((id) => allowed.has(id)));
    return filtered.size === prev.size ? prev : filtered;
  });
  setSelectedPublicationIds((prev) => {
    if (prev.size === 0) {
      return prev;
    }
    const allowed = new Set(favoriteCollections.publications);
    const filtered = new Set([...prev].filter((id) => allowed.has(id)));
    return filtered.size === prev.size ? prev : filtered;
  });
}, [favoriteCollections.experts, favoriteCollections.trials, favoriteCollections.publications]);

  const sidebarItems = useMemo(
    () => [
      { id: 'overview', label: 'Overview', icon: <Heart /> },
      { id: 'experts', label: 'Health Experts', icon: <Users /> },
      { id: 'trials', label: 'Clinical Trials', icon: <FileText /> },
      { id: 'publications', label: 'Publications', icon: <BookOpen /> },
      { id: 'forums', label: 'Forums', icon: <MessageCircle /> },
      { id: 'favorites', label: 'My Favorites', icon: <Star /> },
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
      navigate(`/patient/dashboard${query ? `?${query}` : ''}`, { replace: true });
    },
    [location.search, navigate, sidebarItems]
  );

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const requestedTab = params.get('tab');
    if (requestedTab && sidebarItems.some((item) => item.id === requestedTab)) {
      if (requestedTab !== activeTab) {
        setActiveTab(requestedTab);
      }
    } else if (!requestedTab && activeTab !== 'overview') {
      setActiveTab('overview');
    }
  }, [location.search, sidebarItems, activeTab]);

  const _mockPublications = [
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
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="card h-full flex flex-col">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Top expert matches</h3>
                    <p className="text-sm text-gray-500">
                      Tailored for {userProfile?.condition || 'your profile'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTabChange('experts')}
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
                  >
                    View all matches
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              {expertsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="h-16 rounded-2xl bg-gray-100 animate-pulse" />
                  ))}
                </div>
              ) : topMatchExperts.length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-6">
                  We’ll show personalized expert matches once you add your condition or follow a few experts.
                </div>
              ) : (
                  <div className="space-y-3">
                    {topMatchExperts.map((expert) => (
                      <div
                        key={expert.id || expert.name}
                        className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border border-gray-100 rounded-2xl px-4 py-3"
                      >
                        <div>
                          <p className="font-semibold text-gray-900">{expert.name || 'Expert pending'}</p>
                          <p className="text-sm text-gray-600">
                            {expert.institution || 'Institution not specified'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(expert.specialties || []).slice(0, 2).join(', ') ||
                              expert.researchInterests ||
                              'Specialty not listed'}
                          </p>
                        </div>
                        <div className="flex flex-col md:flex-row md:items-center gap-3">
                          <div className="flex flex-col items-start md:items-end gap-2">
                            <MatchScoreBadge score={expert.matchScore} />
                            {Number.isFinite(expert.distanceKm) ? (
                              <span className="text-xs text-gray-500">
                                {formatDistanceLabel(expert.distanceKm)}
                              </span>
                            ) : (
                              expert.locationMatchLabel && (
                                <span className="text-xs text-gray-500">{expert.locationMatchLabel}</span>
                              )
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setProfileModalExpert(expert);
                              setActiveTab('experts');
                            }}
                            className="inline-flex items-center justify-center rounded-full border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                          >
                            View Profile
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
              )}
              </div>

              <div className="card h-full flex flex-col">
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

                    <div key={request.id} className="border-b last:border-b-0 py-3 space-y-2">
                      <div className="flex items-center justify-between">
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
                          {request.status === 'pending_admin'
                            ? 'pending admin'
                            : request.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <button
                          onClick={() => openMeetingChat(request)}
                          className="text-primary-600 hover:text-primary-700 font-medium"
                        >
                          Open chat
                        </button>
                        {request.scheduled_at && (
                          <span className="text-gray-500">
                            Scheduled for{' '}
                            {new Date(request.scheduled_at).toLocaleString(undefined, {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>
                      {request.response_notes && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <p className="text-sm text-green-800">
                            <span className="font-medium">Notes:</span> {request.response_notes}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {meetingRequests.length > 5 && (
                <button
                  onClick={() => handleTabChange('experts')}
                  className="mt-4 text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  View all {meetingRequests.length} requests →
                </button>
              )}
            </div>
            </div>

            <div className="card">
              <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {meetingRequests.slice(0, 3).map((request) => (
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
              <div className="flex flex-col gap-2 md:items-end">
                <div className="text-xs text-gray-500 text-right">
                  {formatLastUpdatedLabel(expertsUpdatedAt)}
                </div>
                <form onSubmit={handleExpertSearchSubmit} className="relative w-full md:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={expertSearch}
                    onChange={(event) => setExpertSearch(event.target.value)}
                    placeholder="Search experts by name, specialty, or institution..."
                    className="pl-10 pr-24 py-2 border rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    type="submit"
                    className="absolute right-1 top-1/2 -translate-y-1/2 px-3 py-1 rounded-lg text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700"
                  >
                    Search
                  </button>
                </form>
              </div>
            </div>
            {!patientLocation.city &&
              !patientLocation.country &&
              !hasCoordinates(patientLocation.latitude, patientLocation.longitude) && (
                <div className="text-xs text-amber-600 flex flex-col sm:flex-row sm:items-center sm:gap-3">
                  <span>Add your city/country in your profile or</span>
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={locationUpdating}
                    className="inline-flex items-center text-primary-600 hover:text-primary-700 disabled:opacity-60"
                  >
                    {locationUpdating ? 'Detecting location...' : 'Use current location'}
                  </button>
                  {locationUpdateMessage && (
                    <span className="text-gray-500">{locationUpdateMessage}</span>
                  )}
                </div>
              )}

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
                  const isFollowProcessing = expert.id ? followProcessingIds.has(expert.id) : false;
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
                            <MatchScoreBadge score={expert.matchScore} />
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
                          {Number.isFinite(expert.distanceKm) ? (
                            <span className="inline-flex items-center rounded-full bg-primary-50 text-primary-700 text-xs font-medium px-3 py-1 mt-2">
                              {formatDistanceLabel(expert.distanceKm)}
                            </span>
                          ) : (
                            expert.locationMatchLabel && (
                              <span className="inline-flex items-center rounded-full bg-primary-50 text-primary-700 text-xs font-medium px-3 py-1 mt-2">
                                {expert.locationMatchLabel}
                              </span>
                            )
                          )}
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
                        onClick={() => openExpertProfile(expert)}
                        className="btn-secondary text-sm px-4 py-2"
                      >
                        View Profile
                      </button>
                      <button
                        onClick={() => handleFollowToggle(expert)}
                        disabled={expert.source !== 'platform' || isFollowProcessing}
                        className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                          isFollowed
                            ? 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                            : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                        } ${
                          expert.source !== 'platform' || isFollowProcessing
                            ? 'opacity-60 cursor-not-allowed'
                            : ''
                        }`}
                      >
                        {isFollowProcessing ? (
                          <span className="inline-flex items-center gap-2">
                            <Loader className="w-4 h-4 animate-spin" />
                            Updating...
                          </span>
                        ) : isFollowed ? (
                          'Following'
                        ) : (
                          'Follow'
                        )}
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
                  You haven't requested any meetings yet.
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
                      <div className="flex items-center justify-between text-xs mb-3">
                        <button
                          onClick={() => openMeetingChat(request)}
                          className="text-primary-600 hover:text-primary-700 font-medium"
                        >
                          Message researcher
                        </button>
                        {request.scheduled_at && (
                          <span className="text-gray-500">
                            Scheduled for{' '}
                            {new Date(request.scheduled_at).toLocaleString(undefined, {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
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
              <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                <div className="text-xs text-gray-500 text-right sm:mr-4">
                  {formatLastUpdatedLabel(trialsUpdatedAt)}
                </div>
                <form onSubmit={handleTrialSearchSubmit} className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={trialSearch}
                    onChange={handleTrialSearchChange}
                    placeholder="Search trials by title or condition..."
                    className="w-full rounded-lg border px-10 py-2 pr-24 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    type="submit"
                    className="absolute right-1 top-1/2 -translate-y-1/2 rounded-lg bg-primary-600 px-3 py-1 text-xs font-semibold text-white hover:bg-primary-700"
                  >
                    Search
                  </button>
                </form>
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
            {!patientLocation.city && !patientLocation.country && (
              <p className="text-xs text-amber-600">
                Provide your city or country to prioritize nearby trials automatically.
              </p>
            )}

            {trialFilters.location === 'near' &&
              !patientLocation.city &&
              !patientLocation.country &&
              !hasCoordinates(patientLocation.latitude, patientLocation.longitude) && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  Add your city/country in your profile or use the “Use current location” button
                  above to surface trials near you.
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
                  const isFavoriteTrial = favoriteCollections.trials.includes(trial.id);
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
                            {Number.isFinite(trial.matchScore) && (
                              <MatchScoreBadge score={trial.matchScore} />
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
                          {Number.isFinite(trial.distanceKm) ? (
                            <span className="inline-flex items-center rounded-full bg-primary-50 text-primary-700 text-xs font-medium px-3 py-1 mt-3">
                              {formatDistanceLabel(trial.distanceKm)}
                            </span>
                          ) : (
                            trial.locationMatchLabel && (
                              <span className="inline-flex items-center rounded-full bg-primary-50 text-primary-700 text-xs font-medium px-3 py-1 mt-3">
                                {trial.locationMatchLabel}
                              </span>
                            )
                          )}
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
                            {Number.isFinite(trial.distanceKm) ? (
                              <div className="text-xs text-primary-600 font-medium">
                                {formatDistanceLabel(trial.distanceKm)}
                              </div>
                            ) : (
                              trial.locationMatchLabel && (
                                <div className="text-xs text-primary-600 font-medium">
                                  {trial.locationMatchLabel}
                                </div>
                              )
                            )}
                            {trial.startDate && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Calendar className="mr-2 h-4 w-4 text-primary-500" />
                                Starts {formatDate(trial.startDate)}
                              </div>
                          )}
                          <button
                            onClick={() => handleTrialFavoriteToggle(trial)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"
                          >
                            {isFavoriteTrial ? (
                              <BookmarkCheck className="h-3.5 w-3.5" />
                            ) : (
                              <BookmarkPlus className="h-3.5 w-3.5" />
                            )}
                            {isFavoriteTrial ? 'Saved to favorites' : 'Save to favorites'}
                          </button>
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
        return (
          <div className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-bold">My Favorites</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Shortlist experts, trials, and publications to review with your care team.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <button
                  onClick={clearFavoriteSelections}
                  disabled={!hasFavoriteSelections}
                  className="btn-secondary text-sm disabled:opacity-50"
                >
                  Clear selection
                </button>
                <button
                  onClick={handleExportFavorites}
                  disabled={!hasFavoriteSelections || isExportingFavorites}
                  className="btn-primary inline-flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                >
                  <Share2 className="w-4 h-4" />
                  {isExportingFavorites ? 'Preparing...' : 'Export selected'}
                </button>
              </div>
            </div>

            {exportStatus && (
              <div className="flex items-center gap-2 rounded-xl border border-primary-100 bg-primary-50 px-4 py-3 text-sm text-primary-700">
                <ClipboardCheck className="w-4 h-4" />
                <span>{exportStatus}</span>
              </div>
            )}

            {favoritesError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {favoritesError}
              </div>
            )}

            {favoritesLoading ? (
              <div className="card py-12 text-center text-sm text-gray-600">
                Gathering your saved experts, trials, and publications...
              </div>
            ) : (
              <div className="space-y-10">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Followed Health Experts</h3>
                    <p className="text-xs text-gray-500">
                      {favoriteExpertsList.length} saved
                    </p>
                  </div>
                  {expertsLoading && favoriteExpertsList.length === 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {[1, 2, 3].map((item) => (
                        <div key={item} className="card h-32 animate-pulse bg-gray-100" />
                      ))}
                    </div>
                  ) : favoriteExpertsList.length === 0 ? (
                    <div className="card text-center py-12">
                      <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-600 mb-2">No favorite experts yet</p>
                      <p className="text-sm text-gray-500">
                        Visit the Health Experts tab to follow researchers.
                      </p>
                      <button
                        onClick={() => handleTabChange('experts')}
                        className="mt-4 btn-primary px-4 py-2 text-sm"
                      >
                        Browse Experts
                      </button>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {favoriteExpertsList.map((expert) => {
                        const isFavoriteFollowProcessing = followProcessingIds.has(expert.id);
                        return (
                          <div key={expert.id} className="card hover:shadow-lg transition-shadow">
                            <div className="flex items-start justify-between mb-3">
                              <div className="bg-primary-100 rounded-full p-3">
                                <Users className="w-6 h-6 text-primary-600" />
                              </div>
                              <div className="flex items-center gap-2">
                                <label className="inline-flex items-center gap-1 text-xs text-gray-500">
                                  <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                    checked={selectedExpertIds.has(expert.id)}
                                    onChange={() => toggleExpertSelection(expert.id)}
                                  />
                                  Select
                                </label>
                                <button
                                  onClick={() => handleFollowToggle(expert)}
                                  className={`text-yellow-500 hover:text-yellow-600 ${
                                    isFavoriteFollowProcessing ? 'opacity-60 cursor-wait' : ''
                                  }`}
                                  title="Unfollow"
                                  disabled={isFavoriteFollowProcessing}
                                >
                                  {isFavoriteFollowProcessing ? (
                                    <Loader className="w-4 h-4 animate-spin text-gray-400" />
                                  ) : (
                                    <Star className="w-5 h-5 fill-current" />
                                  )}
                                </button>
                              </div>
                            </div>
                          <h4 className="font-semibold text-gray-900 mb-1">{expert.name}</h4>
                          <p className="text-sm text-gray-600 mb-2">
                            {expert.institution || 'Institution not specified'}
                          </p>
                          <div className="flex items-center space-x-2 text-xs text-gray-500 mb-2">
                            <MapPin className="w-4 h-4" />
                            <span>{expert.location || expert.institution || 'Location not specified'}</span>
                          </div>
                          {Number.isFinite(expert.distanceKm) ? (
                            <span className="inline-flex items-center rounded-full bg-primary-50 text-primary-700 text-xs font-medium px-3 py-1 mb-2">
                              {formatDistanceLabel(expert.distanceKm)}
                            </span>
                          ) : (
                            expert.locationMatchLabel && (
                              <span className="inline-flex items-center rounded-full bg-primary-50 text-primary-700 text-xs font-medium px-3 py-1 mb-2">
                                {expert.locationMatchLabel}
                              </span>
                            )
                          )}
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
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Saved Clinical Trials</h3>
                    <p className="text-xs text-gray-500">
                      {favoriteTrialsList.length} saved
                    </p>
                  </div>
                  {favoriteTrialsList.length === 0 ? (
                    <div className="card text-center py-10">
                      <p className="text-sm text-gray-600">
                        You haven't saved any trials yet. Browse the Clinical Trials tab to shortlist studies.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {favoriteTrialsList.map((trial) => (
                        <div key={trial.id} className="card p-5">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                {trial.status && (
                                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                                    {trial.status}
                                  </span>
                                )}
                                {trial.phase && (
                                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                                    {trial.phase}
                                  </span>
                                )}
                              </div>
                              <h4 className="text-lg font-semibold text-gray-900">{trial.title}</h4>
                              <p className="text-sm text-gray-600 mt-1">
                                {trial.condition || 'Condition not specified'}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {trial.location ||
                                  [trial.city, trial.country].filter(Boolean).join(', ') ||
                                  'Location not specified'}
                              </p>
                              {Number.isFinite(trial.distanceKm) ? (
                                <p className="text-xs text-primary-600 mt-1">
                                  {formatDistanceLabel(trial.distanceKm)}
                                </p>
                              ) : (
                                trial.locationMatchLabel && (
                                  <p className="text-xs text-primary-600 mt-1">
                                    {trial.locationMatchLabel}
                                  </p>
                                )
                              )}
                            </div>
                            <div className="flex flex-col items-start gap-2 sm:items-end">
                              <label className="inline-flex items-center gap-1 text-xs text-gray-500">
                                <input
                                  type="checkbox"
                                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                  checked={selectedTrialIds.has(trial.id)}
                                  onChange={() => toggleTrialSelection(trial.id)}
                                />
                                Select
                              </label>
                              <button
                                onClick={() => handleTrialFavoriteToggle(trial)}
                                className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"
                              >
                                <BookmarkCheck className="h-3.5 w-3.5" />
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Saved Publications</h3>
                    <p className="text-xs text-gray-500">
                      {favoritePublicationsList.length} saved
                    </p>
                  </div>
                  {favoritePublicationsList.length === 0 ? (
                    <div className="card text-center py-10">
                      <p className="text-sm text-gray-600">
                        Saved papers will appear here after you bookmark them from the Publications page.
                      </p>
                      <button
                        onClick={() => navigate('/publications')}
                        className="mt-4 btn-secondary text-sm px-4 py-2"
                      >
                        Search Publications
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {favoritePublicationsList.map((publication) => (
                        <div key={publication.pmid} className="card p-5">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex-1">
                              <p className="text-xs text-gray-500 mb-1">
                                PMID: {publication.pmid}
                              </p>
                              <h4 className="text-lg font-semibold text-gray-900">
                                {publication.title}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {publication.journal} • {publication.year || 'Year N/A'}
                              </p>
                              {publication.aiSummary && (
                                <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                                  {publication.aiSummary}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col items-start gap-2 sm:items-end">
                              <label className="inline-flex items-center gap-1 text-xs text-gray-500">
                                <input
                                  type="checkbox"
                                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                  checked={selectedPublicationIds.has(publication.pmid)}
                                  onChange={() => togglePublicationSelection(publication.pmid)}
                                />
                                Select
                              </label>
                              <button
                                onClick={() => handlePublicationFavoriteToggle(publication)}
                                className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"
                              >
                                <BookmarkCheck className="h-3.5 w-3.5" />
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
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
                onClick={() => handleTabChange(item.id)}
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
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
            <div>
              <p className="text-sm text-gray-500">Unified intelligence</p>
              <h1 className="text-2xl font-semibold text-gray-900">
                Welcome back, {userProfile?.name?.split?.(' ')[0] || 'Patient'}
              </h1>
              <p className="text-sm text-gray-500">
                Run a single search to see ranked researchers, trials, and discussions.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsUnifiedSearchOpen(true)}
                className="btn-primary inline-flex items-center gap-2 px-5 py-2 rounded-full"
              >
                <Sparkles className="w-4 h-4" />
                Unified Search
              </button>
            </div>
          </div>
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

      {profileModalExpert && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl rounded-3xl bg-white p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={closeExpertProfile}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
              aria-label="Close expert profile"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Researcher</p>
                  <h3 className="text-3xl font-semibold text-gray-900">{profileModalExpert.name}</h3>
                  <p className="text-sm text-gray-600 mt-2">{profileModalExpert.institution}</p>
                  <p className="text-xs text-gray-500">{profileModalExpert.location}</p>
                </div>
                <div className="flex flex-col items-start md:items-end gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                      profileModalExpert.availableForMeetings
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {profileModalExpert.availableForMeetings
                      ? 'Available for Meetings'
                      : 'Meeting by Referral'}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        openMeetingModal(profileModalExpert);
                        closeExpertProfile();
                      }}
                      className="btn-primary px-4 py-2 text-sm font-semibold"
                    >
                      Request Meeting
                    </button>
                    <button
                      onClick={closeExpertProfile}
                      className="btn-secondary px-4 py-2 text-sm font-semibold"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>

              {Array.isArray(profileModalExpert.specialties) && profileModalExpert.specialties.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Specialties</h4>
                  <div className="flex flex-wrap gap-2">
                    {profileModalExpert.specialties.map((spec) => (
                      <span
                        key={`${profileModalExpert.id}-${spec}`}
                        className="rounded-full bg-primary-50 text-primary-700 text-xs font-medium px-3 py-1"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profileModalExpert.researchInterests && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Research Focus</h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {profileModalExpert.researchInterests}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-2xl border p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Publications</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {profileModalExpert.publicationsCount || profileModalExpert.publications?.length || 0}
                  </p>
                  <p className="text-xs text-gray-500">reported on profile</p>
                </div>
                <div className="rounded-2xl border p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Email</p>
                  <p className="text-sm font-medium text-gray-900">
                    {profileModalExpert.email || 'Not shared'}
                  </p>
                </div>
                <div className="rounded-2xl border p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Source</p>
                  <p className="text-sm font-medium text-gray-900 capitalize">
                    {profileModalExpert.source || 'Platform'}
                  </p>
                </div>
              </div>

              {Array.isArray(profileModalExpert.publications) &&
                profileModalExpert.publications.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">
                      Highlighted Publications
                    </h4>
                    <div className="space-y-3">
                      {profileModalExpert.publications.slice(0, 3).map((pub, index) => {
                        const title = typeof pub === 'string' ? pub : pub.title;
                        const journal = pub.journal || pub.source || '';
                        const year = pub.year || '';
                        const link = pub.link || pub.url;
                        return (
                          <div key={`${profileModalExpert.id}-pub-${index}`} className="border rounded-2xl p-4">
                            <p className="text-sm font-semibold text-gray-900">{title || 'Untitled publication'}</p>
                            <p className="text-xs text-gray-500">
                              {[journal, year].filter(Boolean).join(' • ')}
                            </p>
                            {link && (
                              <a
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 mt-2"
                              >
                                View Source
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
            </div>
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

      {isExportModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeExportModal} />
          <div className="relative z-50 w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Share favorites summary</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Copy this text to send your curated experts, trials, and publications to your care team.
                </p>
              </div>
              <button
                onClick={closeExportModal}
                className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
                aria-label="Close summary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4">
              <textarea
                className="w-full h-64 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-800 focus:outline-none"
                readOnly
                value={exportSummaryText}
              />
              {copySummaryStatus && (
                <p className="mt-2 text-sm text-primary-600">{copySummaryStatus}</p>
              )}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                onClick={handleCopyExportSummary}
                className="btn-primary w-full sm:w-auto"
              >
                Copy summary
              </button>
              <button
                onClick={closeExportModal}
                className="btn-secondary w-full sm:w-auto"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <UnifiedSearchModal
        isOpen={isUnifiedSearchOpen}
        context={unifiedSearchContext}
        onClose={() => setIsUnifiedSearchOpen(false)}
        onViewExpert={handleUnifiedExpertView}
        onViewTrial={handleUnifiedTrialView}
        onViewDiscussion={handleUnifiedDiscussionView}
      />
    <ChatWidget role="patient" />
    <MeetingChatModal
      isOpen={isMeetingChatOpen}
      meeting={chatMeetingRequest}
      role="patient"
      onClose={closeMeetingChat}
    />
  </>
);
};

export default PatientDashboard;
