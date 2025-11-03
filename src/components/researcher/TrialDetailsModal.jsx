import React from 'react';
import { ExternalLink, MapPin, X } from 'lucide-react';

const TrialDetailsModal = ({
  trial,
  isOpen,
  onClose,
  formatDate,
}) => {
  if (!isOpen || !trial) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-gray-400 transition hover:text-gray-600"
          aria-label="Close trial details"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-semibold text-gray-900">{trial.title}</h3>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-medium">
              {trial.status && (
                <span className="rounded-full bg-primary-50 px-3 py-1 text-primary-700">
                  {trial.status}
                </span>
              )}
              {trial.phase && (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                  {trial.phase}
                </span>
              )}
              {trial.isRemote && (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
                  Remote
                </span>
              )}
            </div>
          </div>

          {trial.summary && <p className="leading-relaxed text-gray-700">{trial.summary}</p>}

          <div className="grid gap-4 text-sm text-gray-700 md:grid-cols-2">
            <div className="space-y-2">
              <p>
                <span className="font-semibold text-gray-900">Condition: </span>
                {trial.condition || 'Not specified'}
              </p>
              <p>
                <span className="font-semibold text-gray-900">Sponsor: </span>
                {trial.sponsor || 'Not specified'}
              </p>
              <p className="flex items-center gap-1">
                <span className="font-semibold text-gray-900">Location: </span>
                <MapPin className="h-4 w-4 text-primary-500" />
                {trial.isRemote
                  ? 'Remote Friendly'
                  : trial.location ||
                    [trial.city, trial.country].filter(Boolean).join(', ') ||
                    'Not specified'}
              </p>
            </div>
            <div className="space-y-2">
              {trial.startDate && (
                <p>
                  <span className="font-semibold text-gray-900">Starts: </span>
                  {formatDate(trial.startDate)}
                </p>
              )}
              {trial.endDate && (
                <p>
                  <span className="font-semibold text-gray-900">Ends: </span>
                  {formatDate(trial.endDate)}
                </p>
              )}
              <p>
                <span className="font-semibold text-gray-900">Enrollment: </span>
                {(Number(trial.enrollmentCurrent) || 0).toLocaleString()}
                {trial.enrollmentTarget
                  ? ` / ${Number(trial.enrollmentTarget).toLocaleString()}`
                  : ''}
              </p>
            </div>
          </div>

          {trial.eligibility && (
            <div>
              <h4 className="mb-2 text-sm font-semibold text-gray-900">Eligibility Criteria</h4>
              <p className="whitespace-pre-line text-sm text-gray-600">{trial.eligibility}</p>
            </div>
          )}

          {Array.isArray(trial.tags) && trial.tags.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-semibold text-gray-900">Keywords</h4>
              <div className="flex flex-wrap gap-2">
                {trial.tags.map((tag) => (
                  <span
                    key={`${trial.id}-tag-${tag}`}
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-700">
            {trial.contactName && (
              <span>
                Contact{' '}
                <span className="font-semibold text-gray-900">{trial.contactName}</span>
              </span>
            )}
            {trial.contactEmail && (
              <span>
                Email{' '}
                <a
                  href={`mailto:${trial.contactEmail}`}
                  className="font-semibold text-primary-600 hover:underline"
                >
                  {trial.contactEmail}
                </a>
              </span>
            )}
            {trial.contactPhone && (
              <span>
                Phone{' '}
                <a
                  href={`tel:${trial.contactPhone}`}
                  className="font-semibold text-primary-600 hover:underline"
                >
                  {trial.contactPhone}
                </a>
              </span>
            )}
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="rounded-full border border-gray-200 px-5 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
            >
              Close
            </button>
            {trial.signupUrl && (
              <a
                href={trial.signupUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold"
              >
                Visit Trial Site <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrialDetailsModal;

