import React from 'react';

const ResearcherFavoritesSection = ({ items }) => (
  <div className="card">
    <h3 className="text-xl font-semibold text-gray-900 mb-4">Saved Items</h3>
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between rounded-xl border px-4 py-3 text-sm text-gray-600"
        >
          <div>
            <p className="font-medium text-gray-900">{item.label}</p>
            <p className="text-xs text-gray-500">
              {item.type} &bull; {item.note}
            </p>
          </div>
          <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            Open
          </button>
        </div>
      ))}
    </div>
  </div>
);

export default ResearcherFavoritesSection;

