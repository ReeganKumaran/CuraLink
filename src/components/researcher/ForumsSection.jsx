import React from 'react';

const ResearcherForumsSection = ({
  pendingQuestions,
  questions,
  renderQuestionCard,
  onAskQuestion,
  communityList,
  communitiesLoading,
  communitiesError,
  socketConnected,
  socketError,
  chatError,
  formatDate,
  onCreateCommunity,
  onOpenChat,
}) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 xl:grid-cols-[2fr,1fr] gap-6">
      <div className="space-y-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900">Pending Questions</h3>
            <span className="text-sm text-gray-500">
              {pendingQuestions.length} awaiting response
            </span>
          </div>
          {pendingQuestions.length === 0 ? (
            <p className="text-sm text-gray-500">You are all caught up.</p>
          ) : (
            <div className="space-y-4">
              {pendingQuestions.map((question) =>
                renderQuestionCard(question, { showReply: true })
              )}
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900">Latest Discussions</h3>
            <button onClick={onAskQuestion} className="btn-secondary text-sm px-4 py-2">
              Ask Question
            </button>
          </div>
          <div className="space-y-4">
            {questions.map((question) =>
              renderQuestionCard(question, { showReply: true })
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Communities</h3>
            <div className="flex items-center gap-3">
              <span
                className={`flex items-center gap-2 text-xs font-medium ${
                  socketConnected ? 'text-green-600' : 'text-gray-400'
                }`}
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    socketConnected ? 'bg-green-500' : 'bg-gray-400'
                  }`}
                />
                {socketConnected ? 'Live' : 'Offline'}
              </span>
              <button onClick={onCreateCommunity} className="btn-primary text-sm px-4 py-2">
                Create
              </button>
            </div>
          </div>
          {communitiesError && (
            <p className="text-sm text-red-500 mb-2">
              Unable to load communities right now. Please refresh.
            </p>
          )}
          {chatError && <p className="text-sm text-red-500 mb-2">{chatError}</p>}
          {socketError && <p className="text-sm text-red-500 mb-2">{socketError}</p>}

          <div className="space-y-4">
            {communitiesLoading ? (
              <p className="text-sm text-gray-500">Loading communities...</p>
            ) : communityList.length === 0 ? (
              <p className="text-sm text-gray-500">
                No communities yet. Start one to gather experts.
              </p>
            ) : (
              communityList.map((community) => (
                <div key={community.id} className="border rounded-2xl p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">{community.name}</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        Created by {community.creatorName || 'Researcher'} on{' '}
                        {formatDate(community.createdAt)}
                      </p>
                      {community.description ? (
                        <p className="text-sm text-gray-600 mt-2">{community.description}</p>
                      ) : (
                        <p className="text-sm text-gray-500 mt-2">
                          No description yet. Open the chat to introduce the topic.
                        </p>
                      )}
                    </div>
                    <div className="flex items-end sm:items-center sm:flex-col gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                          community.isMember
                            ? 'bg-primary-50 text-primary-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {community.isMember ? 'You are a member' : 'Not joined'}
                      </span>
                      <button
                        onClick={() => onOpenChat(community.id)}
                        className="btn-secondary text-xs px-3 py-1.5"
                      >
                        {community.isMember ? 'Open Chat' : 'Join Chat'}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default ResearcherForumsSection;

