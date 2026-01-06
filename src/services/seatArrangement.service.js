import { api, handleApiResponse } from './api.service';

const ENDPOINTS = {
  SEAT_ARRANGEMENT: '/web/events',
};

/**
 * Seat Arrangement Service
 * Handles seat arrangement CRUD for events
 */
const seatArrangementService = {
  /**
   * Create seat arrangement for an event
   * @param {string} eventId - Event ID
   * @param {Object} data - { imageUrl, seats: [{ label: 'A1' }, ...] }
   */
  createSeatArrangement: async (eventId, data) => {
    console.log('[SeatArrangementService] Creating seat arrangement for event:', eventId);
    return handleApiResponse(
      api.post(`${ENDPOINTS.SEAT_ARRANGEMENT}/${eventId}/seat-arrangement`, data)
    );
  },

  /**
   * Get seat arrangement for an event
   * @param {string} eventId - Event ID
   */
  getSeatArrangement: async (eventId) => {
    console.log('[SeatArrangementService] Fetching seat arrangement for event:', eventId);
    return handleApiResponse(
      api.get(`${ENDPOINTS.SEAT_ARRANGEMENT}/${eventId}/seat-arrangement`)
    );
  },

  /**
   * Update seat arrangement for an event
   * @param {string} eventId - Event ID
   * @param {Object} data - { imageUrl?, seats?: [{ label: 'A1' }, ...] }
   */
  updateSeatArrangement: async (eventId, data) => {
    console.log('[SeatArrangementService] Updating seat arrangement for event:', eventId);
    return handleApiResponse(
      api.put(`${ENDPOINTS.SEAT_ARRANGEMENT}/${eventId}/seat-arrangement`, data)
    );
  },

  /**
   * Delete seat arrangement for an event
   * @param {string} eventId - Event ID
   */
  deleteSeatArrangement: async (eventId) => {
    console.log('[SeatArrangementService] Deleting seat arrangement for event:', eventId);
    return handleApiResponse(
      api.delete(`${ENDPOINTS.SEAT_ARRANGEMENT}/${eventId}/seat-arrangement`)
    );
  },

  /**
   * Generate seat labels from a pattern
   * @param {string} pattern - e.g., "A1-A10" or "1-50"
   * @returns {string[]} - Array of seat labels
   */
  generateSeatLabels: (pattern) => {
    const labels = [];

    // Pattern: "A1-A10" or "A1-B5" (row-based)
    const rowPattern = /^([A-Z]+)(\d+)-([A-Z]+)(\d+)$/i;
    const rowMatch = pattern.match(rowPattern);

    if (rowMatch) {
      const [, startRow, startNum, endRow, endNum] = rowMatch;
      const startRowCode = startRow.toUpperCase().charCodeAt(0);
      const endRowCode = endRow.toUpperCase().charCodeAt(0);

      for (let row = startRowCode; row <= endRowCode; row++) {
        const rowLetter = String.fromCharCode(row);
        const maxNum = row === endRowCode ? parseInt(endNum) : parseInt(endNum);
        const minNum = row === startRowCode ? parseInt(startNum) : 1;

        for (let num = minNum; num <= maxNum; num++) {
          labels.push(`${rowLetter}${num}`);
        }
      }
      return labels;
    }

    // Pattern: "1-50" (simple numeric)
    const numericPattern = /^(\d+)-(\d+)$/;
    const numericMatch = pattern.match(numericPattern);

    if (numericMatch) {
      const [, start, end] = numericMatch;
      for (let i = parseInt(start); i <= parseInt(end); i++) {
        labels.push(String(i));
      }
      return labels;
    }

    // Pattern: comma-separated "A1,A2,A3,B1,B2"
    if (pattern.includes(',')) {
      return pattern.split(',').map(s => s.trim()).filter(Boolean);
    }

    // Single label
    return [pattern.trim()];
  },

  /**
   * Parse seat labels string input to array
   * Supports: "A1-A10, B1-B10", "1-50", or newline/semicolon separated
   * @param {string} input - User input string
   * @returns {Array<{label: string}>} - Array of seat objects
   */
  parseSeatLabels: (input) => {
    if (!input || !input.trim()) return [];

    const labels = new Set();

    // Split by newlines, semicolons, or commas (but only if not inside a range pattern)
    // First split by newlines/semicolons for separate patterns
    const lines = input.split(/[\n;]/).map(s => s.trim()).filter(Boolean);

    lines.forEach(line => {
      // Split by commas, but preserve range patterns like "A1-A10"
      const parts = line.split(',').map(s => s.trim()).filter(Boolean);

      parts.forEach(pattern => {
        // Check if it's a range pattern (contains hyphen with numbers on both sides)
        const isRangePattern = /^[A-Z]?\d+-[A-Z]?\d+$/i.test(pattern) ||
          /^[A-Z]+\d+-[A-Z]+\d+$/i.test(pattern);

        if (isRangePattern) {
          const generated = seatArrangementService.generateSeatLabels(pattern);
          generated.forEach(label => labels.add(label));
        } else {
          // Single label
          labels.add(pattern);
        }
      });
    });

    return Array.from(labels).map(label => ({ label }));
  },
};

export default seatArrangementService;
