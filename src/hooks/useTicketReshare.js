import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
  getTicketHolders,
  reshareTicket,
  bulkReshareTickets,
  getEventsForReshare,
} from '../services/ticketReshare.service';

// Filter options
export const ENROLLMENT_TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'ONLINE', label: 'Online' },
  { value: 'CASH', label: 'Cash' },
];

export const SCANNED_STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'false', label: 'Not Scanned' },
  { value: 'true', label: 'Scanned' },
];

export const SEND_VIA_OPTIONS = [
  { value: 'both', label: 'WhatsApp & Email' },
  { value: 'whatsapp', label: 'WhatsApp Only' },
  { value: 'email', label: 'Email Only' },
];

/**
 * Custom hook for managing ticket reshare functionality
 */
const useTicketReshare = () => {
  // Events state
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [eventData, setEventData] = useState(null);

  // Ticket holders state
  const [ticketHolders, setTicketHolders] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [eventsLoading, setEventsLoading] = useState(true);

  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 20,
  });

  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    enrollmentType: '',
    scannedStatus: '',
  });

  // Selection state for bulk operations
  const [selectedTickets, setSelectedTickets] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  // Reshare state
  const [reshareLoading, setReshareLoading] = useState({});
  const [bulkReshareLoading, setBulkReshareLoading] = useState(false);

  // Fetch events on mount
  useEffect(() => {
    fetchEvents();
  }, []);

  // Fetch ticket holders when event or filters change
  useEffect(() => {
    if (selectedEventId) {
      fetchTicketHolders();
    } else {
      setTicketHolders([]);
      setStatistics(null);
      setEventData(null);
    }
  }, [selectedEventId, pagination.currentPage, filters]);

  // Reset selection when data changes
  useEffect(() => {
    setSelectedTickets([]);
    setSelectAll(false);
  }, [ticketHolders]);

  /**
   * Fetch all events for selection
   */
  const fetchEvents = async () => {
    setEventsLoading(true);
    try {
      const response = await getEventsForReshare();
      if (response.success) {
        // Handle different response structures
        const eventsList = response.data?.events || response.data || [];
        setEvents(Array.isArray(eventsList) ? eventsList : []);
      } else {
        toast.error(response.message || 'Failed to load events');
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events');
    } finally {
      setEventsLoading(false);
    }
  };

  /**
   * Fetch ticket holders for selected event
   */
  const fetchTicketHolders = useCallback(async () => {
    if (!selectedEventId) return;

    setLoading(true);
    try {
      const response = await getTicketHolders(selectedEventId, {
        page: pagination.currentPage,
        limit: pagination.limit,
        search: filters.search || undefined,
        enrollmentType: filters.enrollmentType || undefined,
        scannedStatus: filters.scannedStatus || undefined,
      });

      if (response.success) {
        setTicketHolders(response.data.ticketHolders || []);
        setEventData(response.data.event || null);
        setStatistics(response.data.statistics || null);
        setPagination((prev) => ({
          ...prev,
          ...response.data.pagination,
        }));
      } else {
        toast.error(response.message || 'Failed to load ticket holders');
        setTicketHolders([]);
      }
    } catch (error) {
      console.error('Error fetching ticket holders:', error);
      toast.error('Failed to load ticket holders');
      setTicketHolders([]);
    } finally {
      setLoading(false);
    }
  }, [selectedEventId, pagination.currentPage, pagination.limit, filters]);

  /**
   * Handle event selection
   */
  const handleEventChange = (eventId) => {
    setSelectedEventId(eventId);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    setFilters({ search: '', enrollmentType: '', scannedStatus: '' });
  };

  /**
   * Handle filter changes
   */
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  /**
   * Handle search with debounce
   */
  const handleSearch = (searchTerm) => {
    setFilters((prev) => ({ ...prev, search: searchTerm }));
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  /**
   * Handle page change
   */
  const handlePageChange = (page) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
  };

  /**
   * Handle single ticket selection
   */
  const handleTicketSelect = (ticket) => {
    const ticketKey = `${ticket.enrollmentType}-${ticket.enrollmentId}`;
    setSelectedTickets((prev) => {
      const exists = prev.find(
        (t) => `${t.enrollmentType}-${t.enrollmentId}` === ticketKey
      );
      if (exists) {
        return prev.filter(
          (t) => `${t.enrollmentType}-${t.enrollmentId}` !== ticketKey
        );
      }
      return [...prev, ticket];
    });
  };

  /**
   * Handle select all toggle
   */
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedTickets([]);
    } else {
      setSelectedTickets([...ticketHolders]);
    }
    setSelectAll(!selectAll);
  };

  /**
   * Check if ticket is selected
   */
  const isTicketSelected = (ticket) => {
    return selectedTickets.some(
      (t) =>
        t.enrollmentType === ticket.enrollmentType &&
        t.enrollmentId === ticket.enrollmentId
    );
  };

  /**
   * Reshare single ticket
   */
  const handleReshareTicket = async (ticket, sendVia = 'both') => {
    const ticketKey = `${ticket.enrollmentType}-${ticket.enrollmentId}`;
    setReshareLoading((prev) => ({ ...prev, [ticketKey]: true }));

    try {
      const response = await reshareTicket(
        ticket.enrollmentType,
        ticket.enrollmentId,
        {
          phone: ticket.phone || ticket.user?.phone,
          sendVia,
        }
      );

      if (response.success) {
        toast.success('Ticket reshared successfully!');
        // Refresh the list to show updated scan status
        fetchTicketHolders();
      } else {
        toast.error(response.message || 'Failed to reshare ticket');
      }
    } catch (error) {
      console.error('Error resharing ticket:', error);
      toast.error('Failed to reshare ticket');
    } finally {
      setReshareLoading((prev) => ({ ...prev, [ticketKey]: false }));
    }
  };

  /**
   * Bulk reshare selected tickets
   */
  const handleBulkReshare = async (sendVia = 'whatsapp') => {
    if (selectedTickets.length === 0) {
      toast.warning('Please select tickets to reshare');
      return;
    }

    if (selectedTickets.length > 50) {
      toast.warning('Maximum 50 tickets can be reshared at once');
      return;
    }

    setBulkReshareLoading(true);

    try {
      const tickets = selectedTickets.map((ticket) => ({
        enrollmentType: ticket.enrollmentType,
        enrollmentId: ticket.enrollmentId,
        phone: ticket.phone || ticket.user?.phone,
      }));

      const response = await bulkReshareTickets(tickets, sendVia);

      if (response.success) {
        const { summary } = response.data;
        if (summary.failed > 0) {
          toast.warning(
            `Reshared ${summary.success} tickets. ${summary.failed} failed.`
          );
        } else {
          toast.success(`Successfully reshared ${summary.success} tickets!`);
        }
        setSelectedTickets([]);
        setSelectAll(false);
        fetchTicketHolders();
      } else {
        toast.error(response.message || 'Bulk reshare failed');
      }
    } catch (error) {
      console.error('Error in bulk reshare:', error);
      toast.error('Bulk reshare failed');
    } finally {
      setBulkReshareLoading(false);
    }
  };

  /**
   * Refresh data
   */
  const refresh = () => {
    if (selectedEventId) {
      fetchTicketHolders();
    }
  };

  return {
    // Data
    events,
    selectedEventId,
    eventData,
    ticketHolders,
    statistics,
    pagination,
    filters,

    // Loading states
    loading,
    eventsLoading,
    reshareLoading,
    bulkReshareLoading,

    // Selection
    selectedTickets,
    selectAll,
    isTicketSelected,

    // Actions
    handleEventChange,
    handleFilterChange,
    handleSearch,
    handlePageChange,
    handleTicketSelect,
    handleSelectAll,
    handleReshareTicket,
    handleBulkReshare,
    refresh,
  };
};

export default useTicketReshare;
