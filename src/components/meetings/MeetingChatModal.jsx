import React, { useMemo, useState } from 'react';
import { X, Loader, MessageCircle } from 'lucide-react';
import useMeetingChat from '../../hooks/useMeetingChat';

const roleLabels = {
  patient: 'You',
  researcher: 'You',
};

const MeetingChatModal = ({ meeting, role = 'patient', isOpen, onClose }) => {
  const meetingId = meeting?.id;
  const [messageInput, setMessageInput] = useState('');
  const { messages, loading, error, sendMessage } = useMeetingChat(meetingId, role, isOpen);

  const otherParticipant = useMemo(() => {
    if (!meeting) return '';
    if (role === 'researcher') {
      return meeting.patient_name || 'Patient';
    }
    return meeting.researcher_name || 'Researcher';
  }, [meeting, role]);

  if (!isOpen) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!messageInput.trim()) return;
    try {
      await sendMessage(messageInput.trim());
      setMessageInput('');
    } catch (_) {
      // error already handled in hook
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh]">
        <div className="flex items-start justify-between p-6 border-b">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Meeting chat</p>
            <h3 className="text-2xl font-semibold text-gray-900">
              {otherParticipant && role !== 'patient'
                ? `Chat with ${otherParticipant}`
                : otherParticipant
                ? `Chat with ${otherParticipant}`
                : 'Meeting conversation'}
            </h3>
            {meeting?.status && (
              <p className="text-sm text-gray-500">
                Status:{' '}
                <span className="text-gray-900 font-medium">
                  {meeting.status.replace(/_/g, ' ')}
                </span>
              </p>
            )}
            {meeting?.scheduled_at && (
              <p className="text-sm text-primary-700">
                Scheduled for {new Date(meeting.scheduled_at).toLocaleString()}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading && messages.length === 0 && (
            <div className="flex items-center justify-center text-sm text-gray-500">
              <Loader className="w-4 h-4 animate-spin mr-2" />
              Loading messages...
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {messages.length === 0 && !loading ? (
            <div className="text-center text-sm text-gray-500 py-10">
              <MessageCircle className="w-10 h-10 mx-auto text-gray-300 mb-3" />
              No messages yet. Start the conversation to coordinate details.
            </div>
          ) : (
            messages.map((msg) => {
              const isSelf = (msg.senderRole || msg.sender_role) === role;
              const createdAt = msg.createdAt || msg.created_at;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                      isSelf
                        ? 'bg-primary-600 text-white rounded-br-sm'
                        : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.message}</p>
                    <p
                      className={`text-xs mt-1 ${
                        isSelf ? 'text-primary-100' : 'text-gray-500'
                      }`}
                    >
                      {isSelf ? roleLabels[role] || 'You' : otherParticipant || 'Participant'} •{' '}
                      {new Date(createdAt).toLocaleTimeString([], {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <form onSubmit={handleSubmit} className="border-t p-4 flex items-center gap-3">
          <input
            type="text"
            value={messageInput}
            onChange={(event) => setMessageInput(event.target.value)}
            placeholder="Type a message..."
            className="flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button
            type="submit"
            className="btn-primary text-sm px-6 py-2 rounded-full disabled:opacity-50"
            disabled={!messageInput.trim()}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default MeetingChatModal;
