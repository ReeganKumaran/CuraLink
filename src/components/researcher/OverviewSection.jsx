import React from 'react';

const ResearcherOverviewSection = ({
  trialStats,
  questions,
  collaborators,
  trials,
  meetingRequests,
  formatDate,
  formatDateTime,
  onOpenScheduleModal,
  onOpenChat,
  formatDistanceLabel,
}) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="card">
        <h3 className="text-sm font-medium text-gray-600 mb-1">Active Trials</h3>
        <p className="text-3xl font-bold text-primary-600">{trialStats.total}</p>
        <p className="text-xs text-gray-500 mt-1">{trialStats.recruiting} recruiting</p>
      </div>
      <div className="card">
        <h3 className="text-sm font-medium text-gray-600 mb-1">Total Participants</h3>
        <p className="text-3xl font-bold text-primary-600">
          {trialStats.enrollmentCurrent.toLocaleString()}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Target {trialStats.enrollmentTarget.toLocaleString()}
        </p>
      </div>
      <div className="card">
        <h3 className="text-sm font-medium text-gray-600 mb-1">Forum Questions</h3>
        <p className="text-3xl font-bold text-primary-600">{questions.length}</p>
        <p className="text-xs text-gray-500 mt-1">Awaiting reply</p>
      </div>
      <div className="card">
        <h3 className="text-sm font-medium text-gray-600 mb-1">Collaborators</h3>
        <p className="text-3xl font-bold text-primary-600">{collaborators.length}</p>
        <p className="text-xs text-gray-500 mt-1">Team members on CuraLink</p>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="card">
        <h3 className="text-xl font-semibold mb-4">Trial Progress</h3>
        {trials.length === 0 ? (
          <p className="text-sm text-gray-500">
            Create your first trial to start tracking enrollment progress.
          </p>
        ) : (
          trials.slice(0, 2).map((trial) => {
            const enrolled = Number(trial.enrollmentCurrent) || 0;
            const target = Number(trial.enrollmentTarget) || 0;
            const progress =
              target > 0 ? Math.min(100, Math.round((enrolled / target) * 100)) : 0;
            return (
              <div key={trial.id} className="mb-4 last:mb-0">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-sm font-medium text-gray-700">{trial.title}</h4>
                  <span className="text-xs text-gray-500">{trial.phase || 'Phase N/A'}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>{enrolled} enrolled</span>
                  <span>Target: {target || 'N/A'}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Meeting Requests</h3>
          {meetingRequests.length > 3 && (
            <span className="text-xs text-gray-500">
              Showing latest {Math.min(3, meetingRequests.length)}
            </span>
          )}
        </div>
        {meetingRequests.length === 0 ? (
          <p className="text-sm text-gray-500">No pending meeting requests at the moment.</p>
        ) : (
          <div className="space-y-3">
            {meetingRequests.slice(0, 3).map((request) => (
              <div
                key={request.id}
                className="border rounded-2xl p-4 bg-white flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
              >
                <div className="space-y-1">
                  <p className="text-base font-semibold text-gray-900">
                    {request.patient_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    Requested on {formatDate ? formatDate(request.created_at) : request.created_at}
                  </p>
                  {Number.isFinite(request.distanceKm) && formatDistanceLabel && (
                    <p className="text-xs text-primary-600">
                      {formatDistanceLabel(request.distanceKm)}
                    </p>
                  )}
                  {request.scheduled_at && (
                    <p className="text-xs text-primary-700 font-medium">
                      Scheduled for{' '}
                      {formatDateTime ? formatDateTime(request.scheduled_at) : request.scheduled_at}
                    </p>
                  )}
                  {request.patient_notes && (
                    <p className="text-sm text-gray-600 line-clamp-2">{request.patient_notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                      request.status === 'accepted'
                        ? 'bg-green-100 text-green-700'
                        : request.status === 'completed'
                        ? 'bg-blue-100 text-blue-700'
                        : request.status === 'rejected'
                        ? 'bg-red-100 text-red-600'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {request.status.replace(/_/g, ' ')}
                  </span>
                  {onOpenScheduleModal && (
                    <button
                      onClick={() => onOpenScheduleModal(request)}
                      className="btn-secondary text-xs px-4 py-2"
                    >
                      Manage
                    </button>
                  )}
                  {onOpenChat && (
                    <button
                      onClick={() => onOpenChat(request)}
                      className="text-primary-600 hover:text-primary-700 text-xs font-medium"
                    >
                      Chat
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);

export default ResearcherOverviewSection;
