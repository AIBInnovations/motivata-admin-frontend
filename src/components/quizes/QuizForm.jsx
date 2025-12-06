import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, Plus, Trash2, GripVertical } from 'lucide-react';
import Modal from '../ui/Modal';
import FileUpload from '../ui/FileUpload';

/**
 * Question types
 */
const QUESTION_TYPES = [
  { value: 'QNA', label: 'Q&A (Text Answer)' },
  { value: 'MCQ_SINGLE', label: 'Multiple Choice (Single Answer)' },
  { value: 'MCQ_MULTIPLE', label: 'Multiple Choice (Multiple Answers)' },
];

/**
 * Get initial form state
 * @returns {Object} Initial form data
 */
const getInitialFormState = () => ({
  title: '',
  shortDescription: '',
  isPaid: false,
  price: '',
  compareAtPrice: '',
  enrollmentType: 'OPEN',
  isLive: false,
  timeLimit: '',
  shuffleQuestions: false,
  showResults: true,
  maxAttempts: '',
  imageUrl: '',
  questions: [],
});

/**
 * Get empty question
 * @returns {Object} Empty question object
 */
const getEmptyQuestion = () => ({
  questionText: '',
  questionType: 'MCQ_SINGLE',
  options: [
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ],
  correctAnswer: '',
  points: 1,
  isRequired: false,
  order: 0,
});

/**
 * QuizForm Component
 * Modal form for creating and editing quizes
 */
