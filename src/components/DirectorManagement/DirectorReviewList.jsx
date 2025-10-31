import React from 'react';
import { User, Calendar, CheckCircle, Clock, FileText } from 'lucide-react';

const DirectorReviewList = ({ reviews, loading, selectedStatus }) => {
  if (loading) {
    return (
      <div className="p-6">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-24 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="p-12 text-center">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No reviews found for the selected criteria</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="space-y-4">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors duration-200"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <User className="w-4 h-4 text-gray-500 mr-2" />
                  <h3 className="font-semibold text-gray-900">{review.directorName}</h3>
                  <span className="ml-3 text-sm text-gray-500">ID: {review.directorUserId}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>Created: {new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>

                  {review.completedAt && (
                    <div className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                      <span>Completed: {new Date(review.completedAt).toLocaleDateString()}</span>
                    </div>
                  )}

                  <div className="flex items-center">
                    {review.status === 'completed' ? (
                      <span className="flex items-center px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-medium">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Completed
                      </span>
                    ) : (
                      <span className="flex items-center px-2 py-1 bg-yellow-100 text-yellow-700 rounded-md text-xs font-medium">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                      </span>
                    )}
                  </div>
                </div>

                {review.missingFields && review.missingFields.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-500 mb-1">Missing fields:</p>
                    <div className="flex flex-wrap gap-2">
                      {review.missingFields.map((field, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-red-50 text-red-600 text-xs rounded"
                        >
                          {field}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button className="ml-4 px-3 py-1 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors duration-200">
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DirectorReviewList;