import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, Plus, Trash2, GripVertical } from 'lucide-react';
import Modal from '../ui/Modal';

/**
 * Get initial form state
 * @returns {Object} Initial form data
 */
const getInitialFormState = () => ({
  programId: '',
  dayNumber: '',
  title: '',
  description: '',
  questions: [],
  isActive: true,
});

/**
 * Get initial question state
 * @returns {Object} Initial question data
 */
const getInitialQuestionState = () => ({
  questionText: '',
  questionType: 'single-choice',
  options: [
    { text: '', value: 1 },
    { text: '', value: 2 },
  ],
  points: 5,
});

/**
 * Question type options
 */
const QUESTION_TYPES = [
  { value: 'scale', label: 'Scale (1-5)', description: 'Rating scale from 1 to 5' },
  { value: 'single-choice', label: 'Single Choice', description: 'Choose one option' },
  { value: 'multiple-choice', label: 'Multiple Choice', description: 'Select multiple options' },
  { value: 'boolean', label: 'Yes/No', description: 'True or false question' },
  { value: 'text', label: 'Text', description: 'Free text response' },
];

/**
 * SOSQuizForm Component
 * Modal form for creating and editing SOS quizzes
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal visibility
 * @param {Function} props.onClose - Close modal callback
 * @param {Function} props.onSubmit - Form submit callback
 * @param {boolean} props.isLoading - Loading state for submission
 * @param {string} props.serverError - Server error message
 * @param {Object} props.quizToEdit - Quiz data for edit mode
 * @param {Array} props.programs - List of available programs
 * @param {Object} props.selectedProgram - Pre-selected program (optional)
 */
