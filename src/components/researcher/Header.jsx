import { MessageCircle, Plus } from 'lucide-react';
import NotificationBell from '../NotificationBell';

const ResearcherHeader = ({
  userProfile,
  onAskQuestion,
  onCreateCommunity,
  notifications = [],
  onViewNotification,
  onClearNotification,
  onClearAllNotifications
}) => (
  <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">
        Welcome back, {userProfile?.name?.split(' ')[0] || 'Researcher'}
      </h1>
      <p className="text-sm text-gray-500">
        Track studies, engage with patients, and grow your communities.
      </p>
    </div>

    <div className="flex flex-wrap items-center gap-3">
      <NotificationBell
        notifications={notifications}
        onViewNotification={onViewNotification}
        onClearNotification={onClearNotification}
        onClearAll={onClearAllNotifications}
      />
      <button
        onClick={onAskQuestion}
        className="btn-secondary inline-flex items-center gap-2 px-4 py-2"
      >
        <MessageCircle className="w-4 h-4" />
        <span>Ask Question</span>
      </button>
      <button
        onClick={onCreateCommunity}
        className="btn-primary inline-flex items-center gap-2 px-4 py-2"
      >
        <Plus className="w-4 h-4" />
        <span>New Community</span>
      </button>
    </div>
  </header>
);

export default ResearcherHeader;

