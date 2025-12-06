import { Calendar, MessageCircle, CheckCircle, Clock } from 'lucide-react';
import Modal from '../ui/Modal';

/**
 * Format date for display
 */
function formatDate(isoDate) {
  if (!isoDate) return 'N/A';
  return new Date(isoDate).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

/**
 * PollDetailsModal Component
 * Display poll details and questions
 */
function PollDetailsModal({
  isOpen,
  onClose,
  poll,
  event,
}) {
  if (!poll) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Poll Details"
      size="2xl"
    >
      <div className="space-y-6">
        {/* Event Info */}
        {event && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900">{event.name}</p>
                <p className="text-sm text-blue-700 mt-1">
                  {event.category} • {event.mode}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Poll Status & Meta */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Status</span>
            </div>
            <span
              className={`inline-flex px-2 py-1 text-sm font-medium rounded-full ${
                poll.isActive
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {poll.isActive ? 'Active' : 'Closed'}
            </span>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <MessageCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Questions</span>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {poll.questions?.length || 0}
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">Created</span>
            </div>
            <p className="text-sm text-gray-900">
              {formatDate(poll.createdAt)}
            </p>
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Questions & Options</h3>

          {poll.questions?.length === 0 ? (
            <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg text-center">
              <MessageCircle className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-600 font-medium">No questions</p>
              <p className="text-sm text-gray-500 mt-1">
                This poll has no questions configured.
              </p>
            </div>
          ) : (
            poll.questions?.map((question, qIndex) => (
              <div
                key={qIndex}
                className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm"
              >
                <div className="flex items-start gap-3 mb-3">
                  <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-600 font-semibold text-sm rounded-lg">
                    {qIndex + 1}
                  </span>
                  <h4 className="font-medium text-gray-900 pt-1">{question.questionText}</h4>
                </div>

                <div className="ml-11 space-y-2">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                    Options ({question.options?.length || 0})
                  </p>
                  {question.options?.map((option, optIndex) => (
                    <div
                      key={optIndex}
                      className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
                    >
                      <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-white border border-gray-200 text-gray-500 text-xs font-medium rounded-full">
                        {String.fromCharCode(65 + optIndex)}
                      </span>
                      <span className="text-sm text-gray-700">{option}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Poll ID */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-400">
            Poll ID: <code className="bg-gray-100 px-1 py-0.5 rounded">{poll._id}</code>
          </p>
          {poll.updatedAt && poll.updatedAt !== poll.createdAt && (
            <p className="text-xs text-gray-400 mt-1">
              Last updated: {formatDate(poll.updatedAt)}
            </p>
          )}
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default PollDetailsModal;
