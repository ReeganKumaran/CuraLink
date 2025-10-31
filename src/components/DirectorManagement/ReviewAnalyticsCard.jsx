import React from 'react';

const ReviewAnalyticsCard = ({
  title,
  value,
  icon,
  color,
  bgColor,
  borderColor,
  onClick,
  isActive,
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-lg border-2 transition-all duration-200
        ${onClick ? 'cursor-pointer hover:shadow-lg hover:scale-105' : ''}
        ${isActive ? `${borderColor} ${bgColor}` : 'border-gray-200 bg-white'}
      `}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-2 rounded-lg ${color} text-white`}>
            {icon}
          </div>
          {isActive && (
            <span className="px-2 py-1 text-xs font-medium text-primary-700 bg-primary-100 rounded-full">
              Active
            </span>
          )}
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-600 mt-1">{title}</p>
        </div>
      </div>
      {onClick && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary-500 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-200" />
      )}
    </div>
  );
};

export default ReviewAnalyticsCard;