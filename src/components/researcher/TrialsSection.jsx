import React from 'react';
import { ExternalLink, MapPin, Plus } from 'lucide-react';

const ResearcherTrialsSection = ({
  trials,
  trialsError,
  trialsLoading,
  onCreateTrial,
  onOpenDetails,
  trialsView,
  onTrialsViewChange,
}) => (
  <div className="card space-y-6">
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h3 className="text-xl font-semibold text-gray-900">Clinical Trials</h3>
        <p className="text-sm text-gray-500">
          {trialsView === 'my' ? 'Your trials and enrollment tracking' : 'Browse all available trials'}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="inline-flex rounded-lg border border-gray-200 p-1">
          <button
            onClick={() => onTrialsViewChange('my')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              trialsView === 'my'
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            My Trials
          </button>
          <button
            onClick={() => onTrialsViewChange('all')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              trialsView === 'all'
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All Trials
          </button>
        </div>
        {trialsView === 'my' && (
          <button
            onClick={onCreateTrial}
            className="btn-primary inline-flex items-center gap-2 px-4 py-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Trial</span>
          </button>
        )}
      </div>
    </div>

    {trialsError && (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
        {trialsError}
      </div>
    )}

    {trialsLoading ? (
      <div className="space-y-3">
        {[1, 2, 3].map((skeleton) => (
          <div
            key={skeleton}
            className="border rounded-2xl p-5 border-gray-200 animate-pulse space-y-3"
          >
            <div className="h-4 w-3/4 rounded bg-slate-200" />
            <div className="h-3 w-1/2 rounded bg-slate-200" />
            <div className="h-20 w-full rounded bg-slate-100" />
          </div>
        ))}
      </div>
    ) : trials.length === 0 ? (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center">
        <h4 className="text-lg font-semibold text-gray-800">
          {trialsView === 'my' ? 'No trials yet' : 'No trials found'}
        </h4>
        <p className="mt-2 text-sm text-gray-600">
          {trialsView === 'my'
            ? 'Use the "New Trial" button to publish upcoming studies and track enrollment.'
            : 'No clinical trials are currently available. Try adjusting your search criteria.'}
        </p>
      </div>
    ) : (
      <div className="space-y-4">
        {trials.map((trial) => {
          const enrolled = Number(trial.enrollmentCurrent) || 0;
          const target = Number(trial.enrollmentTarget) || 0;
          const locationLabel = trial.isRemote
            ? 'Remote Friendly'
            : trial.location ||
              [trial.city, trial.country].filter(Boolean).join(', ') ||
              'Location not specified';

          return (
            <div
              key={trial.id}
              className="border rounded-2xl p-5 hover:border-primary-200 transition"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
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
                    {trial.source === 'clinicaltrials.gov' && (
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">
                        ClinicalTrials.gov
                      </span>
                    )}
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900">{trial.title}</h4>
                  {trial.summary && (
                    <p className="text-sm text-gray-600 line-clamp-2">{trial.summary}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                    {trial.condition && <span>Condition: {trial.condition}</span>}
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-primary-500" />
                      {locationLabel}
                    </span>
                    {trial.sponsor && (
                      <span>
                        Sponsor: <span className="text-gray-700">{trial.sponsor}</span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-start gap-3 md:items-end">
                  <div className="text-sm text-gray-500">Participants</div>
                  <div className="text-xl font-semibold text-gray-900">
                    {enrolled}
                    {target ? ` / ${target}` : ''}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenDetails(trial)}
                      className="btn-secondary px-4 py-2 text-sm"
                    >
                      View Details
                    </button>
                    {trial.signupUrl && (
                      <a
                        href={trial.signupUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"
                      >
                        Share Link <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
);

export default ResearcherTrialsSection;