function SOSQuizForm({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  serverError = null,
  quizToEdit = null,
  programs = [],
  selectedProgram = null,
}) {
  const [formData, setFormData] = useState(getInitialFormState());
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState('basic');

  const isEditMode = !!quizToEdit;

  // Get selected program details
  const currentProgram = programs.find((p) => p._id === formData.programId) || selectedProgram;

  // Reset form when modal opens/closes or quiz changes
  useEffect(() => {
    if (isOpen) {
      if (quizToEdit) {
        setFormData({
          programId: quizToEdit.programId?._id || quizToEdit.programId || '',
          dayNumber: quizToEdit.dayNumber?.toString() || '',
          title: quizToEdit.title || '',
          description: quizToEdit.description || '',
          questions: quizToEdit.questions?.map((q) => ({
            questionText: q.questionText || '',
            questionType: q.questionType || 'single-choice',
            options: q.options || [
              { text: '', value: 1 },
              { text: '', value: 2 },
            ],
            points: q.points || 5,
          })) || [],
          isActive: quizToEdit.isActive ?? true,
        });
      } else {
        setFormData({
          ...getInitialFormState(),
          programId: selectedProgram?._id || '',
        });
      }
      setErrors({});
      setActiveTab('basic');
    }
  }, [isOpen, quizToEdit, selectedProgram]);

  /**
   * Validate form data
   * @param {Object} data - Form data to validate
   * @returns {Object} - { isValid: boolean, errors: Object }
   */
  const validateForm = (data) => {
    const newErrors = {};

    // Program validation (only for create mode)
    if (!isEditMode && !data.programId) {
      newErrors.programId = 'Please select a program';
    }

    // Day number validation (only for create mode)
    if (!isEditMode) {
      if (!data.dayNumber) {
        newErrors.dayNumber = 'Day number is required';
      } else {
        const dayNum = parseInt(data.dayNumber, 10);
        if (isNaN(dayNum) || dayNum < 1) {
          newErrors.dayNumber = 'Day number must be at least 1';
        } else if (currentProgram && dayNum > currentProgram.durationDays) {
          newErrors.dayNumber = `Day number cannot exceed program duration (${currentProgram.durationDays} days)`;
        }
      }
    }

    // Title validation
    if (!data.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (data.title.length > 200) {
      newErrors.title = 'Title must be less than 200 characters';
    }

    // Questions validation
    if (data.questions.length === 0) {
      newErrors.questions = 'At least one question is required';
    } else {
      const questionErrors = [];
      data.questions.forEach((q, index) => {
        const qErrors = {};
        if (!q.questionText.trim()) {
          qErrors.questionText = 'Question text is required';
        }
        if ((q.questionType === 'scale' || q.questionType === 'single-choice' || q.questionType === 'multiple-choice') && q.options) {
          const hasEmptyOptions = q.options.some((opt) => !opt.text.trim());
          if (hasEmptyOptions) {
            qErrors.options = 'All options must have text';
          }
          if (q.options.length < 2) {
            qErrors.options = 'At least 2 options are required';
          }
        }
        if (Object.keys(qErrors).length > 0) {
          questionErrors[index] = qErrors;
        }
      });
      if (questionErrors.length > 0 || Object.keys(questionErrors).some((k) => questionErrors[k])) {
        newErrors.questionErrors = questionErrors;
      }
    }

    return {
      isValid: Object.keys(newErrors).length === 0,
      errors: newErrors,
    };
  };

  /**
   * Handle form field change
   * @param {string} field - Field name
   * @param {any} value - New value
   */
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  /**
   * Add a new question
   */
  const handleAddQuestion = () => {
    setFormData((prev) => ({
      ...prev,
      questions: [...prev.questions, getInitialQuestionState()],
    }));
  };

  /**
   * Remove a question
   * @param {number} index - Question index
   */
  const handleRemoveQuestion = (index) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  /**
   * Update a question
   * @param {number} index - Question index
   * @param {string} field - Field name
   * @param {any} value - New value
   */
  const handleQuestionChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) => {
        if (i !== index) return q;

        const updated = { ...q, [field]: value };

        // Reset options when changing question type
        if (field === 'questionType') {
          if (value === 'scale') {
            updated.options = [
              { text: 'Very Bad', value: 1 },
              { text: 'Bad', value: 2 },
              { text: 'Neutral', value: 3 },
              { text: 'Good', value: 4 },
              { text: 'Very Good', value: 5 },
            ];
          } else if (value === 'single-choice' || value === 'multiple-choice') {
            updated.options = [
              { text: '', value: 1 },
              { text: '', value: 2 },
            ];
          } else if (value === 'boolean' || value === 'text') {
            updated.options = [];
          }
        }

        return updated;
      }),
    }));
  };

  /**
   * Add an option to a question
   * @param {number} questionIndex - Question index
   */
  const handleAddOption = (questionIndex) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) => {
        if (i !== questionIndex) return q;
        return {
          ...q,
          options: [...q.options, { text: '', value: q.options.length + 1 }],
        };
      }),
    }));
  };

  /**
   * Remove an option from a question
   * @param {number} questionIndex - Question index
   * @param {number} optionIndex - Option index
   */
  const handleRemoveOption = (questionIndex, optionIndex) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) => {
        if (i !== questionIndex) return q;
        return {
          ...q,
          options: q.options.filter((_, oi) => oi !== optionIndex).map((opt, idx) => ({
            ...opt,
            value: idx + 1,
          })),
        };
      }),
    }));
  };

  /**
   * Update an option
   * @param {number} questionIndex - Question index
   * @param {number} optionIndex - Option index
   * @param {string} text - Option text
   */
  const handleOptionChange = (questionIndex, optionIndex, text) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) => {
        if (i !== questionIndex) return q;
        return {
          ...q,
          options: q.options.map((opt, oi) => {
            if (oi !== optionIndex) return opt;
            return { ...opt, text };
          }),
        };
      }),
    }));
  };

  /**
   * Handle form submission
   * @param {Event} e - Form event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const { isValid, errors: validationErrors } = validateForm(formData);

    if (!isValid) {
      setErrors(validationErrors);
      // Switch to questions tab if there are question errors
      if (validationErrors.questions || validationErrors.questionErrors) {
        setActiveTab('questions');
      }
      return;
    }

    // Prepare data for submission
    const submitData = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      questions: formData.questions.map((q) => ({
        questionText: q.questionText.trim(),
        questionType: q.questionType,
        points: q.points,
        ...(q.questionType === 'scale' || q.questionType === 'single-choice' || q.questionType === 'multiple-choice'
          ? { options: q.options.map((opt) => ({ text: opt.text.trim(), value: opt.value })) }
          : {}),
      })),
      isActive: formData.isActive,
    };

    // Only include programId and dayNumber for create mode
    if (!isEditMode) {
      submitData.programId = formData.programId;
      submitData.dayNumber = parseInt(formData.dayNumber, 10);
    }

    console.log('[SOSQuizForm] Submitting data:', submitData);
    const result = await onSubmit(submitData);
    if (result?.success) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit SOS Quiz' : 'Create SOS Quiz'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'basic'
                ? 'border-gray-800 text-gray-800'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Basic Info
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('questions')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'questions'
                ? 'border-gray-800 text-gray-800'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Questions ({formData.questions.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="max-h-[60vh] overflow-y-auto pr-2">
          {activeTab === 'basic' ? (
            <div className="space-y-4">
              {/* Program Selection (only for create mode) */}
              {!isEditMode && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Program <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.programId}
                      onChange={(e) => handleChange('programId', e.target.value)}
                      disabled={isLoading || selectedProgram}
                      className={`w-full px-3 py-2 border rounded-lg focus:border-gray-800 outline-none transition-colors ${
                        errors.programId ? 'border-red-500' : 'border-gray-300'
                      } ${isLoading || selectedProgram ? 'bg-gray-100' : ''}`}
                    >
                      <option value="">Select a program</option>
                      {programs.map((program) => (
                        <option key={program._id} value={program._id}>
                          {program.title} ({program.durationDays} days)
                        </option>
                      ))}
                    </select>
                    {errors.programId && (
                      <p className="text-red-600 text-sm mt-1">{errors.programId}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Day Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.dayNumber}
                      onChange={(e) => handleChange('dayNumber', e.target.value)}
                      placeholder="e.g., 1"
                      min="1"
                      max={currentProgram?.durationDays || 365}
                      disabled={isLoading}
                      className={`w-full px-3 py-2 border rounded-lg focus:border-gray-800 outline-none transition-colors ${
                        errors.dayNumber ? 'border-red-500' : 'border-gray-300'
                      } ${isLoading ? 'bg-gray-100' : ''}`}
                    />
                    {errors.dayNumber && (
                      <p className="text-red-600 text-sm mt-1">{errors.dayNumber}</p>
                    )}
                    {currentProgram && (
                      <p className="text-xs text-gray-500 mt-1">
                        Program duration: {currentProgram.durationDays} days
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quiz Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="e.g., Day 1: Introduction to Mindfulness"
                  disabled={isLoading}
                  className={`w-full px-3 py-2 border rounded-lg focus:border-gray-800 outline-none transition-colors ${
                    errors.title ? 'border-red-500' : 'border-gray-300'
                  } ${isLoading ? 'bg-gray-100' : ''}`}
                />
                {errors.title && (
                  <p className="text-red-600 text-sm mt-1">{errors.title}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                  <span className="text-gray-400 font-normal ml-1">(optional)</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Brief description of this day's activities..."
                  rows={3}
                  disabled={isLoading}
                  className={`w-full px-3 py-2 border rounded-lg focus:border-gray-800 outline-none resize-none transition-colors border-gray-300 ${
                    isLoading ? 'bg-gray-100' : ''
                  }`}
                />
              </div>

              {/* Active Status */}
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => handleChange('isActive', e.target.checked)}
                    disabled={isLoading}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-0 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
                <span className="text-sm text-gray-700">
                  {formData.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Questions Error */}
              {errors.questions && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{errors.questions}</p>
                </div>
              )}

              {/* Questions List */}
              {formData.questions.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-lg">
                  <p className="text-gray-500 mb-3">No questions added yet</p>
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Add Question
                  </button>
                </div>
              ) : (
                <>
                  {formData.questions.map((question, qIndex) => (
                    <div
                      key={qIndex}
                      className="p-4 border border-gray-200 rounded-lg space-y-3"
                    >
                      {/* Question Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-700">
                            Question {qIndex + 1}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(qIndex)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Question Text */}
                      <div>
                        <input
                          type="text"
                          value={question.questionText}
                          onChange={(e) =>
                            handleQuestionChange(qIndex, 'questionText', e.target.value)
                          }
                          placeholder="Enter your question..."
                          disabled={isLoading}
                          className={`w-full px-3 py-2 border rounded-lg focus:border-gray-800 outline-none transition-colors ${
                            errors.questionErrors?.[qIndex]?.questionText
                              ? 'border-red-500'
                              : 'border-gray-300'
                          }`}
                        />
                        {errors.questionErrors?.[qIndex]?.questionText && (
                          <p className="text-red-600 text-xs mt-1">
                            {errors.questionErrors[qIndex].questionText}
                          </p>
                        )}
                      </div>

                      {/* Question Type and Points */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Type
                          </label>
                          <select
                            value={question.questionType}
                            onChange={(e) =>
                              handleQuestionChange(qIndex, 'questionType', e.target.value)
                            }
                            disabled={isLoading}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
                          >
                            {QUESTION_TYPES.map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Points
                          </label>
                          <input
                            type="number"
                            value={question.points}
                            onChange={(e) =>
                              handleQuestionChange(qIndex, 'points', parseInt(e.target.value) || 0)
                            }
                            min="0"
                            max="100"
                            disabled={isLoading}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
                          />
                        </div>
                      </div>

                      {/* Options (for scale, single-choice, and multiple-choice) */}
                      {(question.questionType === 'scale' ||
                        question.questionType === 'single-choice' ||
                        question.questionType === 'multiple-choice') && (
                        <div className="space-y-2">
                          <label className="block text-xs font-medium text-gray-600">
                            Options
                          </label>
                          {question.options.map((option, oIndex) => (
                            <div key={oIndex} className="flex items-center gap-2">
                              <span className="text-xs text-gray-400 w-6">{oIndex + 1}.</span>
                              <input
                                type="text"
                                value={option.text}
                                onChange={(e) =>
                                  handleOptionChange(qIndex, oIndex, e.target.value)
                                }
                                placeholder={`Option ${oIndex + 1}`}
                                disabled={isLoading || question.questionType === 'scale'}
                                className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
                              />
                              {(question.questionType === 'single-choice' || question.questionType === 'multiple-choice') &&
                                question.options.length > 2 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveOption(qIndex, oIndex)}
                                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                )}
                            </div>
                          ))}
                          {(question.questionType === 'single-choice' || question.questionType === 'multiple-choice') && (
                            <button
                              type="button"
                              onClick={() => handleAddOption(qIndex)}
                              className="text-xs text-gray-600 hover:text-gray-800 flex items-center gap-1"
                            >
                              <Plus className="h-3 w-3" />
                              Add Option
                            </button>
                          )}
                          {errors.questionErrors?.[qIndex]?.options && (
                            <p className="text-red-600 text-xs">
                              {errors.questionErrors[qIndex].options}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add Question Button */}
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Question
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Server Error */}
        {serverError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{serverError}</p>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{isEditMode ? 'Updating...' : 'Creating...'}</span>
              </>
            ) : (
              <span>{isEditMode ? 'Update Quiz' : 'Create Quiz'}</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default SOSQuizForm;
