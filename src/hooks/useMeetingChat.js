import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../services/api';

const POLL_INTERVAL_MS = 5000;

const BASE_PATH_BY_ROLE = {
  researcher: '/researchers/meeting-requests',
  patient: '/patients/meeting-requests',
};

const initialState = {
  messages: [],
  loading: false,
  error: null,
};

export default function useMeetingChat(meetingId, role = 'patient', enabled = false) {
  const [messages, setMessages] = useState(initialState.messages);
  const [loading, setLoading] = useState(initialState.loading);
  const [error, setError] = useState(initialState.error);
  const intervalRef = useRef(null);
  const basePath = BASE_PATH_BY_ROLE[role] || BASE_PATH_BY_ROLE.patient;

  const fetchMessages = useCallback(async () => {
    if (!meetingId) return;
    try {
      const response = await api.get(`${basePath}/${meetingId}/messages`);
      setMessages(response.data.data.messages || []);
      setError(null);
    } catch (err) {
      console.error('Meeting chat fetch failed:', err);
      setError(err?.response?.data?.message || 'Unable to load chat messages.');
    } finally {
      setLoading(false);
    }
  }, [basePath, meetingId]);

  useEffect(() => {
    if (!meetingId || !enabled) {
      setMessages([]);
      setLoading(false);
      return () => {};
    }

    setLoading(true);
    fetchMessages();

    intervalRef.current = setInterval(fetchMessages, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [meetingId, enabled, fetchMessages]);

  const sendMessage = useCallback(
    async (message) => {
      if (!meetingId || !message?.trim()) return null;
      try {
        const response = await api.post(`${basePath}/${meetingId}/messages`, { message });
        const newMessage = response.data.data.message;
        setMessages((prev) => [...prev, newMessage]);
        return newMessage;
      } catch (err) {
        console.error('Meeting chat send failed:', err);
        setError(err?.response?.data?.message || 'Unable to send message.');
        throw err;
      }
    },
    [basePath, meetingId]
  );

  return {
    messages,
    loading,
    error,
    sendMessage,
    refresh: fetchMessages,
  };
}
