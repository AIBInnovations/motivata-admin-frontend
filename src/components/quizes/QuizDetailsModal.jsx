import {
  Loader2,
  Clock,
  User,
  Users,
  IndianRupee,
  CheckCircle,
  XCircle,
  HelpCircle,
  FileText,
  Percent,
  Target,
  Award,
  RefreshCw,
} from 'lucide-react';
import Modal from '../ui/Modal';

/**
 * Format date for display
 */
const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format currency
 */
const formatCurrency = (amount) => {
  if (amount == null) return '-';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Get question type label
 */
const getQuestionTypeLabel = (type) => {
  switch (type) {
    case 'QNA':
      return 'Text Answer';
    case 'MCQ_SINGLE':
      return 'Single Choice';
    case 'MCQ_MULTIPLE':
      return 'Multiple Choice';
    default:
      return type;
  }
};

/**
 * QuizDetailsModal Component
 */
function QuizDetailsModal({ isOpen, onClose, quiz, isLoading = false }) {
  if (!quiz && !isLoading) return null;

  const discountPercent = quiz?.discountPercent || 0;
  const totalPoints = quiz?.questions?.reduce((sum, q) => sum + (q.points || 0), 0) || 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Quiz Details" size="lg">
      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 text-gray-800 animate-spin" />
          <p className="mt-2 text-sm text-gray-500">Loading quiz details...</p>
        </div>
      ) : quiz ? (
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
          {/* Header with Status */}
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-gray-200">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                    quiz.isPaid
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-green-100 text-green-700'
                  }`}
                >
                  {quiz.isPaid ? 'Paid' : 'Free'}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                    quiz.enrollmentType === 'OPEN'
                      ? 'bg-blue-100 text-gray-900'
                      : 'bg-purple-100 text-purple-700'
                  }`}
                >
                  {quiz.enrollmentType === 'OPEN' ? 'Open' : 'Registered Only'}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{quiz.title}</h3>
              {quiz.shortDescription && (
                <p className="text-sm text-gray-500 mt-1">{quiz.shortDescription}</p>
              )}
            </div>
            <span
              className={`shrink-0 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5 ${
                quiz.isLive
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {quiz.isLive ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              {quiz.isLive ? 'Live' : 'Not Live'}
            </span>
          </div>

          {/* Image Preview */}
          {quiz.imageUrl && (
            <div className="rounded-lg overflow-hidden bg-gray-100">
              <img
                src={quiz.imageUrl}
                alt={quiz.title}
                className="w-full h-48 object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Pricing Section (for paid quizes) */}
          {quiz.isPaid && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <IndianRupee className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-amber-600 font-medium uppercase">Price</p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold text-amber-900">
                        {formatCurrency(quiz.price)}
                      </p>
                      {quiz.compareAtPrice && quiz.compareAtPrice > quiz.price && (
                        <p className="text-sm text-gray-500 line-through">
                          {formatCurrency(quiz.compareAtPrice)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                {discountPercent > 0 && (
                  <div className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full">
                    <Percent className="h-4 w-4" />
                    <span className="font-semibold">{discountPercent}% OFF</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                <HelpCircle className="h-4 w-4" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {quiz.questions?.length || 0}
              </p>
              <p className="text-xs text-gray-500">Questions</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                <Target className="h-4 w-4" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{totalPoints}</p>
              <p className="text-xs text-gray-500">Total Points</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                <Users className="h-4 w-4" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {quiz.enrollments?.length || 0}
              </p>
              <p className="text-xs text-gray-500">Enrolled</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                <FileText className="h-4 w-4" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {quiz.submissions?.length || 0}
              </p>
              <p className="text-xs text-gray-500">Submissions</p>
            </div>
          </div>

          {/* Quiz Settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Time Limit */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-xs text-gray-500 font-medium">Time Limit</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {quiz.timeLimit ? `${quiz.timeLimit} minutes` : 'No limit'}
              </p>
            </div>

            {/* Max Attempts */}
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <RefreshCw className="h-4 w-4 text-gray-400" />
                <span className="text-xs text-gray-500 font-medium">Max Attempts</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {quiz.maxAttempts ? quiz.maxAttempts : 'Unlimited'}
              </p>
            </div>
          </div>

          {/* Quiz Options */}
          <div className="flex flex-wrap gap-3">
            <div
              className={`px-3 py-1.5 rounded-full text-sm flex items-center gap-1.5 ${
                quiz.shuffleQuestions
                  ? 'bg-blue-100 text-gray-900'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {quiz.shuffleQuestions ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              Shuffle Questions
            </div>
            <div
              className={`px-3 py-1.5 rounded-full text-sm flex items-center gap-1.5 ${
                quiz.showResults
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {quiz.showResults ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              Show Results
            </div>
          </div>

          {/* Questions Preview */}
          {quiz.questions && quiz.questions.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Questions Preview
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {quiz.questions.map((question, index) => (
                  <div
                    key={question._id || index}
                    className="bg-gray-50 rounded-lg p-3 flex items-start gap-3"
                  >
                    <span className="shrink-0 w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-gray-600">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 truncate">
                        {question.questionText}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">
                          {getQuestionTypeLabel(question.questionType)}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">
                          {question.points} point{question.points !== 1 ? 's' : ''}
                        </span>
                        {question.isRequired && (
                          <>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-red-500">Required</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
            <div>
              <p className="text-xs text-gray-500 mb-1">Created</p>
              <p className="text-sm font-medium text-gray-900">
                {formatDate(quiz.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Last Updated</p>
              <p className="text-sm font-medium text-gray-900">
                {formatDate(quiz.updatedAt)}
              </p>
            </div>
          </div>

          {/* Created By */}
          {quiz.createdBy && (
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-xs text-gray-500 font-medium">Created By</span>
              </div>
              <p className="text-sm font-medium text-gray-900">
                {quiz.createdBy.name || quiz.createdBy.email}
              </p>
            </div>
          )}

          {/* Close Button */}
          <div className="pt-4 border-t border-gray-200 sticky bottom-0 bg-white">
            <button
              onClick={onClose}
              className="w-full px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      ) : (
        <div className="py-12 text-center text-gray-500">
          <p>No quiz data available</p>
        </div>
      )}
    </Modal>
  );
}

export default QuizDetailsModal;
