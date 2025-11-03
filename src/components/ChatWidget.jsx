import React, { useState, useCallback, useEffect, useRef } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import chatService from '../services/chatService';

const INITIAL_MESSAGE =
  'Hi! I’m the CuraLink assistant. Ask me about clinical trials, meeting an expert, or next steps for support.';

const ChatWidget = ({ role = 'patient' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: INITIAL_MESSAGE },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const toggleOpen = () => {
    setIsOpen((prev) => !prev);
  };

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, scrollToBottom]);

  const sendMessage = async (event) => {
    event.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed || isSending) return;

    const nextMessages = [...messages, { role: 'user', content: trimmed }];
    setMessages(nextMessages);
    setInputValue('');
    setIsSending(true);
    setError(null);

    try {
      const result = await chatService.chatWithAssistant({
        role,
        messages: nextMessages,
      });
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: result.reply },
      ]);
    } catch (err) {
      console.error('Chat assistant error:', err);
      setError(
        err?.response?.data?.message ||
          'The assistant is unavailable right now. Please try again shortly.'
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen && (
        <button
          onClick={toggleOpen}
          className="flex items-center gap-2 rounded-full bg-primary-600 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-primary-700 transition"
        >
          <MessageCircle className="w-5 h-5" />
          Chat with CuraLink
        </button>
      )}

      {isOpen && (
        <div className="w-80 sm:w-96 rounded-3xl bg-white shadow-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-primary-600 text-white">
            <div>
              <p className="text-sm font-semibold">CuraLink Assistant</p>
              <p className="text-xs opacity-80">
                Ask questions or get quick guidance.
              </p>
            </div>
            <button
              onClick={toggleOpen}
              className="p-1 rounded-full bg-white/10 hover:bg-white/20 transition"
              aria-label="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto px-4 py-3 space-y-3 text-sm">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`px-3 py-2 rounded-2xl max-w-[90%] whitespace-pre-wrap ${
                    message.role === 'user'
                      ? 'bg-primary-100 text-primary-800'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {error && (
            <div className="px-4 pb-2 text-xs text-red-500">{error}</div>
          )}

          <form onSubmit={sendMessage} className="flex items-center gap-2 px-4 py-3 border-t bg-gray-50">
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              placeholder="Type your question..."
              className="flex-1 rounded-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={isSending}
            />
            <button
              type="submit"
              className="flex items-center justify-center rounded-full bg-primary-600 text-white p-2 hover:bg-primary-700 transition disabled:opacity-50"
              disabled={isSending || !inputValue.trim()}
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
