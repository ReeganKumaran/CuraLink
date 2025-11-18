import { useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import authService from '../services/authService';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:8080';

export function useCollaboratorNotifications() {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const token = authService.getToken();
    if (!token) {
      console.warn('⚠️ No auth token found, cannot connect to notifications');
      return;
    }

    console.log('🔌 Attempting to connect to Socket.IO at:', SOCKET_URL);
    const socketInstance = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socketInstance.on('connect', () => {
      console.log('✅ Collaborator notifications: Connected to WebSocket');
      console.log('🆔 Socket ID:', socketInstance.id);
      setConnected(true);
      setError(null);
    });

    socketInstance.on('disconnect', () => {
      console.log('Collaborator notifications: Disconnected from WebSocket');
      setConnected(false);
    });

    socketInstance.on('connect_error', (err) => {
      console.error('Collaborator notifications: Connection error:', err.message);
      setError(err.message);
      setConnected(false);
    });

    // Listen for new collaborator messages
    socketInstance.on('collaborator:newMessage', (message) => {
      console.log('🔔 Received collaborator message notification:', message);
      setNotifications(prev => {
        const newNotification = {
          id: message.id || Date.now().toString(),
          type: 'collaborator_message',
          senderId: message.senderId,
          senderName: message.senderName,
          message: message.message,
          createdAt: message.createdAt || new Date().toISOString(),
          read: false
        };
        console.log('📢 Adding notification to state:', newNotification);
        console.log('📊 Current notifications count:', prev.length + 1);
        return [...prev, newNotification];
      });
    });

    // Debug: Log all socket events
    socketInstance.onAny((eventName, ...args) => {
      console.log(`Socket event: ${eventName}`, args);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const markAsRead = useCallback((notificationId) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  }, []);

  const clearNotification = useCallback((notificationId) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    socket,
    connected,
    error,
    notifications,
    unreadCount: notifications.filter(n => !n.read).length,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAll
  };
}
