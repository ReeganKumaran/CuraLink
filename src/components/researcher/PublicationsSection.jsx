import React from 'react';

const ResearcherPublicationsSection = ({ publications }) => (
  <div className="card">
    <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent Publications</h3>
    <div className="space-y-4">
      {publications.map((publication) => (
        <div key={publication.id} className="border rounded-2xl p-4">
          <h4 className="text-lg font-semibold text-gray-900">{publication.title}</h4>
          <p className="text-sm text-gray-500 mt-1">
            {publication.journal} &bull; {publication.year}
          </p>
          <div className="flex items-center justify-end mt-4">
            <button className="btn-secondary text-sm px-4 py-2">View Details</button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default ResearcherPublicationsSection;

