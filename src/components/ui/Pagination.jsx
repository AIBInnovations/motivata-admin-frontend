import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Reusable Pagination Component
 * @param {Object} props
 * @param {number} props.currentPage - Current active page
 * @param {number} props.totalPages - Total number of pages
 * @param {number} props.totalItems - Total number of items
 * @param {number} props.itemsPerPage - Number of items per page
 * @param {Function} props.onPageChange - Callback when page changes
 * @param {string} props.itemLabel - Label for items (default: 'items')
 * @param {number} props.maxVisiblePages - Maximum number of page buttons to show (default: 5)
 */
function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  itemLabel = 'items',
  maxVisiblePages = 5,
}) {
  if (totalPages <= 0) return null;

  const startItem = totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Calculate which page numbers to show (fewer on mobile)
  const getPageNumbers = (max) => {
    const pages = [];
    let startPage = Math.max(1, currentPage - Math.floor(max / 2));
    let endPage = Math.min(totalPages, startPage + max - 1);

    // Adjust start if we're near the end
    if (endPage - startPage + 1 < max) {
      startPage = Math.max(1, endPage - max + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers(maxVisiblePages);
  const mobilePageNumbers = getPageNumbers(3); // Show fewer pages on mobile

  const goToPrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const goToNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const renderPageButtons = (pages, isMobile = false) => (
    <>
      {/* Show first page and ellipsis if needed */}
      {pages[0] > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className={`${isMobile ? 'w-7 h-7 text-xs' : 'w-8 h-8 text-sm'} rounded-lg text-gray-600 hover:bg-gray-100 transition-all`}
          >
            1
          </button>
          {pages[0] > 2 && (
            <span className={`${isMobile ? 'w-7 h-7' : 'w-8 h-8'} flex items-center justify-center text-gray-400 text-sm`}>...</span>
          )}
        </>
      )}

      {/* Page numbers */}
      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`${isMobile ? 'w-7 h-7 text-xs' : 'w-8 h-8 text-sm'} rounded-lg transition-all ${
            currentPage === page
              ? 'bg-gray-800 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          {page}
        </button>
      ))}

      {/* Show ellipsis and last page if needed */}
      {pages[pages.length - 1] < totalPages && (
        <>
          {pages[pages.length - 1] < totalPages - 1 && (
            <span className={`${isMobile ? 'w-7 h-7' : 'w-8 h-8'} flex items-center justify-center text-gray-400 text-sm`}>...</span>
          )}
          <button
            onClick={() => onPageChange(totalPages)}
            className={`${isMobile ? 'w-7 h-7 text-xs' : 'w-8 h-8 text-sm'} rounded-lg text-gray-600 hover:bg-gray-100 transition-all`}
          >
            {totalPages}
          </button>
        </>
      )}
    </>
  );

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200">
      {/* Item count info */}
      <p className="text-xs sm:text-sm text-gray-600 order-2 sm:order-1">
        <span className="hidden sm:inline">Showing </span>
        {startItem}-{endItem} of {totalItems} {itemLabel}
      </p>

      {/* Pagination controls */}
      <div className="flex items-center gap-1 sm:gap-2 order-1 sm:order-2">
        {/* Previous button */}
        <button
          onClick={goToPrevious}
          disabled={currentPage === 1}
          className={`p-1.5 sm:p-2 rounded-lg transition-all ${
            currentPage === 1
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>

        {/* Desktop page numbers */}
        <div className="hidden sm:flex items-center gap-1">
          {renderPageButtons(pageNumbers, false)}
        </div>

        {/* Mobile page numbers - simplified */}
        <div className="flex sm:hidden items-center gap-1">
          {renderPageButtons(mobilePageNumbers, true)}
        </div>

        {/* Next button */}
        <button
          onClick={goToNext}
          disabled={currentPage === totalPages}
          className={`p-1.5 sm:p-2 rounded-lg transition-all ${
            currentPage === totalPages
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      </div>
    </div>
  );
}

export default Pagination;
