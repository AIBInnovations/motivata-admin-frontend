import { Calendar, Clock, Ticket, CheckCircle2 } from 'lucide-react';

/**
 * TimelinePreview Component
 * Visual representation of event timeline with booking window
 */
function TimelinePreview({ startDate, endDate, bookingStartDate, bookingEndDate }) {
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Check if all dates are provided
  const allDatesProvided = startDate && endDate && bookingStartDate && bookingEndDate;

  // Calculate if dates are valid
  const isValidTimeline = () => {
    if (!allDatesProvided) return false;
    const bs = new Date(bookingStartDate);
    const be = new Date(bookingEndDate);
    const es = new Date(startDate);
    const ee = new Date(endDate);
    return bs < be && es < ee && bs < ee && be <= ee;
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-5 w-5 text-blue-600" />
        <h4 className="text-lg font-semibold text-gray-900">Event Timeline Preview</h4>
      </div>

      {allDatesProvided && isValidTimeline() ? (
        <div className="space-y-6">
          {/* Timeline visualization */}
          <div className="relative">
            {/* Booking Period Line */}
            <div className="absolute left-0 right-0 top-8 h-2 bg-gradient-to-r from-green-300 via-green-400 to-yellow-300 rounded-full opacity-50"></div>

            {/* Event Period Line */}
            <div className="absolute left-1/3 right-0 top-8 h-2 bg-gradient-to-r from-yellow-300 via-blue-400 to-blue-500 rounded-full"></div>

            {/* Timeline Points */}
            <div className="relative flex justify-between items-start pt-16">
              {/* Booking Start */}
              <div className="flex flex-col items-center -mt-16 w-1/4">
                <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center shadow-lg mb-2">
                  <Ticket className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs font-semibold text-green-700 text-center mb-1">Booking Opens</span>
                <span className="text-xs text-gray-600 text-center">{formatDate(bookingStartDate)}</span>
              </div>

              {/* Event Start */}
              <div className="flex flex-col items-center -mt-16 w-1/4">
                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center shadow-lg mb-2">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs font-semibold text-blue-700 text-center mb-1">Event Starts</span>
                <span className="text-xs text-gray-600 text-center">{formatDate(startDate)}</span>
              </div>

              {/* Booking End */}
              <div className="flex flex-col items-center -mt-16 w-1/4">
                <div className="w-12 h-12 rounded-full bg-yellow-500 flex items-center justify-center shadow-lg mb-2">
                  <CheckCircle2 className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs font-semibold text-yellow-700 text-center mb-1">Booking Closes</span>
                <span className="text-xs text-gray-600 text-center">{formatDate(bookingEndDate)}</span>
              </div>

              {/* Event End */}
              <div className="flex flex-col items-center -mt-16 w-1/4">
                <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center shadow-lg mb-2">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <span className="text-xs font-semibold text-indigo-700 text-center mb-1">Event Ends</span>
                <span className="text-xs text-gray-600 text-center">{formatDate(endDate)}</span>
              </div>
            </div>
          </div>

          {/* Info boxes */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="bg-white rounded-lg p-3 border border-green-200">
              <div className="text-xs font-semibold text-green-700 mb-1">✓ Booking Period</div>
              <div className="text-xs text-gray-600">Users can book tickets</div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-blue-200">
              <div className="text-xs font-semibold text-blue-700 mb-1">🎉 Event Period</div>
              <div className="text-xs text-gray-600">Event is happening</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-3">
            <Clock className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500">
            Fill in all date fields to see the timeline preview
          </p>
        </div>
      )}
    </div>
  );
}

export default TimelinePreview;
