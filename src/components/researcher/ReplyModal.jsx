import React from 'react';
import { X } from 'lucide-react';

const ReplyModal = ({
  isOpen,
  question,
  replyForm,
  onChangeReply,
  onClose,
  onSubmit,
  onAiAssist,
  aiProcessing,
  aiError,
}) => {
  if (!isOpen || !question) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-8 relative">
        <button
          onClick={onClose}
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
            <p className="text-sm font-medium text-gray-900">{question.title}</p>
            <p className="text-xs text-gray-500 mt-1">{question.question}</p>
          </div>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Your Response</label>
                <button
                  type="button"
                  onClick={onAiAssist}
                  disabled={aiProcessing}
                  className="text-sm font-medium text-primary-600 hover:text-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {aiProcessing ? 'Generating...' : 'AI Assist'}
                </button>
              </div>
              <textarea
                value={replyForm.message}
                onChange={(event) => onChangeReply(event.target.value)}
                rows={6}
                placeholder="Compose a detailed answer with actionable next steps..."
                className="w-full border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                required
              />
              {aiError && <p className="text-sm text-red-500">{aiError}</p>}
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
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
  );
};

export default ReplyModal;

