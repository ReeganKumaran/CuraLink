import React from 'react';
import { X } from 'lucide-react';

const CommunityModal = ({
  isOpen,
  communityForm,
  onChange,
  onClose,
  onSubmit,
  submitting,
  error,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-8 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
          aria-label="Close community modal"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-semibold text-gray-900">Create a Research Community</h3>
            <p className="text-sm text-gray-500">
              Bring together experts and patients around a focused topic.
            </p>
          </div>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Community Name</label>
              <input
                type="text"
                value={communityForm.name}
                onChange={(event) => onChange('name', event.target.value)}
                placeholder="Example: Glioblastoma Insights"
                className="w-full border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={communityForm.description}
                onChange={(event) => onChange('description', event.target.value)}
                rows={5}
                placeholder="Outline the community purpose, audience, and plans..."
                className="w-full border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                required
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 border border-gray-200 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary px-6 py-2 rounded-full text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={submitting}
              >
                {submitting ? 'Creating...' : 'Create Community'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CommunityModal;

