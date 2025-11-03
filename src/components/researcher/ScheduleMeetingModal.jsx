import React from 'react';
import { X } from 'lucide-react';

const ScheduleMeetingModal = ({
  isOpen,
  meetingRequest,
  scheduleForm,
  onChangeField,
  onSubmit,
  onClose,
  submitting,
}) => {
  if (!isOpen || !meetingRequest) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
          aria-label="Close scheduling modal"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-semibold text-gray-900">Schedule Meeting</h3>
            <p className="text-sm text-gray-500">
              Confirm a time with {meetingRequest.patient_name}. They'll see the update once saved.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Date</label>
                <input
                  type="date"
                  value={scheduleForm.date}
                  onChange={onChangeField('date')}
                  className="w-full border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Time</label>
                <input
                  type="time"
                  value={scheduleForm.time}
                  onChange={onChangeField('time')}
                  className="w-full border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Notes for the patient</label>
              <textarea
                value={scheduleForm.notes}
                onChange={onChangeField('notes')}
                rows={4}
                placeholder="Add agenda details, virtual meeting link, or preparation guidance..."
                className="w-full border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 border border-gray-200 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary px-6 py-2 rounded-full text-sm font-semibold disabled:opacity-60"
                disabled={submitting}
              >
                {submitting ? 'Saving...' : 'Save & Notify'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ScheduleMeetingModal;

