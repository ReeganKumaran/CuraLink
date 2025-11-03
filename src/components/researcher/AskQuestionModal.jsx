import React from 'react';
import { X } from 'lucide-react';

const AskQuestionModal = ({
  isOpen,
  categories,
  askForm,
  onChange,
  onClose,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
          aria-label="Close ask question modal"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-semibold text-gray-900">Ask the Community</h3>
            <p className="text-sm text-gray-500">
              Share clinical insights or invite patients to contribute.
            </p>
          </div>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Category</label>
              <select
                value={askForm.category}
                onChange={onChange('category')}
                className="w-full border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {categories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                value={askForm.title}
                onChange={onChange('title')}
                placeholder="What would you like to ask?"
                className="w-full border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Question</label>
              <textarea
                value={askForm.question}
                onChange={onChange('question')}
                placeholder="Provide context, goals, or supporting details..."
                rows={6}
                className="w-full border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                required
              />
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
                Post Question
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AskQuestionModal;

