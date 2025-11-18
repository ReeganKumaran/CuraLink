import { useEffect } from 'react';
import { X, MessageCircle } from 'lucide-react';

const NotificationToast = ({ notification, onClose, onView }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000); // Auto-close after 5 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className="bg-white rounded-lg shadow-lg border-l-4 border-primary-600 p-4 max-w-sm">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-primary-600" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm">
                  {notification.senderName}
                </p>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {notification.message}
                </p>
              </div>
              <button
                onClick={onClose}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {onView && (
              <button
                onClick={() => {
                  onView(notification);
                  onClose();
                }}
                className="mt-2 text-xs font-medium text-primary-600 hover:text-primary-700"
              >
                View message
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationToast;
