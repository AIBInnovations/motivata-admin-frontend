import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Plus,
  Filter,
  Eye,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  ClipboardList,
  RefreshCw,
  ChevronDown,
  Search,
  HelpCircle,
  Target,
  Calendar,
  ToggleLeft,
  ToggleRight,
  Trophy,
} from 'lucide-react';
import useSOSQuizzes from '../hooks/useSOSQuizzes';
import useSOSPrograms from '../hooks/useSOSPrograms';
import SOSQuizForm from '../components/quizes/SOSQuizForm';
import SOSQuizDetailsModal from '../components/quizes/SOSQuizDetailsModal';
import SOSProgramForm from '../components/challenges/SOSProgramForm';
import SOSProgramDetailsModal from '../components/challenges/SOSProgramDetailsModal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Pagination from '../components/ui/Pagination';

/**
 * Status badge colors
 */
const statusColors = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-600',
};

/**
 * Type badge colors for programs
 */
const typeColors = {
  GSOS: 'bg-blue-100 text-blue-700',
  ISOS: 'bg-purple-100 text-purple-700',
};

function Quizes() {
  // Main tab state
  const [activeMainTab, setActiveMainTab] = useState('quizzes');

  // Hook for quiz data management
  const {
    quizzes,
    pagination: quizPagination,
    filters: quizFilters,
    isLoading: quizLoading,
    error: quizError,
    fetchQuizzes,
    createQuiz,
    getQuizById,
    updateQuiz,
    deleteQuiz,
    filterByProgram,
    updateFilters: updateQuizFilters,
    resetFilters: resetQuizFilters,
    changePage: changeQuizPage,
    clearError: clearQuizError,
  } = useSOSQuizzes();

  // Hook for program data management
  const {
    programs,
    pagination: programPagination,
    filters: programFilters,
    isLoading: programLoading,
    error: programError,
    fetchPrograms,
    createProgram,
    getProgramById,
    getProgramStats,
    updateProgram,
    toggleProgramStatus,
    deleteProgram,
    searchPrograms,
    updateFilters: updateProgramFilters,
    resetFilters: resetProgramFilters,
    changePage: changeProgramPage,
    clearError: clearProgramError,
  } = useSOSPrograms();

  // Quiz Modal states
  const [isQuizFormModalOpen, setIsQuizFormModalOpen] = useState(false);
  const [isQuizDetailsModalOpen, setIsQuizDetailsModalOpen] = useState(false);
  const [isQuizDeleteDialogOpen, setIsQuizDeleteDialogOpen] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [quizToEdit, setQuizToEdit] = useState(null);
  const [quizDetailsLoading, setQuizDetailsLoading] = useState(false);

  // Program Modal states
  const [isProgramFormModalOpen, setIsProgramFormModalOpen] = useState(false);
  const [isProgramDetailsModalOpen, setIsProgramDetailsModalOpen] = useState(false);
  const [isProgramDeleteDialogOpen, setIsProgramDeleteDialogOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [programToEdit, setProgramToEdit] = useState(null);
  const [programDetailsLoading, setProgramDetailsLoading] = useState(false);

  // Form states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Quiz Filter states
  const [showQuizFilters, setShowQuizFilters] = useState(false);
  const [localProgramFilter, setLocalProgramFilter] = useState(quizFilters.programId || '');
  const [localQuizActiveFilter, setLocalQuizActiveFilter] = useState(quizFilters.isActive || '');

  // Program Filter states
  const [showProgramFilters, setShowProgramFilters] = useState(false);
  const [localProgramSearch, setLocalProgramSearch] = useState(programFilters.search || '');
  const [localProgramTypeFilter, setLocalProgramTypeFilter] = useState(programFilters.type || '');
  const [localProgramActiveFilter, setLocalProgramActiveFilter] = useState(programFilters.isActive || '');

  // Fetch programs on mount
  useEffect(() => {
    fetchPrograms(1);
  }, []);

  // ============ Quiz Handlers ============

  const handleOpenQuizCreateModal = useCallback(() => {
    setFormError(null);
    setQuizToEdit(null);
    setIsQuizFormModalOpen(true);
  }, []);

  const handleOpenQuizEditModal = useCallback(
    async (quiz) => {
      setFormError(null);
      setQuizDetailsLoading(true);
      try {
        const result = await getQuizById(quiz._id);
        if (result.success) {
          setQuizToEdit(result.data);
          setIsQuizFormModalOpen(true);
        } else {
          alert(result.error || 'Failed to load quiz details');
        }
      } catch (err) {
        console.error('[Quizes] Failed to load quiz for edit:', err);
        alert('An unexpected error occurred');
      } finally {
        setQuizDetailsLoading(false);
      }
    },
    [getQuizById]
  );

  const handleCloseQuizFormModal = useCallback(() => {
    setIsQuizFormModalOpen(false);
    setFormError(null);
    setQuizToEdit(null);
  }, []);

  const handleQuizFormSubmit = useCallback(
    async (formData) => {
      setIsSubmitting(true);
      setFormError(null);
      try {
        let result;
        if (quizToEdit) {
          result = await updateQuiz(quizToEdit._id, formData);
        } else {
          result = await createQuiz(formData);
        }
        if (result.success) {
          return result;
        } else {
          setFormError(result.error || 'Failed to save quiz');
          return { success: false };
        }
      } catch (err) {
        console.error('[Quizes] Form submission error:', err);
        setFormError('An unexpected error occurred');
        return { success: false };
      } finally {
        setIsSubmitting(false);
      }
    },
    [createQuiz, updateQuiz, quizToEdit]
  );

  const handleOpenQuizDetails = useCallback(
    async (quiz) => {
      setSelectedQuiz(quiz);
      setIsQuizDetailsModalOpen(true);
      setQuizDetailsLoading(true);
      try {
        const result = await getQuizById(quiz._id);
        if (result.success) {
          setSelectedQuiz(result.data);
        }
      } catch (err) {
        console.error('[Quizes] Failed to fetch details:', err);
      } finally {
        setQuizDetailsLoading(false);
      }
    },
    [getQuizById]
  );

  const handleCloseQuizDetailsModal = useCallback(() => {
    setIsQuizDetailsModalOpen(false);
    setSelectedQuiz(null);
  }, []);

  const handleOpenQuizDeleteDialog = useCallback((quiz) => {
    setSelectedQuiz(quiz);
    setIsQuizDeleteDialogOpen(true);
  }, []);

  const handleCloseQuizDeleteDialog = useCallback(() => {
    setIsQuizDeleteDialogOpen(false);
    setSelectedQuiz(null);
  }, []);

  const handleQuizDeleteConfirm = useCallback(async () => {
    if (!selectedQuiz) return;
    setIsSubmitting(true);
    try {
      const result = await deleteQuiz(selectedQuiz._id);
      if (result.success) {
        handleCloseQuizDeleteDialog();
      } else {
        alert(result.error || 'Failed to delete quiz');
      }
    } catch (err) {
      console.error('[Quizes] Delete error:', err);
      alert('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedQuiz, deleteQuiz, handleCloseQuizDeleteDialog]);

  const handleApplyQuizFilters = useCallback(() => {
    updateQuizFilters({
      programId: localProgramFilter,
      isActive: localQuizActiveFilter,
    });
    setShowQuizFilters(false);
  }, [localProgramFilter, localQuizActiveFilter, updateQuizFilters]);

  const handleResetQuizFilters = useCallback(() => {
    setLocalProgramFilter('');
    setLocalQuizActiveFilter('');
    resetQuizFilters();
    setShowQuizFilters(false);
  }, [resetQuizFilters]);

  const handleRefreshQuizzes = useCallback(() => {
    fetchQuizzes(quizPagination.currentPage);
  }, [fetchQuizzes, quizPagination.currentPage]);

  // ============ Program Handlers ============

  const handleOpenProgramCreateModal = useCallback(() => {
    setFormError(null);
    setProgramToEdit(null);
    setIsProgramFormModalOpen(true);
  }, []);

  const handleOpenProgramEditModal = useCallback(
    async (program) => {
      setFormError(null);
      setProgramDetailsLoading(true);
      try {
        const result = await getProgramById(program._id);
        if (result.success) {
          setProgramToEdit(result.data);
          setIsProgramFormModalOpen(true);
        } else {
          alert(result.error || 'Failed to load program details');
        }
      } catch (err) {
        console.error('[Quizes] Failed to load program for edit:', err);
        alert('An unexpected error occurred');
      } finally {
        setProgramDetailsLoading(false);
      }
    },
    [getProgramById]
  );

  const handleCloseProgramFormModal = useCallback(() => {
    setIsProgramFormModalOpen(false);
    setFormError(null);
    setProgramToEdit(null);
  }, []);

  const handleProgramFormSubmit = useCallback(
    async (formData) => {
      setIsSubmitting(true);
      setFormError(null);
      try {
        let result;
        if (programToEdit) {
          result = await updateProgram(programToEdit._id, formData);
        } else {
          result = await createProgram(formData);
        }
        if (result.success) {
          return result;
        } else {
          setFormError(result.error || 'Failed to save program');
          return { success: false };
        }
      } catch (err) {
        console.error('[Quizes] Form submission error:', err);
        setFormError('An unexpected error occurred');
        return { success: false };
      } finally {
        setIsSubmitting(false);
      }
    },
    [createProgram, updateProgram, programToEdit]
  );

  const handleOpenProgramDetails = useCallback(
    async (program) => {
      setSelectedProgram(program);
      setIsProgramDetailsModalOpen(true);
      setProgramDetailsLoading(true);
      try {
        const result = await getProgramById(program._id);
        if (result.success) {
          setSelectedProgram(result.data);
        }
      } catch (err) {
        console.error('[Quizes] Failed to fetch program details:', err);
      } finally {
        setProgramDetailsLoading(false);
      }
    },
    [getProgramById]
  );

  const handleCloseProgramDetailsModal = useCallback(() => {
    setIsProgramDetailsModalOpen(false);
    setSelectedProgram(null);
  }, []);

  const handleToggleProgramStatus = useCallback(
    async (program) => {
      setIsSubmitting(true);
      try {
        const result = await toggleProgramStatus(program._id, program.isActive);
        if (!result.success) {
          alert(result.error || 'Failed to update program status');
        }
      } catch (err) {
        console.error('[Quizes] Toggle status error:', err);
        alert('An unexpected error occurred');
      } finally {
        setIsSubmitting(false);
      }
    },
    [toggleProgramStatus]
  );

  const handleOpenProgramDeleteDialog = useCallback((program) => {
    setSelectedProgram(program);
    setIsProgramDeleteDialogOpen(true);
  }, []);

  const handleCloseProgramDeleteDialog = useCallback(() => {
    setIsProgramDeleteDialogOpen(false);
    setSelectedProgram(null);
  }, []);

  const handleProgramDeleteConfirm = useCallback(async () => {
    if (!selectedProgram) return;
    setIsSubmitting(true);
    try {
      const result = await deleteProgram(selectedProgram._id);
      if (result.success) {
        handleCloseProgramDeleteDialog();
      } else {
        alert(result.error || 'Failed to delete program');
      }
    } catch (err) {
      console.error('[Quizes] Delete error:', err);
      alert('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedProgram, deleteProgram, handleCloseProgramDeleteDialog]);

  const handleProgramSearchChange = useCallback(
    (e) => {
      const value = e.target.value;
      setLocalProgramSearch(value);
      searchPrograms(value);
    },
    [searchPrograms]
  );

  const handleApplyProgramFilters = useCallback(() => {
    updateProgramFilters({
      search: localProgramSearch,
      type: localProgramTypeFilter,
      isActive: localProgramActiveFilter,
    });
    setShowProgramFilters(false);
  }, [localProgramSearch, localProgramTypeFilter, localProgramActiveFilter, updateProgramFilters]);

  const handleResetProgramFilters = useCallback(() => {
    setLocalProgramSearch('');
    setLocalProgramTypeFilter('');
    setLocalProgramActiveFilter('');
    resetProgramFilters();
    setShowProgramFilters(false);
  }, [resetProgramFilters]);

  const handleRefreshPrograms = useCallback(() => {
    fetchPrograms(programPagination.currentPage);
  }, [fetchPrograms, programPagination.currentPage]);

  // ============ Helper Functions ============

  const hasActiveQuizFilters = useMemo(() => {
    return quizFilters.programId || quizFilters.isActive !== '';
  }, [quizFilters]);

  const hasActiveProgramFilters = useMemo(() => {
    return programFilters.search || programFilters.type || programFilters.isActive !== '';
  }, [programFilters]);

  const getProgramName = useCallback(
    (programId) => {
      if (!programId) return '-';
      if (typeof programId === 'object' && programId.title) {
        return programId.title;
      }
      const program = programs.find((p) => p._id === programId);
      return program?.title || programId;
    },
    [programs]
  );

  const getTotalPoints = useCallback((quiz) => {
    return quiz.questions?.reduce((sum, q) => sum + (q.points || 0), 0) || quiz.totalPoints || 0;
  }, []);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">SOS Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage SOS programs and their daily quizzes
          </p>
        </div>
        <button
          onClick={activeMainTab === 'quizzes' ? handleOpenQuizCreateModal : handleOpenProgramCreateModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors font-medium"
        >
          <Plus className="h-5 w-5" />
          <span>{activeMainTab === 'quizzes' ? 'Create Quiz' : 'Create Program'}</span>
        </button>
      </div>

      {/* Main Tabs */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveMainTab('programs')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeMainTab === 'programs'
                  ? 'border-gray-800 text-gray-800'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Trophy className="h-4 w-4 inline-block mr-2" />
              Programs ({programPagination.totalCount || 0})
            </button>
            <button
              onClick={() => setActiveMainTab('quizzes')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeMainTab === 'quizzes'
                  ? 'border-gray-800 text-gray-800'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <ClipboardList className="h-4 w-4 inline-block mr-2" />
              Quizzes ({quizPagination.totalCount || 0})
            </button>
          </nav>
        </div>
      </div>

      {/* Error Banner */}
      {(activeMainTab === 'quizzes' ? quizError : programError) && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">
              Error loading {activeMainTab === 'quizzes' ? 'quizzes' : 'programs'}
            </p>
            <p className="text-sm text-red-700 mt-0.5">
              {activeMainTab === 'quizzes' ? quizError : programError}
            </p>
          </div>
          <button
            onClick={activeMainTab === 'quizzes' ? clearQuizError : clearProgramError}
            className="shrink-0 text-red-600 hover:text-red-800"
          >
            &times;
          </button>
        </div>
      )}

      {/* Programs Tab Content */}
      {activeMainTab === 'programs' && (
        <>
          {/* Programs Filters */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={localProgramSearch}
                  onChange={handleProgramSearchChange}
                  placeholder="Search programs..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
                />
              </div>
              <button
                onClick={() => setShowProgramFilters(!showProgramFilters)}
                className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                  hasActiveProgramFilters
                    ? 'border-gray-800 bg-gray-50 text-gray-800'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Filter className="h-4 w-4" />
                <span>Filters</span>
                {hasActiveProgramFilters && (
                  <span className="px-1.5 py-0.5 bg-gray-800 text-white text-xs rounded-full">
                    {(programFilters.search ? 1 : 0) +
                      (programFilters.type ? 1 : 0) +
                      (programFilters.isActive !== '' ? 1 : 0)}
                  </span>
                )}
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${showProgramFilters ? 'rotate-180' : ''}`}
                />
              </button>
              <button
                onClick={handleRefreshPrograms}
                disabled={programLoading}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${programLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <div className="ml-auto text-sm text-gray-500">
                {programPagination.totalCount} program{programPagination.totalCount !== 1 ? 's' : ''} total
              </div>
            </div>

            {showProgramFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={localProgramTypeFilter}
                      onChange={(e) => setLocalProgramTypeFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
                    >
                      <option value="">All Types</option>
                      <option value="GSOS">General SOS (GSOS)</option>
                      <option value="ISOS">Intensive SOS (ISOS)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={localProgramActiveFilter}
                      onChange={(e) => setLocalProgramActiveFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
                    >
                      <option value="">All Status</option>
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                  <div className="flex items-end gap-2 sm:col-span-2">
                    <button
                      onClick={handleApplyProgramFilters}
                      className="flex-1 sm:flex-none px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
                    >
                      Apply
                    </button>
                    <button
                      onClick={handleResetProgramFilters}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Programs Table - Desktop */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Program</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Type</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Duration</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Status</th>
                    <th className="text-right px-6 py-4 text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {programLoading && programs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <Loader2 className="h-8 w-8 text-gray-800 animate-spin mx-auto" />
                        <p className="mt-2 text-sm text-gray-500">Loading programs...</p>
                      </td>
                    </tr>
                  ) : programs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <Trophy className="h-12 w-12 text-gray-300 mx-auto" />
                        <p className="mt-2 text-sm text-gray-500">No programs found</p>
                        <button
                          onClick={handleOpenProgramCreateModal}
                          className="mt-3 text-sm text-gray-800 hover:text-black font-medium"
                        >
                          Create your first program
                        </button>
                      </td>
                    </tr>
                  ) : (
                    programs.map((program) => (
                      <tr
                        key={program._id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="max-w-[300px]">
                            <p className="font-medium text-gray-900 truncate">{program.title}</p>
                            {program.description && (
                              <p className="text-xs text-gray-500 truncate mt-0.5">{program.description}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${typeColors[program.type]}`}>
                            {program.type === 'GSOS' ? 'General' : 'Intensive'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span className="text-sm">{program.durationDays} {program.durationDays === 1 ? 'day' : 'days'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${program.isActive ? statusColors.active : statusColors.inactive}`}>
                            {program.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleToggleProgramStatus(program)}
                              disabled={isSubmitting}
                              className={`p-2 rounded-lg transition-colors ${program.isActive ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                              title={program.isActive ? 'Set Inactive' : 'Set Active'}
                            >
                              {program.isActive ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                            </button>
                            <button
                              onClick={() => handleOpenProgramDetails(program)}
                              className="p-2 text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleOpenProgramEditModal(program)}
                              disabled={programDetailsLoading}
                              className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Edit program"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleOpenProgramDeleteDialog(program)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {programPagination.totalPages > 0 && (
              <Pagination
                currentPage={programPagination.currentPage}
                totalPages={programPagination.totalPages}
                totalItems={programPagination.totalCount}
                itemsPerPage={programPagination.limit}
                onPageChange={changeProgramPage}
                itemLabel="programs"
              />
            )}
          </div>

          {/* Programs Cards - Mobile */}
          <div className="md:hidden space-y-4">
            {programLoading && programs.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <Loader2 className="h-8 w-8 text-gray-800 animate-spin mx-auto" />
                <p className="mt-2 text-sm text-gray-500">Loading programs...</p>
              </div>
            ) : programs.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <Trophy className="h-12 w-12 text-gray-300 mx-auto" />
                <p className="mt-2 text-sm text-gray-500">No programs found</p>
                <button
                  onClick={handleOpenProgramCreateModal}
                  className="mt-3 text-sm text-gray-800 hover:text-black font-medium"
                >
                  Create your first program
                </button>
              </div>
            ) : (
              <>
                {programs.map((program) => (
                  <div key={program._id} className="bg-white rounded-xl shadow-sm p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeColors[program.type]}`}>
                            {program.type}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${program.isActive ? statusColors.active : statusColors.inactive}`}>
                            {program.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="font-medium text-gray-900 truncate">{program.title}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-xs text-gray-500">Duration</p>
                        <p className="font-semibold text-gray-900 text-sm">{program.durationDays} days</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-xs text-gray-500">Type</p>
                        <p className="font-semibold text-gray-900 text-sm">{program.type === 'GSOS' ? 'General' : 'Intensive'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => handleToggleProgramStatus(program)}
                        disabled={isSubmitting}
                        className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${program.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                      >
                        {program.isActive ? <><ToggleRight className="h-4 w-4" />Active</> : <><ToggleLeft className="h-4 w-4" />Inactive</>}
                      </button>
                      <button
                        onClick={() => handleOpenProgramDetails(program)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                      >
                        <Eye className="h-4 w-4" />Details
                      </button>
                      <button
                        onClick={() => handleOpenProgramEditModal(program)}
                        className="p-2 text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleOpenProgramDeleteDialog(program)}
                        className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {programPagination.totalPages > 0 && (
                  <div className="bg-white rounded-xl shadow-sm">
                    <Pagination
                      currentPage={programPagination.currentPage}
                      totalPages={programPagination.totalPages}
                      totalItems={programPagination.totalCount}
                      itemsPerPage={programPagination.limit}
                      onPageChange={changeProgramPage}
                      itemLabel="programs"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}

      {/* Quizzes Tab Content */}
      {activeMainTab === 'quizzes' && (
        <>
          {/* Quizzes Filters */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <select
                  value={localProgramFilter}
                  onChange={(e) => {
                    setLocalProgramFilter(e.target.value);
                    filterByProgram(e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
                >
                  <option value="">All Programs</option>
                  {programs.map((program) => (
                    <option key={program._id} value={program._id}>
                      {program.title} ({program.durationDays} days)
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => setShowQuizFilters(!showQuizFilters)}
                className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${hasActiveQuizFilters ? 'border-gray-800 bg-gray-50 text-gray-800' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              >
                <Filter className="h-4 w-4" />
                <span>Filters</span>
                {hasActiveQuizFilters && (
                  <span className="px-1.5 py-0.5 bg-gray-800 text-white text-xs rounded-full">
                    {(quizFilters.programId ? 1 : 0) + (quizFilters.isActive !== '' ? 1 : 0)}
                  </span>
                )}
                <ChevronDown className={`h-4 w-4 transition-transform ${showQuizFilters ? 'rotate-180' : ''}`} />
              </button>
              <button
                onClick={handleRefreshQuizzes}
                disabled={quizLoading}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${quizLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <div className="ml-auto text-sm text-gray-500">
                {quizPagination.totalCount} quiz{quizPagination.totalCount !== 1 ? 'zes' : ''} total
              </div>
            </div>

            {showQuizFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={localQuizActiveFilter}
                      onChange={(e) => setLocalQuizActiveFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-gray-800 outline-none"
                    >
                      <option value="">All Status</option>
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                  <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-3">
                    <button
                      onClick={handleApplyQuizFilters}
                      className="flex-1 sm:flex-none px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
                    >
                      Apply
                    </button>
                    <button
                      onClick={handleResetQuizFilters}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quizzes Table - Desktop */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Quiz</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Program</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Day</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Questions</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Points</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-600">Status</th>
                    <th className="text-right px-6 py-4 text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {quizLoading && quizzes.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <Loader2 className="h-8 w-8 text-gray-800 animate-spin mx-auto" />
                        <p className="mt-2 text-sm text-gray-500">Loading quizzes...</p>
                      </td>
                    </tr>
                  ) : quizzes.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <ClipboardList className="h-12 w-12 text-gray-300 mx-auto" />
                        <p className="mt-2 text-sm text-gray-500">No quizzes found</p>
                        <button
                          onClick={handleOpenQuizCreateModal}
                          className="mt-3 text-sm text-gray-800 hover:text-black font-medium"
                        >
                          Create your first quiz
                        </button>
                      </td>
                    </tr>
                  ) : (
                    quizzes.map((quiz) => (
                      <tr key={quiz._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="max-w-[200px]">
                            <p className="font-medium text-gray-900 truncate">{quiz.title}</p>
                            {quiz.description && <p className="text-xs text-gray-500 truncate mt-0.5">{quiz.description}</p>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-700 truncate max-w-[150px] block">{getProgramName(quiz.programId)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span className="text-sm font-medium">Day {quiz.dayNumber || '-'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <HelpCircle className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-700">{quiz.questions?.length || quiz.questionCount || 0}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <Target className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-700">{getTotalPoints(quiz)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${quiz.isActive ? statusColors.active : statusColors.inactive}`}>
                            {quiz.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => handleOpenQuizDetails(quiz)} className="p-2 text-gray-800 hover:bg-gray-50 rounded-lg transition-colors" title="View details">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleOpenQuizEditModal(quiz)} disabled={quizDetailsLoading} className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="Edit quiz">
                              <Edit className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleOpenQuizDeleteDialog(quiz)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {quizPagination.totalPages > 0 && (
              <Pagination
                currentPage={quizPagination.currentPage}
                totalPages={quizPagination.totalPages}
                totalItems={quizPagination.totalCount}
                itemsPerPage={quizPagination.limit}
                onPageChange={changeQuizPage}
                itemLabel="quizzes"
              />
            )}
          </div>

          {/* Quizzes Cards - Mobile */}
          <div className="md:hidden space-y-4">
            {quizLoading && quizzes.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <Loader2 className="h-8 w-8 text-gray-800 animate-spin mx-auto" />
                <p className="mt-2 text-sm text-gray-500">Loading quizzes...</p>
              </div>
            ) : quizzes.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                <ClipboardList className="h-12 w-12 text-gray-300 mx-auto" />
                <p className="mt-2 text-sm text-gray-500">No quizzes found</p>
                <button onClick={handleOpenQuizCreateModal} className="mt-3 text-sm text-gray-800 hover:text-black font-medium">
                  Create your first quiz
                </button>
              </div>
            ) : (
              <>
                {quizzes.map((quiz) => (
                  <div key={quiz._id} className="bg-white rounded-xl shadow-sm p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">Day {quiz.dayNumber || '-'}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${quiz.isActive ? statusColors.active : statusColors.inactive}`}>
                            {quiz.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <p className="font-medium text-gray-900 truncate">{quiz.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{getProgramName(quiz.programId)}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-xs text-gray-500">Questions</p>
                        <p className="font-semibold text-gray-900 text-sm">{quiz.questions?.length || quiz.questionCount || 0}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-xs text-gray-500">Total Points</p>
                        <p className="font-semibold text-gray-900 text-sm">{getTotalPoints(quiz)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                      <button onClick={() => handleOpenQuizDetails(quiz)} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                        <Eye className="h-4 w-4" />Details
                      </button>
                      <button onClick={() => handleOpenQuizEditModal(quiz)} className="p-2 text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleOpenQuizDeleteDialog(quiz)} className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {quizPagination.totalPages > 0 && (
                  <div className="bg-white rounded-xl shadow-sm">
                    <Pagination
                      currentPage={quizPagination.currentPage}
                      totalPages={quizPagination.totalPages}
                      totalItems={quizPagination.totalCount}
                      itemsPerPage={quizPagination.limit}
                      onPageChange={changeQuizPage}
                      itemLabel="quizzes"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}

      {/* Quiz Form Modal */}
      <SOSQuizForm
        isOpen={isQuizFormModalOpen}
        onClose={handleCloseQuizFormModal}
        onSubmit={handleQuizFormSubmit}
        isLoading={isSubmitting}
        serverError={formError}
        quizToEdit={quizToEdit}
        programs={programs}
      />

      {/* Quiz Details Modal */}
      <SOSQuizDetailsModal
        isOpen={isQuizDetailsModalOpen}
        onClose={handleCloseQuizDetailsModal}
        quiz={selectedQuiz}
        isLoading={quizDetailsLoading}
      />

      {/* Quiz Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isQuizDeleteDialogOpen}
        onClose={handleCloseQuizDeleteDialog}
        onConfirm={handleQuizDeleteConfirm}
        title="Delete Quiz"
        message={`Are you sure you want to delete the quiz "${selectedQuiz?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isSubmitting}
      />

      {/* Program Form Modal */}
      <SOSProgramForm
        isOpen={isProgramFormModalOpen}
        onClose={handleCloseProgramFormModal}
        onSubmit={handleProgramFormSubmit}
        isLoading={isSubmitting}
        serverError={formError}
        programToEdit={programToEdit}
      />

      {/* Program Details Modal */}
      <SOSProgramDetailsModal
        isOpen={isProgramDetailsModalOpen}
        onClose={handleCloseProgramDetailsModal}
        program={selectedProgram}
        isLoading={programDetailsLoading}
        onFetchStats={getProgramStats}
      />

      {/* Program Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isProgramDeleteDialogOpen}
        onClose={handleCloseProgramDeleteDialog}
        onConfirm={handleProgramDeleteConfirm}
        title="Delete Program"
        message={`Are you sure you want to delete the program "${selectedProgram?.title}"? This will also affect all associated quizzes and user progress.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isSubmitting}
      />
    </div>
  );
}

export default Quizes;
