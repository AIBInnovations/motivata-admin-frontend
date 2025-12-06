import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, Plus, Trash2, GripVertical } from 'lucide-react';
import Modal from '../ui/Modal';

/**
 * Challenge category options
 */
const CATEGORY_OPTIONS = [
  { value: 'health', label: 'Health' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'mindfulness', label: 'Mindfulness' },
  { value: 'productivity', label: 'Productivity' },
  { value: 'social', label: 'Social' },
  { value: 'creativity', label: 'Creativity' },
  { value: 'learning', label: 'Learning' },
  { value: 'wellness', label: 'Wellness' },
  { value: 'habit', label: 'Habit' },
  { value: 'other', label: 'Other' },
];

/**
 * Challenge difficulty options
 */
const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: 'Easy', description: 'Suitable for beginners' },
  { value: 'medium', label: 'Medium', description: 'Moderate effort required' },
  { value: 'hard', label: 'Hard', description: 'Challenging for experienced users' },
];

/**
 * Get initial form state
 * @returns {Object} Initial form data
 */
const getInitialFormState = () => ({
  title: '',
  description: '',
  category: '',
  difficulty: 'medium',
  tasks: [],
  durationDays: '',
  imageUrl: '',
  isActive: false,
});

/**
 * Get initial task state
 * @returns {Object} Initial task data
 */
const getInitialTaskState = () => ({
  title: '',
  description: '',
});

/**
 * ChallengeForm Component
 * Modal form for creating and editing challenges with tasks
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal visibility
 * @param {Function} props.onClose - Close modal callback
 * @param {Function} props.onSubmit - Form submit callback
 * @param {boolean} props.isLoading - Loading state for submission
 * @param {string} props.serverError - Server error message
 * @param {Object} props.challengeToEdit - Challenge data for edit mode
 */
