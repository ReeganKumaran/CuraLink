import React from 'react';
import { X } from 'lucide-react';

const CommunityChatModal = ({
  isOpen,
  community,
  messages,
  socketConnected,
  socketError,
  chatError,
  formatDateTime,
  chatMessage,
  onChangeMessage,
  onClose,
  onSendMessage,
  messagesEndRef,
}) => {
  if (!isOpen || !community) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-3xl rounded-3xl bg-white p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
          aria-label="Close community chat"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h3 className="text-2xl font-semibold text-gray-900">{community.name}</h3>
              {community.description ? (
                <p className="text-sm text-gray-600 mt-2">{community.description}</p>
              ) : (
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
            {messages.length === 0 ? (
              <p className="text-sm text-gray-500">No messages yet. Be the first to share.</p>
            ) : (
              messages.map((message) => (
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

          <form onSubmit={onSendMessage} className="space-y-3">
            {chatError && <p className="text-sm text-red-500">{chatError}</p>}
            {socketError && <p className="text-sm text-red-500">{socketError}</p>}
            <textarea
              value={chatMessage}
              onChange={(event) => onChangeMessage(event.target.value)}
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
                onClick={onClose}
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
  );
};

export default CommunityChatModal;

