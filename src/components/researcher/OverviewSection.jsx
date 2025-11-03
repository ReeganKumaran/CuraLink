import React from 'react';
import { Calendar } from 'lucide-react';

const ResearcherOverviewSection = ({ trialStats, questions, collaborators, trials }) => (
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
        <h3 className="text-xl font-semibold mb-4">Upcoming Meetings</h3>
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-700">Patient Consultation</h4>
                <p className="text-xs text-gray-500">Discuss eligibility for trial #23A</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex items-center text-xs text-gray-500">
                  <Calendar className="w-3 h-3 mr-1" />
                  Apr 18, 10:30 AM
                </div>
                <button className="btn-secondary text-xs px-3 py-1.5">Details</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default ResearcherOverviewSection;

