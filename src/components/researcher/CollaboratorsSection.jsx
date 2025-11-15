import React from 'react';

const ResearcherCollaboratorsSection = ({
  meetingRequests,
  meetingRequestsLoading,
  meetingRequestsError,
  onRefreshMeetingRequests,
  onOpenScheduleModal,
  onUpdateMeetingStatus,
  onOpenChat,
  formatDate,
  formatDateTime,
  collaborators,
  collaboratorsLoading,
  collaboratorsError,
  onRefreshCollaborators,
}) => (
  <div className="space-y-6">
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Meeting Requests</h3>
        <button
          onClick={onRefreshMeetingRequests}
          className="text-sm font-medium text-primary-600 hover:text-primary-700"
          disabled={meetingRequestsLoading}
        >
          {meetingRequestsLoading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {meetingRequestsError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {meetingRequestsError}
        </div>
      )}

      {meetingRequestsLoading ? (
        <div className="space-y-3">
          {[1, 2].map((placeholder) => (
            <div key={placeholder} className="h-24 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : meetingRequests.length === 0 ? (
        <p className="text-sm text-gray-500">
          No meeting requests yet. Patients will appear here once they reach out.
        </p>
      ) : (
        <div className="space-y-4">
          {meetingRequests.map((request) => (
            <div key={request.id} className="border rounded-2xl p-4 bg-white">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-base font-semibold text-gray-900">{request.patient_name}</p>
                  <p className="text-xs text-gray-500">
                    Requested on {formatDate(request.created_at)}
                  </p>
                  {request.patient_contact && (
                    <p className="text-sm text-gray-600">Contact: {request.patient_contact}</p>
                  )}
                  {request.patient_notes && (
                    <p className="text-sm text-gray-600">Notes: {request.patient_notes}</p>
                  )}
                  {request.scheduled_at && (
                    <p className="text-sm text-primary-700 font-medium">
                      Scheduled for {formatDateTime(request.scheduled_at)}
                    </p>
                  )}
                  {request.response_notes && (
                    <p className="text-sm text-gray-600">
                      Response notes: {request.response_notes}
                    </p>
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
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-4">
                {(request.status === 'pending' ||
                  request.status === 'pending_researcher' ||
                  request.status === 'pending_admin') && (
                  <>
                    <button
                      onClick={() => onOpenScheduleModal(request)}
                      className="btn-primary text-xs px-4 py-2"
                    >
                      Accept & Schedule
                    </button>
                    <button
                      onClick={() => onUpdateMeetingStatus(request, 'rejected')}
                      className="btn-secondary text-xs px-4 py-2"
                    >
                      Decline
                    </button>
                  </>
                )}
                {request.status === 'accepted' && (
                  <>
                    <button
                      onClick={() => onOpenScheduleModal(request)}
                      className="btn-secondary text-xs px-4 py-2"
                    >
                      Reschedule
                    </button>
                    <button
                      onClick={() =>
                        onUpdateMeetingStatus(
                          request,
                          'completed',
                          request.response_notes || ''
                        )
                      }
                      className="btn-primary text-xs px-4 py-2"
                    >
                      Mark Completed
                    </button>
                  </>
                )}
                <button
                  onClick={() => onOpenChat && onOpenChat(request)}
                  className="text-primary-600 hover:text-primary-700 text-xs font-medium"
                >
                  Open Chat
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>

    <div className="flex items-center justify-between">
      <h3 className="text-xl font-semibold text-gray-900">Collaborators</h3>
      <button
        onClick={onRefreshCollaborators}
        className="text-sm font-medium text-primary-600 hover:text-primary-700"
        disabled={collaboratorsLoading}
      >
        {collaboratorsLoading ? 'Refreshing...' : 'Refresh'}
      </button>
    </div>

    {collaboratorsError && (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
        {collaboratorsError}
      </div>
    )}

    {collaboratorsLoading ? (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((placeholder) => (
          <div key={placeholder} className="card h-32 animate-pulse" />
        ))}
      </div>
    ) : collaborators.length === 0 ? (
      <div className="card text-center py-10">
        <p className="text-sm text-gray-500">
          No other researchers found yet. Invite colleagues to join your network.
        </p>
      </div>
    ) : (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {collaborators.map((collaborator) => (
          <div key={collaborator.id || collaborator.name} className="card">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-primary-100 text-primary-700 rounded-full w-10 h-10 flex items-center justify-center font-semibold">
                    {(collaborator.name || 'Researcher')
                      .split(' ')
                      .map((segment) => segment[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{collaborator.name}</h3>
                    <p className="text-sm text-gray-500">{collaborator.institution}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-gray-800">Specialties:</span>{' '}
                  {collaborator.specialties && collaborator.specialties.length > 0
                    ? collaborator.specialties.join(', ')
                    : 'Not specified'}
                </p>
                {collaborator.researchInterests && (
                  <p className="text-sm text-gray-600 mt-1">
                    <span className="font-medium text-gray-800">Focus:</span>{' '}
                    {collaborator.researchInterests}
                  </p>
                )}
              </div>
              <button className="btn-secondary text-sm px-4 py-2">Connect</button>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

export default ResearcherCollaboratorsSection;
