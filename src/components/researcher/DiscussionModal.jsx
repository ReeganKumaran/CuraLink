import React from 'react';
import { X } from 'lucide-react';

const DiscussionModal = ({
  question,
  isOpen,
  onClose,
  formatDate,
  onReply,
}) => {
  if (!isOpen || !question) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full p-8 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
          aria-label="Close discussion"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="space-y-6">
          <div>
            <span className="inline-flex items-center rounded-full bg-primary-100 text-primary-700 text-xs font-medium px-3 py-1 mb-3">
              {question.category}
            </span>
            <h3 className="text-2xl font-semibold text-gray-900">{question.title}</h3>
            <div className="flex items-center flex-wrap gap-2 text-sm text-gray-600 mt-2">
              <span>
                Asked by{' '}
                {question.authorRole === 'patient' ? 'Patient' : question.authorName || 'Member'}
              </span>
              <span className="text-gray-300" aria-hidden="true">
                &bull;
              </span>
              <span>{formatDate(question.createdAt)}</span>
            </div>
          </div>

          <p className="text-gray-700 leading-relaxed">{question.question}</p>

          <div className="border-t pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-gray-900">
                {question.replies.length > 0
                  ? `${question.replies.length} Responses`
                  : 'No responses yet'}
              </h4>
              <button onClick={onReply} className="btn-primary text-sm px-4 py-2">
                Reply
              </button>
            </div>
            <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
              {question.replies.map((reply) => (
                <div key={reply.id} className="border rounded-2xl p-4 bg-gray-50">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>
                      {reply.authorName}{' '}
                      <span className="text-gray-300" aria-hidden="true">
                        &bull;
                      </span>{' '}
                      {reply.authorRole === 'researcher' ? 'Researcher' : 'Member'}
                    </span>
                    <span>{formatDate(reply.createdAt)}</span>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed">{reply.message}</p>
                </div>
              ))}

              {question.replies.length === 0 && (
                <p className="text-sm text-gray-500">
                  Ready to respond when you are. Patients will be notified once your reply is posted.
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 border border-gray-200 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscussionModal;

