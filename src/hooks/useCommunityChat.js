import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import api, { API_BASE_URL } from '../services/api';
import authService from '../services/authService';

const SOCKET_URL = API_BASE_URL.split('/api/')[0];

export function useCommunityChat() {
  const [communities, setCommunities] = useState([]);
  const [communitiesLoading, setCommunitiesLoading] = useState(true);
  const [communitiesError, setCommunitiesError] = useState(null);
  const [activeCommunityId, setActiveCommunityId] = useState(null);
  const [messagesByCommunity, setMessagesByCommunity] = useState({});
  const [socketConnected, setSocketConnected] = useState(false);
  const [socketError, setSocketError] = useState(null);
  const socketRef = useRef(null);

  const fetchCommunities = useCallback(async () => {
    setCommunitiesLoading(true);
    setCommunitiesError(null);
    try {
      const response = await api.get('/communities');
      setCommunities(response.data.data.communities || []);
    } catch (error) {
      console.error('Failed to load communities:', error);
      setCommunitiesError(error);
    } finally {
      setCommunitiesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCommunities();
  }, [fetchCommunities]);

  useEffect(() => {
    const token = authService.getToken();
    if (!token) {
      return undefined;
    }

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => setSocketConnected(true));
    socket.on('disconnect', () => setSocketConnected(false));

    socket.on('community:initialMessages', ({ communityId, messages }) => {
      setMessagesByCommunity((prev) => ({
        ...prev,
        [communityId]: messages || [],
      }));
    });

    socket.on('community:newMessage', (payload) => {
      setMessagesByCommunity((prev) => {
        const existing = prev[payload.communityId] || [];
        return {
          ...prev,
          [payload.communityId]: [...existing, payload],
        };
      });
    });

    socket.on('community:error', (payload) => {
      console.warn('Community socket error:', payload);
      setSocketError(payload?.message || 'Community chat error occurred.');
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, []);

  const createCommunity = useCallback(async ({ name, description }) => {
    const response = await api.post('/communities', {
      name,
      description,
    });
    const created = response.data.data.community;
    setCommunities((prev) => [created, ...prev]);
    return created;
  }, []);

  const openCommunityChat = useCallback(async (communityId) => {
    if (!communityId) return;

    try {
      await api.post(`/communities/${communityId}/join`);

      setCommunities((prev) =>
        prev.map((community) =>
          community.id === communityId ? { ...community, isMember: true } : community
        )
      );

      setMessagesByCommunity((prev) =>
        prev[communityId] ? prev : { ...prev, [communityId]: [] }
      );

      setSocketError(null);
      setActiveCommunityId(communityId);

      if (socketRef.current) {
        socketRef.current.emit('joinCommunity', { communityId });
      }
    } catch (error) {
      console.error('Failed to join community chat:', error);
      setActiveCommunityId(null);
      setSocketError(error?.response?.data?.message || error.message || 'Unable to join community chat.');
      throw error;
    }
  }, []);

  const closeCommunityChat = useCallback(() => {
    if (!activeCommunityId) return;
    if (socketRef.current) {
      socketRef.current.emit('leaveCommunity', { communityId: activeCommunityId });
    }
    setActiveCommunityId(null);
    setSocketError(null);
  }, [activeCommunityId]);

  const sendMessage = useCallback(
    (communityId, message) => {
      if (!communityId || !message?.trim()) return;
      if (!socketRef.current) return;
      socketRef.current.emit('sendMessage', {
        communityId,
        message,
      });
    },
    []
  );

  const activeCommunity = useMemo(
    () => communities.find((community) => community.id === activeCommunityId) || null,
    [communities, activeCommunityId]
  );

  const activeMessages = useMemo(
    () => messagesByCommunity[activeCommunityId] || [],
    [messagesByCommunity, activeCommunityId]
  );

  return {
    communities,
    communitiesLoading,
    communitiesError,
    createCommunity,
    refreshCommunities: fetchCommunities,
    openCommunityChat,
    closeCommunityChat,
    sendMessage,
    activeCommunityId,
    activeCommunity,
    activeMessages,
    socketConnected,
    socketError,
    isChatOpen: Boolean(activeCommunityId),
  };
}

export default useCommunityChat;
