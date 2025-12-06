import { useState, useEffect } from 'react';
import { Loader2, Plus, Trash2, GripVertical } from 'lucide-react';
import Modal from '../ui/Modal';

/**
 * Get initial form state for poll
 */
const getInitialFormState = (poll = null) => ({
  questions: poll?.questions?.length > 0
    ? poll.questions.map(q => ({
        questionText: q.questionText || '',
        options: q.options?.length > 0 ? [...q.options] : ['', ''],
      }))
    : [{ questionText: '', options: ['', ''] }],
  isActive: poll?.isActive ?? true,
});

/**
 * Validate poll form data
 */
const validateForm = (data) => {
  const errors = {};

  if (!data.questions || data.questions.length === 0) {
    errors.questions = 'At least one question is required';
    return { isValid: false, errors };
  }

  const questionErrors = [];
  data.questions.forEach((question, qIndex) => {
    const qError = {};

    if (!question.questionText?.trim()) {
      qError.questionText = 'Question text is required';
    } else if (question.questionText.length > 500) {
      qError.questionText = 'Question text must be 500 characters or less';
    }

    // Check options
    const validOptions = question.options?.filter(opt => opt?.trim()) || [];
    if (validOptions.length < 2) {
      qError.options = 'At least 2 options are required';
    }

    // Check for duplicate options
    const uniqueOptions = new Set(validOptions.map(opt => opt.trim().toLowerCase()));
    if (uniqueOptions.size !== validOptions.length) {
      qError.options = 'Options must be unique';
    }

    if (Object.keys(qError).length > 0) {
      questionErrors[qIndex] = qError;
    }
  });

  if (questionErrors.some(e => e)) {
    errors.questionErrors = questionErrors;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * PollForm Component
 * Create or edit polls for events
 */
function PollForm({
  isOpen,
  onClose,
  onSubmit,
  poll = null,
  event = null,
  isLoading = false,
  serverError = null,
}) {
  const isEditMode = !!poll;
  const [formData, setFormData] = useState(getInitialFormState(poll));
  const [errors, setErrors] = useState({});

  // Reset form when modal opens/closes or poll changes
  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialFormState(poll));
      setErrors({});
      console.log('[PollForm] Form initialized:', { isEditMode, poll });
    }
  }, [isOpen, poll]);

  // Handle question text change
  const handleQuestionChange = (qIndex, value) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === qIndex ? { ...q, questionText: value } : q
      ),
    }));

    // Clear error
    if (errors.questionErrors?.[qIndex]?.questionText) {
      setErrors(prev => {
        const newErrors = { ...prev };
        if (newErrors.questionErrors?.[qIndex]) {
          delete newErrors.questionErrors[qIndex].questionText;
        }
        return newErrors;
      });
    }
  };

  // Handle option change
  const handleOptionChange = (qIndex, optIndex, value) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === qIndex
          ? {
              ...q,
              options: q.options.map((opt, j) => j === optIndex ? value : opt)
            }
          : q
      ),
    }));

    // Clear error
    if (errors.questionErrors?.[qIndex]?.options) {
      setErrors(prev => {
        const newErrors = { ...prev };
        if (newErrors.questionErrors?.[qIndex]) {
          delete newErrors.questionErrors[qIndex].options;
        }
        return newErrors;
      });
    }
  };

  // Add new option to a question
  const handleAddOption = (qIndex) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === qIndex ? { ...q, options: [...q.options, ''] } : q
      ),
    }));
  };

  // Remove option from a question
  const handleRemoveOption = (qIndex, optIndex) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === qIndex
          ? { ...q, options: q.options.filter((_, j) => j !== optIndex) }
          : q
      ),
    }));
  };

  // Add new question
  const handleAddQuestion = () => {
    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, { questionText: '', options: ['', ''] }],
    }));
  };

  // Remove question
  const handleRemoveQuestion = (qIndex) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== qIndex),
    }));
  };

  // Handle active status toggle
  const handleActiveToggle = () => {
    setFormData(prev => ({ ...prev, isActive: !prev.isActive }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate
    const validation = validateForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      console.log('[PollForm] Validation failed:', validation.errors);
      return;
    }

    // Prepare submit data - filter empty options
    const submitData = {
      questions: formData.questions.map(q => ({
        questionText: q.questionText.trim(),
        options: q.options.filter(opt => opt?.trim()).map(opt => opt.trim()),
      })),
    };

    // Add eventId for create, isActive for edit
    if (!isEditMode && event) {
      submitData.eventId = event._id;
    } else if (isEditMode) {
      // isActive is only allowed during update, not create
      submitData.isActive = formData.isActive;
    }

    console.log('[PollForm] Submitting:', submitData);
    await onSubmit(submitData);
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditMode ? 'Edit Poll' : 'Create Poll'}
      size="2xl"
      closeOnOverlayClick={!isLoading}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Event Info */}
        {event && (
          <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg">
            <p className="text-sm">
              <span className="font-medium">Event:</span> {event.name}
            </p>
          </div>
        )}

        {/* Server Error */}
        {serverError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {serverError}
          </div>
        )}

        {/* General Error */}
        {errors.questions && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {errors.questions}
          </div>
        )}

        {/* Questions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Questions</h3>
            <span className="text-sm text-gray-500">{formData.questions.length} question(s)</span>
          </div>

          {formData.questions.map((question, qIndex) => (
            <div
              key={qIndex}
              className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4"
            >
              {/* Question Header */}
              <div className="flex items-start gap-3">
                <div className="flex items-center gap-2 text-gray-400 mt-2">
                  <GripVertical className="h-4 w-4" />
                  <span className="font-medium text-sm text-gray-500">Q{qIndex + 1}</span>
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Question Text <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={question.questionText}
                    onChange={(e) => handleQuestionChange(qIndex, e.target.value)}
                    disabled={isLoading}
                    maxLength={500}
                    className={`w-full px-3 py-2 border rounded-lg focus:border-gray-800 outline-none disabled:bg-gray-100 ${
                      errors.questionErrors?.[qIndex]?.questionText ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter your question"
                  />
                  {errors.questionErrors?.[qIndex]?.questionText && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.questionErrors[qIndex].questionText}
                    </p>
                  )}
                </div>

                {formData.questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(qIndex)}
                    disabled={isLoading}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-6"
                    title="Remove question"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Options */}
              <div className="ml-10 space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Options <span className="text-red-500">*</span>
                  <span className="text-gray-400 font-normal ml-1">(min 2)</span>
                </label>

                {errors.questionErrors?.[qIndex]?.options && (
                  <p className="text-sm text-red-500">
                    {errors.questionErrors[qIndex].options}
                  </p>
                )}

                {question.options.map((option, optIndex) => (
                  <div key={optIndex} className="flex items-center gap-2">
                    <span className="text-sm text-gray-400 w-6">{optIndex + 1}.</span>
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(qIndex, optIndex, e.target.value)}
                      disabled={isLoading}
                      maxLength={200}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none disabled:bg-gray-100"
                      placeholder={`Option ${optIndex + 1}`}
                    />
                    {question.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(qIndex, optIndex)}
                        disabled={isLoading}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove option"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => handleAddOption(qIndex)}
                  disabled={isLoading || question.options.length >= 10}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Plus className="h-3 w-3" />
                  Add Option
                </button>
              </div>
            </div>
          ))}

          {/* Add Question Button */}
          <button
            type="button"
            onClick={handleAddQuestion}
            disabled={isLoading || formData.questions.length >= 20}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Add Question
          </button>
        </div>

        {/* Poll Status */}
        {isEditMode && (
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <p className="font-medium text-gray-900">Poll Status</p>
              <p className="text-sm text-gray-500">
                {formData.isActive
                  ? 'Poll is accepting submissions'
                  : 'Poll is closed for submissions'}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={handleActiveToggle}
                disabled={isLoading}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEditMode ? 'Update Poll' : 'Create Poll'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default PollForm;