function ChallengeForm({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  serverError = null,
  challengeToEdit = null,
}) {
  const [formData, setFormData] = useState(getInitialFormState());
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState('basic');

  const isEditMode = !!challengeToEdit;

  // Reset form when modal opens/closes or challenge changes
  useEffect(() => {
    if (isOpen) {
      if (challengeToEdit) {
        setFormData({
          title: challengeToEdit.title || '',
          description: challengeToEdit.description || '',
          category: challengeToEdit.category || '',
          difficulty: challengeToEdit.difficulty || 'medium',
          tasks: challengeToEdit.tasks?.map((t) => ({
            title: t.title || '',
            description: t.description || '',
          })) || [],
          durationDays: challengeToEdit.durationDays?.toString() || '',
          imageUrl: challengeToEdit.imageUrl || '',
          isActive: challengeToEdit.isActive ?? false,
        });
      } else {
        setFormData(getInitialFormState());
      }
      setErrors({});
      setActiveTab('basic');
    }
  }, [isOpen, challengeToEdit]);

  /**
   * Validate form data
   * @param {Object} data - Form data to validate
   * @returns {Object} - { isValid: boolean, errors: Object }
   */
  const validateForm = (data) => {
    const newErrors = {};

    // Title validation
    if (!data.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (data.title.length > 200) {
      newErrors.title = 'Title must be less than 200 characters';
    }

    // Description validation
    if (!data.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (data.description.length > 2000) {
      newErrors.description = 'Description must be less than 2000 characters';
    }

    // Category validation (required)
    if (!data.category) {
      newErrors.category = 'Category is required';
    }

    // Duration days validation (optional)
    if (data.durationDays) {
      const durationNum = parseInt(data.durationDays, 10);
      if (isNaN(durationNum) || durationNum < 1) {
        newErrors.durationDays = 'Duration must be at least 1 day';
      } else if (durationNum > 365) {
        newErrors.durationDays = 'Duration cannot exceed 365 days';
      }
    }

    // Image URL validation
    if (data.imageUrl && !/^https?:\/\/.+/.test(data.imageUrl)) {
      newErrors.imageUrl = 'Please provide a valid image URL';
    }

    // Tasks validation
    if (data.tasks.length === 0) {
      newErrors.tasks = 'At least one task is required';
    } else {
      const taskErrors = [];
      data.tasks.forEach((task, index) => {
        const tErrors = {};
        if (!task.title.trim()) {
          tErrors.title = 'Task title is required';
        }
        if (Object.keys(tErrors).length > 0) {
          taskErrors[index] = tErrors;
        }
      });
      if (taskErrors.length > 0 || Object.keys(taskErrors).some((k) => taskErrors[k])) {
        newErrors.taskErrors = taskErrors;
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
   * Add a new task
   */
  const handleAddTask = () => {
    setFormData((prev) => ({
      ...prev,
      tasks: [...prev.tasks, getInitialTaskState()],
    }));
  };

  /**
   * Remove a task
   * @param {number} index - Task index
   */
  const handleRemoveTask = (index) => {
    setFormData((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((_, i) => i !== index),
    }));
  };

  /**
   * Update a task
   * @param {number} index - Task index
   * @param {string} field - Field name
   * @param {any} value - New value
   */
  const handleTaskChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task, i) => {
        if (i !== index) return task;
        return { ...task, [field]: value };
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
      // Switch to tasks tab if there are task errors
      if (validationErrors.tasks || validationErrors.taskErrors) {
        setActiveTab('tasks');
      }
      return;
    }

    // Prepare data for submission
    const submitData = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      category: formData.category,
      difficulty: formData.difficulty,
      tasks: formData.tasks.map((task, index) => ({
        title: task.title.trim(),
        description: task.description.trim(),
        order: index,
      })),
      isActive: formData.isActive,
    };

    // Optional fields
    if (formData.durationDays) {
      submitData.durationDays = parseInt(formData.durationDays, 10);
    }
    if (formData.imageUrl.trim()) {
      submitData.imageUrl = formData.imageUrl.trim();
    }

    console.log('[ChallengeForm] Submitting data:', submitData);
    const result = await onSubmit(submitData);
    if (result?.success) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Challenge' : 'Create Challenge'}
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
            onClick={() => setActiveTab('tasks')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'tasks'
                ? 'border-gray-800 text-gray-800'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Tasks ({formData.tasks.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="max-h-[60vh] overflow-y-auto pr-2">
          {activeTab === 'basic' ? (
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Challenge Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="e.g., 30-Day Fitness Challenge"
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
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Describe what participants will achieve through this challenge..."
                  rows={4}
                  disabled={isLoading}
                  className={`w-full px-3 py-2 border rounded-lg focus:border-gray-800 outline-none resize-none transition-colors ${
                    errors.description ? 'border-red-500' : 'border-gray-300'
                  } ${isLoading ? 'bg-gray-100' : ''}`}
                />
                {errors.description && (
                  <p className="text-red-600 text-sm mt-1">{errors.description}</p>
                )}
              </div>

              {/* Category and Difficulty Row */}
              <div className="grid grid-cols-2 gap-4">
                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                    disabled={isLoading}
                    className={`w-full px-3 py-2 border rounded-lg focus:border-gray-800 outline-none transition-colors ${
                      errors.category ? 'border-red-500' : 'border-gray-300'
                    } ${isLoading ? 'bg-gray-100' : ''}`}
                  >
                    <option value="">Select a category</option>
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="text-red-600 text-sm mt-1">{errors.category}</p>
                  )}
                </div>

                {/* Difficulty */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Difficulty
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => handleChange('difficulty', e.target.value)}
                    disabled={isLoading}
                    className={`w-full px-3 py-2 border rounded-lg focus:border-gray-800 outline-none transition-colors border-gray-300 ${isLoading ? 'bg-gray-100' : ''}`}
                  >
                    {DIFFICULTY_OPTIONS.map((diff) => (
                      <option key={diff.value} value={diff.value}>
                        {diff.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Duration Days */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (Days)
                  <span className="text-gray-400 font-normal ml-1">(optional)</span>
                </label>
                <input
                  type="number"
                  value={formData.durationDays}
                  onChange={(e) => handleChange('durationDays', e.target.value)}
                  placeholder="e.g., 30"
                  min="1"
                  max="365"
                  disabled={isLoading}
                  className={`w-full px-3 py-2 border rounded-lg focus:border-gray-800 outline-none transition-colors ${
                    errors.durationDays ? 'border-red-500' : 'border-gray-300'
                  } ${isLoading ? 'bg-gray-100' : ''}`}
                />
                {errors.durationDays && (
                  <p className="text-red-600 text-sm mt-1">{errors.durationDays}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Duration of the challenge in days. Leave empty for no time limit.
                </p>
              </div>

              {/* Image URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL
                  <span className="text-gray-400 font-normal ml-1">(optional)</span>
                </label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => handleChange('imageUrl', e.target.value)}
                  placeholder="https://example.com/challenge-image.jpg"
                  disabled={isLoading}
                  className={`w-full px-3 py-2 border rounded-lg focus:border-gray-800 outline-none transition-colors ${
                    errors.imageUrl ? 'border-red-500' : 'border-gray-300'
                  } ${isLoading ? 'bg-gray-100' : ''}`}
                />
                {errors.imageUrl && (
                  <p className="text-red-600 text-sm mt-1">{errors.imageUrl}</p>
                )}
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
                  {formData.isActive ? 'Active (Visible to users)' : 'Inactive'}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Tasks Error */}
              {errors.tasks && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{errors.tasks}</p>
                </div>
              )}

              {/* Tasks List */}
              {formData.tasks.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-lg">
                  <p className="text-gray-500 mb-3">No tasks added yet</p>
                  <button
                    type="button"
                    onClick={handleAddTask}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Add Task
                  </button>
                </div>
              ) : (
                <>
                  {formData.tasks.map((task, tIndex) => (
                    <div
                      key={tIndex}
                      className="p-4 border border-gray-200 rounded-lg space-y-3"
                    >
                      {/* Task Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-700">
                            Task {tIndex + 1}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveTask(tIndex)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Task Title */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Title <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={task.title}
                          onChange={(e) =>
                            handleTaskChange(tIndex, 'title', e.target.value)
                          }
                          placeholder="e.g., Do 20 pushups"
                          disabled={isLoading}
                          className={`w-full px-3 py-2 border rounded-lg focus:border-gray-800 outline-none transition-colors ${
                            errors.taskErrors?.[tIndex]?.title
                              ? 'border-red-500'
                              : 'border-gray-300'
                          }`}
                        />
                        {errors.taskErrors?.[tIndex]?.title && (
                          <p className="text-red-600 text-xs mt-1">
                            {errors.taskErrors[tIndex].title}
                          </p>
                        )}
                      </div>

                      {/* Task Description */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Description
                          <span className="text-gray-400 font-normal ml-1">(optional)</span>
                        </label>
                        <textarea
                          value={task.description}
                          onChange={(e) =>
                            handleTaskChange(tIndex, 'description', e.target.value)
                          }
                          placeholder="Additional details about this task..."
                          rows={2}
                          disabled={isLoading}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none resize-none transition-colors"
                        />
                      </div>
                    </div>
                  ))}

                  {/* Add Task Button */}
                  <button
                    type="button"
                    onClick={handleAddTask}
                    className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Task
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
              <span>{isEditMode ? 'Update Challenge' : 'Create Challenge'}</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default ChallengeForm;
