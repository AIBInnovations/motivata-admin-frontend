import {
  X,
  Loader2,
  Calendar,
  HelpCircle,
  Target,
  CheckCircle,
  XCircle,
  ToggleLeft,
  List,
  AlignLeft,
  CheckSquare,
} from 'lucide-react';

/**
 * Format date to readable format
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
const formatDate = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Question type display names
 */
const questionTypeLabels = {
  scale: 'Scale (1-5)',
  'single-choice': 'Single Choice',
  'multiple-choice': 'Multiple Choice',
  boolean: 'Yes/No',
  text: 'Text Response',
};

/**
 * Question type icons
 */
const questionTypeIcons = {
  scale: Target,
  'single-choice': List,
  'multiple-choice': CheckSquare,
  boolean: ToggleLeft,
  text: AlignLeft,
};

/**
 * SOSQuizDetailsModal Component
 * Displays detailed information about an SOS quiz
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal visibility
 * @param {Function} props.onClose - Close modal callback
 * @param {Object} props.quiz - Quiz data
 * @param {boolean} props.isLoading - Loading state
 */
function SOSQuizDetailsModal({
  isOpen,
  onClose,
  quiz,
  isLoading = false,
}) {
  if (!isOpen) return null;

  // Calculate total points
  const totalPoints = quiz?.questions?.reduce((sum, q) => sum + (q.points || 0), 0) || 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative min-h-full flex items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Quiz Details</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 text-gray-800 animate-spin" />
                <p className="mt-2 text-sm text-gray-500">Loading quiz details...</p>
              </div>
            ) : quiz ? (
              <div className="space-y-6">
                {/* Title and Status */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        quiz.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {quiz.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {quiz.dayNumber && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                        Day {quiz.dayNumber}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">{quiz.title}</h3>
                </div>

                {/* Program Info */}
                {quiz.programId && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Program</p>
                    <p className="font-medium text-gray-900">
                      {quiz.programId.title || quiz.programId}
                    </p>
                  </div>
                )}

                {/* Description */}
                {quiz.description && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Description</h4>
                    <p className="text-gray-600 whitespace-pre-wrap">{quiz.description}</p>
                  </div>
                )}

                {/* Quiz Stats Grid */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <HelpCircle className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-blue-700">
                      {quiz.questions?.length || quiz.questionCount || 0}
                    </p>
                    <p className="text-xs text-blue-600">Questions</p>
                  </div>

                  <div className="bg-amber-50 rounded-lg p-4 text-center">
                    <Target className="h-5 w-5 text-amber-600 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-amber-700">{totalPoints}</p>
                    <p className="text-xs text-amber-600">Total Points</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <Calendar className="h-5 w-5 text-gray-500 mx-auto mb-1" />
                    <p className="text-lg font-semibold text-gray-900">
                      Day {quiz.dayNumber || '-'}
                    </p>
                    <p className="text-xs text-gray-500">Program Day</p>
                  </div>
                </div>

                {/* Questions Preview */}
                {quiz.questions && quiz.questions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <HelpCircle className="h-4 w-4" />
                      Questions
                    </h4>
                    <div className="space-y-3">
                      {quiz.questions.map((question, index) => {
                        const TypeIcon = questionTypeIcons[question.questionType] || HelpCircle;
                        return (
                          <div
                            key={index}
                            className="p-3 border border-gray-200 rounded-lg"
                          >
                            <div className="flex items-start gap-3">
                              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
                                {index + 1}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-gray-900 font-medium">
                                  {question.questionText}
                                </p>
                                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <TypeIcon className="h-3 w-3" />
                                    {questionTypeLabels[question.questionType] ||
                                      question.questionType}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Target className="h-3 w-3" />
                                    {question.points} pts
                                  </span>
                                </div>

                                {/* Options Preview */}
                                {question.options && question.options.length > 0 && (
                                  <div className="mt-2 space-y-1">
                                    {question.options.map((option, optIndex) => (
                                      <div
                                        key={optIndex}
                                        className="flex items-center gap-2 text-sm text-gray-600"
                                      >
                                        <span className={`w-4 h-4 border border-gray-300 flex-shrink-0 ${
                                          question.questionType === 'multiple-choice' ? 'rounded' : 'rounded-full'
                                        }`} />
                                        <span>
                                          {option.text}
                                          {question.questionType === 'scale' && (
                                            <span className="text-gray-400 ml-1">
                                              ({option.value})
                                            </span>
                                          )}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Boolean Display */}
                                {question.questionType === 'boolean' && (
                                  <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                                    <span className="flex items-center gap-1">
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                      Yes
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <XCircle className="h-4 w-4 text-red-500" />
                                      No
                                    </span>
                                  </div>
                                )}

                                {/* Text Display */}
                                {question.questionType === 'text' && (
                                  <div className="mt-2 text-sm text-gray-500 italic">
                                    Free text response
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Timestamps */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <span>Created: {formatDate(quiz.createdAt)}</span>
                    {quiz.updatedAt && quiz.updatedAt !== quiz.createdAt && (
                      <span>Updated: {formatDate(quiz.updatedAt)}</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <p>No quiz data available</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="w-full px-4 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SOSQuizDetailsModal;
