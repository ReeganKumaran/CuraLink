import React from 'react';
import { X } from 'lucide-react';

const TrialModal = ({
  isOpen,
  trialForm,
  onChange,
  trialPhases,
  trialStatuses,
  onSubmit,
  onClose,
  trialSubmitError,
  trialSubmitting,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-black/40 backdrop-blur-sm">
      <div className="flex min-h-full items-center justify-center px-4 py-10">
        <div className="relative w-full max-w-3xl rounded-3xl bg-white p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            aria-label="Close trial modal"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="space-y-6">
            <div>
              <h3 className="text-2xl font-semibold text-gray-900">Create Clinical Trial</h3>
              <p className="text-sm text-gray-500">
                Share key details so patients and collaborators can discover this study.
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Title</label>
                  <input
                    type="text"
                    value={trialForm.title}
                    onChange={onChange('title')}
                    placeholder="e.g., Phase II Trial for Novel Cancer Treatment"
                    className="w-full border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Therapeutic Area</label>
                  <input
                    type="text"
                    value={trialForm.condition}
                    onChange={onChange('condition')}
                    placeholder="Condition or disease focus"
                    className="w-full border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Phase</label>
                  <select
                    value={trialForm.phase}
                    onChange={onChange('phase')}
                    className="w-full border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    {trialPhases.map((phase) => (
                      <option key={phase}>{phase}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={trialForm.status}
                    onChange={onChange('status')}
                    className="w-full border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    {trialStatuses.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Sponsor</label>
                  <input
                    type="text"
                    value={trialForm.sponsor}
                    onChange={onChange('sponsor')}
                    placeholder="Institution or sponsor name"
                    className="w-full border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Location</label>
                  <input
                    type="text"
                    value={trialForm.location}
                    onChange={onChange('location')}
                    placeholder="Hospital or site name"
                    className="w-full border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">City</label>
                  <input
                    type="text"
                    value={trialForm.city}
                    onChange={onChange('city')}
                    className="w-full border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Country</label>
                  <input
                    type="text"
                    value={trialForm.country}
                    onChange={onChange('country')}
                    className="w-full border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="trial-remote"
                  type="checkbox"
                  checked={trialForm.isRemote}
                  onChange={onChange('isRemote')}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="trial-remote" className="text-sm text-gray-700">
                  Remote or hybrid participation available
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Enrollment Target</label>
                  <input
                    type="number"
                    min="0"
                    value={trialForm.enrollmentTarget}
                    onChange={onChange('enrollmentTarget')}
                    className="w-full border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Currently Enrolled</label>
                  <input
                    type="number"
                    min="0"
                    value={trialForm.enrollmentCurrent}
                    onChange={onChange('enrollmentCurrent')}
                    className="w-full border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Start Date</label>
                  <input
                    type="date"
                    value={trialForm.startDate}
                    onChange={onChange('startDate')}
                    className="w-full border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Estimated Completion</label>
                  <input
                    type="date"
                    value={trialForm.endDate}
                    onChange={onChange('endDate')}
                    className="w-full border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Summary</label>
                  <span className="text-xs font-semibold uppercase tracking-wide text-primary-500">
                    AI Assist
                  </span>
                </div>
                <textarea
                  value={trialForm.summary}
                  onChange={onChange('summary')}
                  rows={4}
                  placeholder="Provide a short overview of objectives, interventions, and outcomes."
                  className="w-full border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none bg-white"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Eligibility Criteria</label>
                  <span className="text-xs font-semibold uppercase tracking-wide text-primary-500">
                    AI Assist
                  </span>
                </div>
                <textarea
                  value={trialForm.eligibility}
                  onChange={onChange('eligibility')}
                  rows={4}
                  placeholder="List high-level inclusion or exclusion notes."
                  className="w-full border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none bg-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Public Sign-up URL</label>
                  <input
                    type="url"
                    value={trialForm.signupUrl}
                    onChange={onChange('signupUrl')}
                    placeholder="https://"
                    className="w-full border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Tags</label>
                  <input
                    type="text"
                    value={trialForm.tags}
                    onChange={onChange('tags')}
                    placeholder="glioma, caregiver support"
                    className="w-full border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="text-xs text-gray-500">
                    Comma-separated keywords help patients find this trial.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Contact Name</label>
                  <input
                    type="text"
                    value={trialForm.contactName}
                    onChange={onChange('contactName')}
                    className="w-full border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Contact Email</label>
                  <input
                    type="email"
                    value={trialForm.contactEmail}
                    onChange={onChange('contactEmail')}
                    className="w-full border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Contact Phone</label>
                  <input
                    type="text"
                    value={trialForm.contactPhone}
                    onChange={onChange('contactPhone')}
                    className="w-full border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {trialSubmitError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {trialSubmitError}
                </div>
              )}

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
                  className="btn-primary px-6 py-2 rounded-full text-sm font-semibold disabled:opacity-50"
                  disabled={trialSubmitting}
                >
                  {trialSubmitting ? 'Publishing...' : 'Publish Trial'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrialModal;