function QuizForm({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  serverError = null,
  quizToEdit = null,
}) {
  const [formData, setFormData] = useState(getInitialFormState());
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState('basic'); // 'basic' or 'questions'

  const isEditMode = !!quizToEdit;

  // Reset form when modal opens/closes or quiz changes
  useEffect(() => {
    if (isOpen) {
      if (quizToEdit) {
        setFormData({
          title: quizToEdit.title || '',
          shortDescription: quizToEdit.shortDescription || '',
          isPaid: quizToEdit.isPaid || false,
          price: quizToEdit.price?.toString() || '',
          compareAtPrice: quizToEdit.compareAtPrice?.toString() || '',
          enrollmentType: quizToEdit.enrollmentType || 'OPEN',
          isLive: quizToEdit.isLive ?? false,
          timeLimit: quizToEdit.timeLimit?.toString() || '',
          shuffleQuestions: quizToEdit.shuffleQuestions || false,
          showResults: quizToEdit.showResults ?? true,
          maxAttempts: quizToEdit.maxAttempts?.toString() || '',
          imageUrl: quizToEdit.imageUrl || '',
          questions: quizToEdit.questions || [],
        });
      } else {
        setFormData(getInitialFormState());
      }
      setErrors({});
      setActiveTab('basic');
    }
  }, [isOpen, quizToEdit]);

  /**
   * Validate form data
   */
  const validateForm = (data) => {
    const newErrors = {};

    // Title validation
    if (!data.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (data.title.length > 200) {
      newErrors.title = 'Title must be less than 200 characters';
    }

    // Short description validation
    if (data.shortDescription && data.shortDescription.length > 500) {
      newErrors.shortDescription = 'Short description must be less than 500 characters';
    }

    // Price validation for paid quizes
    if (data.isPaid) {
      if (!data.price) {
        newErrors.price = 'Price is required for paid quizes';
      } else {
        const priceNum = parseFloat(data.price);
        if (isNaN(priceNum) || priceNum <= 0) {
          newErrors.price = 'Price must be greater than 0';
        }
      }
    }

    // Compare at price validation
    if (data.compareAtPrice) {
      const compareNum = parseFloat(data.compareAtPrice);
      const priceNum = parseFloat(data.price);
      if (isNaN(compareNum) || compareNum < 0) {
        newErrors.compareAtPrice = 'Compare at price must be a positive number';
      } else if (!isNaN(priceNum) && compareNum < priceNum) {
        newErrors.compareAtPrice = 'Compare at price must be greater than or equal to price';
      }
    }

    // Time limit validation
    if (data.timeLimit) {
      const timeLimitNum = parseInt(data.timeLimit, 10);
      if (isNaN(timeLimitNum) || timeLimitNum < 1) {
        newErrors.timeLimit = 'Time limit must be at least 1 minute';
      } else if (timeLimitNum > 480) {
        newErrors.timeLimit = 'Time limit cannot exceed 480 minutes';
      }
    }

    // Max attempts validation
    if (data.maxAttempts) {
      const maxAttemptsNum = parseInt(data.maxAttempts, 10);
      if (isNaN(maxAttemptsNum) || maxAttemptsNum < 1) {
        newErrors.maxAttempts = 'Max attempts must be at least 1';
      }
    }

    // Image URL validation
    if (data.imageUrl && !/^https?:\/\/.+/.test(data.imageUrl)) {
      newErrors.imageUrl = 'Please provide a valid image URL';
    }

    // Validate questions
    if (data.questions.length > 0) {
      data.questions.forEach((q, index) => {
        if (!q.questionText.trim()) {
          newErrors[`question_${index}_text`] = 'Question text is required';
        }

        if (q.questionType === 'MCQ_SINGLE' || q.questionType === 'MCQ_MULTIPLE') {
          if (!q.options || q.options.length < 2) {
            newErrors[`question_${index}_options`] = 'At least 2 options are required';
          } else {
            const hasCorrect = q.options.some(opt => opt.isCorrect);
            if (!hasCorrect) {
              newErrors[`question_${index}_correct`] = 'At least one correct option is required';
            }
            if (q.questionType === 'MCQ_SINGLE') {
              const correctCount = q.options.filter(opt => opt.isCorrect).length;
              if (correctCount > 1) {
                newErrors[`question_${index}_correct`] = 'Only one correct option allowed for single choice';
              }
            }
          }
        }
      });
    }

    return {
      isValid: Object.keys(newErrors).length === 0,
      errors: newErrors,
    };
  };

  /**
   * Handle form field change
   */
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
    const newQuestion = getEmptyQuestion();
    newQuestion.order = formData.questions.length;
    setFormData((prev) => ({
      ...prev,
      questions: [...prev.questions, newQuestion],
    }));
  };

  /**
   * Remove a question
   */
  const handleRemoveQuestion = (index) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  /**
   * Update a question
   */
  const handleQuestionChange = (index, field, value) => {
    setFormData((prev) => {
      const updatedQuestions = [...prev.questions];
      updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
      return { ...prev, questions: updatedQuestions };
    });
  };

  /**
   * Add option to a question
   */
  const handleAddOption = (questionIndex) => {
    setFormData((prev) => {
      const updatedQuestions = [...prev.questions];
      updatedQuestions[questionIndex].options.push({ text: '', isCorrect: false });
      return { ...prev, questions: updatedQuestions };
    });
  };

  /**
   * Remove option from a question
   */
  const handleRemoveOption = (questionIndex, optionIndex) => {
    setFormData((prev) => {
      const updatedQuestions = [...prev.questions];
      updatedQuestions[questionIndex].options = updatedQuestions[questionIndex].options.filter(
        (_, i) => i !== optionIndex
      );
      return { ...prev, questions: updatedQuestions };
    });
  };

  /**
   * Update option
   */
  const handleOptionChange = (questionIndex, optionIndex, field, value) => {
    setFormData((prev) => {
      const updatedQuestions = [...prev.questions];
      const question = updatedQuestions[questionIndex];

      // For single choice, uncheck other options when one is selected
      if (field === 'isCorrect' && value && question.questionType === 'MCQ_SINGLE') {
        question.options = question.options.map((opt, i) => ({
          ...opt,
          isCorrect: i === optionIndex,
        }));
      } else {
        question.options[optionIndex] = {
          ...question.options[optionIndex],
          [field]: value,
        };
      }

      return { ...prev, questions: updatedQuestions };
    });
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const { isValid, errors: validationErrors } = validateForm(formData);

    if (!isValid) {
      setErrors(validationErrors);
      // Switch to questions tab if there are question errors
      if (Object.keys(validationErrors).some(key => key.startsWith('question_'))) {
        setActiveTab('questions');
      }
      return;
    }

    // Prepare data for submission
    const submitData = {
      title: formData.title.trim(),
      shortDescription: formData.shortDescription.trim() || undefined,
      isPaid: formData.isPaid,
      enrollmentType: formData.enrollmentType,
      isLive: formData.isLive,
      shuffleQuestions: formData.shuffleQuestions,
      showResults: formData.showResults,
      questions: formData.questions.map((q, index) => ({
        ...q,
        order: index,
        options: q.questionType.startsWith('MCQ') ? q.options : undefined,
        correctAnswer: q.questionType === 'QNA' ? q.correctAnswer : undefined,
      })),
    };

    // Optional fields
    if (formData.isPaid && formData.price) {
      submitData.price = parseFloat(formData.price);
    } else {
      submitData.price = 0;
    }
    if (formData.compareAtPrice) {
      submitData.compareAtPrice = parseFloat(formData.compareAtPrice);
    }
    if (formData.timeLimit) {
      submitData.timeLimit = parseInt(formData.timeLimit, 10);
    }
    if (formData.maxAttempts) {
      submitData.maxAttempts = parseInt(formData.maxAttempts, 10);
    }
    if (formData.imageUrl.trim()) {
      submitData.imageUrl = formData.imageUrl.trim();
    }

    const result = await onSubmit(submitData);
    if (result?.success) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Quiz' : 'Create Quiz'}
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
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="e.g., JavaScript Fundamentals Quiz"
                  disabled={isLoading}
                  className={`w-full px-3 py-2 border rounded-lg focus:border-gray-800 outline-none transition-colors ${
                    errors.title ? 'border-red-500' : 'border-gray-300'
                  } ${isLoading ? 'bg-gray-100' : ''}`}
                />
                {errors.title && (
                  <p className="text-red-600 text-sm mt-1">{errors.title}</p>
                )}
              </div>

              {/* Short Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Short Description
                </label>
                <textarea
                  value={formData.shortDescription}
                  onChange={(e) => handleChange('shortDescription', e.target.value)}
                  placeholder="Brief description of the quiz..."
                  rows={2}
                  disabled={isLoading}
                  className={`w-full px-3 py-2 border rounded-lg focus:border-gray-800 outline-none resize-none transition-colors ${
                    errors.shortDescription ? 'border-red-500' : 'border-gray-300'
                  } ${isLoading ? 'bg-gray-100' : ''}`}
                />
                {errors.shortDescription && (
                  <p className="text-red-600 text-sm mt-1">{errors.shortDescription}</p>
                )}
              </div>

              {/* Paid Toggle and Price */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isPaid}
                      onChange={(e) => handleChange('isPaid', e.target.checked)}
                      disabled={isLoading}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-0 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-800"></div>
                  </label>
                  <span className="text-sm text-gray-700">
                    {formData.isPaid ? 'Paid Quiz' : 'Free Quiz'}
                  </span>
                </div>

                {formData.isPaid && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Price (₹) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={formData.price}
                        onChange={(e) => handleChange('price', e.target.value)}
                        placeholder="e.g., 499"
                        min="1"
                        disabled={isLoading}
                        className={`w-full px-3 py-2 border rounded-lg focus:border-gray-800 outline-none ${
                          errors.price ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.price && (
                        <p className="text-red-600 text-sm mt-1">{errors.price}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Compare at Price (₹)
                      </label>
                      <input
                        type="number"
                        value={formData.compareAtPrice}
                        onChange={(e) => handleChange('compareAtPrice', e.target.value)}
                        placeholder="e.g., 999"
                        min="0"
                        disabled={isLoading}
                        className={`w-full px-3 py-2 border rounded-lg focus:border-gray-800 outline-none ${
                          errors.compareAtPrice ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.compareAtPrice && (
                        <p className="text-red-600 text-sm mt-1">{errors.compareAtPrice}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Enrollment Type and Time Limit */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Enrollment Type
                  </label>
                  <select
                    value={formData.enrollmentType}
                    onChange={(e) => handleChange('enrollmentType', e.target.value)}
                    disabled={isLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
                  >
                    <option value="OPEN">Open (Anyone can take)</option>
                    <option value="REGISTERED">Registered (Enrolled users only)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time Limit (minutes)
                  </label>
                  <input
                    type="number"
                    value={formData.timeLimit}
                    onChange={(e) => handleChange('timeLimit', e.target.value)}
                    placeholder="No limit"
                    min="1"
                    max="480"
                    disabled={isLoading}
                    className={`w-full px-3 py-2 border rounded-lg focus:border-gray-800 outline-none ${
                      errors.timeLimit ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.timeLimit && (
                    <p className="text-red-600 text-sm mt-1">{errors.timeLimit}</p>
                  )}
                </div>
              </div>

              {/* Max Attempts */}
              <div className="w-1/2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Attempts
                </label>
                <input
                  type="number"
                  value={formData.maxAttempts}
                  onChange={(e) => handleChange('maxAttempts', e.target.value)}
                  placeholder="Unlimited"
                  min="1"
                  disabled={isLoading}
                  className={`w-full px-3 py-2 border rounded-lg focus:border-gray-800 outline-none ${
                    errors.maxAttempts ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.maxAttempts && (
                  <p className="text-red-600 text-sm mt-1">{errors.maxAttempts}</p>
                )}
              </div>

              {/* Quiz Image */}
              <FileUpload
                label="Quiz Image"
                value={formData.imageUrl}
                onUpload={(url) => handleChange('imageUrl', url)}
                disabled={isLoading}
                error={errors.imageUrl}
                type="image"
                folder="quizzes"
                placeholder="Drop image here or click to upload"
              />

              {/* Toggles */}
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.shuffleQuestions}
                      onChange={(e) => handleChange('shuffleQuestions', e.target.checked)}
                      disabled={isLoading}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-0 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-800"></div>
                  </label>
                  <span className="text-sm text-gray-700">Shuffle Questions</span>
                </div>

                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.showResults}
                      onChange={(e) => handleChange('showResults', e.target.checked)}
                      disabled={isLoading}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-0 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-800"></div>
                  </label>
                  <span className="text-sm text-gray-700">Show Results</span>
                </div>

                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isLive}
                      onChange={(e) => handleChange('isLive', e.target.checked)}
                      disabled={isLoading}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                  <span className="text-sm text-gray-700">
                    {formData.isLive ? 'Live' : 'Not Live'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Questions List */}
              {formData.questions.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500 mb-4">No questions added yet</p>
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Add First Question
                  </button>
                </div>
              ) : (
                formData.questions.map((question, qIndex) => (
                  <div
                    key={qIndex}
                    className="border border-gray-200 rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-5 w-5 text-gray-400" />
                        <span className="font-medium text-gray-700">
                          Question {qIndex + 1}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(qIndex)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Question Text */}
                    <div>
                      <textarea
                        value={question.questionText}
                        onChange={(e) =>
                          handleQuestionChange(qIndex, 'questionText', e.target.value)
                        }
                        placeholder="Enter question text..."
                        rows={2}
                        className={`w-full px-3 py-2 border rounded-lg focus:border-gray-800 outline-none resize-none ${
                          errors[`question_${qIndex}_text`]
                            ? 'border-red-500'
                            : 'border-gray-300'
                        }`}
                      />
                      {errors[`question_${qIndex}_text`] && (
                        <p className="text-red-600 text-sm mt-1">
                          {errors[`question_${qIndex}_text`]}
                        </p>
                      )}
                    </div>

                    {/* Question Type and Points */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Type</label>
                        <select
                          value={question.questionType}
                          onChange={(e) =>
                            handleQuestionChange(qIndex, 'questionType', e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          {QUESTION_TYPES.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Points</label>
                        <input
                          type="number"
                          value={question.points}
                          onChange={(e) =>
                            handleQuestionChange(qIndex, 'points', parseInt(e.target.value) || 1)
                          }
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                    </div>

                    {/* Options for MCQ */}
                    {(question.questionType === 'MCQ_SINGLE' ||
                      question.questionType === 'MCQ_MULTIPLE') && (
                      <div className="space-y-2">
                        <label className="block text-xs text-gray-500">Options</label>
                        {question.options.map((option, oIndex) => (
                          <div key={oIndex} className="flex items-center gap-2">
                            <input
                              type={
                                question.questionType === 'MCQ_SINGLE'
                                  ? 'radio'
                                  : 'checkbox'
                              }
                              checked={option.isCorrect}
                              onChange={(e) =>
                                handleOptionChange(qIndex, oIndex, 'isCorrect', e.target.checked)
                              }
                              className="h-4 w-4 text-gray-800"
                              name={`question_${qIndex}_correct`}
                            />
                            <input
                              type="text"
                              value={option.text}
                              onChange={(e) =>
                                handleOptionChange(qIndex, oIndex, 'text', e.target.value)
                              }
                              placeholder={`Option ${oIndex + 1}`}
                              className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                            />
                            {question.options.length > 2 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveOption(qIndex, oIndex)}
                                className="p-1 text-gray-400 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => handleAddOption(qIndex)}
                          className="text-sm text-gray-800 hover:text-black"
                        >
                          + Add Option
                        </button>
                        {errors[`question_${qIndex}_options`] && (
                          <p className="text-red-600 text-sm">
                            {errors[`question_${qIndex}_options`]}
                          </p>
                        )}
                        {errors[`question_${qIndex}_correct`] && (
                          <p className="text-red-600 text-sm">
                            {errors[`question_${qIndex}_correct`]}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Correct Answer for QNA */}
                    {question.questionType === 'QNA' && (
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Expected Answer (for reference)
                        </label>
                        <textarea
                          value={question.correctAnswer || ''}
                          onChange={(e) =>
                            handleQuestionChange(qIndex, 'correctAnswer', e.target.value)
                          }
                          placeholder="Enter expected answer..."
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                        />
                      </div>
                    )}

                    {/* Required Toggle */}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={question.isRequired}
                        onChange={(e) =>
                          handleQuestionChange(qIndex, 'isRequired', e.target.checked)
                        }
                        className="h-4 w-4 text-gray-800 rounded"
                      />
                      <span className="text-sm text-gray-600">Required question</span>
                    </div>
                  </div>
                ))
              )}

              {formData.questions.length > 0 && (
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-gray-800 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Question
                </button>
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

export default QuizForm;
