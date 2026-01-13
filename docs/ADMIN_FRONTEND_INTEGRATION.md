# Admin Frontend Integration Guide - 4-Date Event System

## Overview
The backend has been upgraded from a 2-date to a 4-date event system to properly separate event timing from booking windows. This document provides everything you need to integrate these changes into the Admin Frontend.

---

## What Changed?

### Old System (2 Dates)
- `startDate` - Event start date
- `endDate` - When bookings close/event ends

### New System (4 Dates)
- `startDate` - When the event actually starts (unchanged)
- `endDate` - When the event actually ends (unchanged)
- `bookingStartDate` - **NEW** - When users can start booking tickets
- `bookingEndDate` - **NEW** - When the booking window closes
- `duration` - Kept for backward compatibility (optional)

---

## Business Rules You Must Implement

### Date Constraints
1. ✅ `startDate` < `endDate` (event end must be after start)
2. ✅ `bookingStartDate` < `endDate` (booking must start before event ends)
3. ✅ `bookingEndDate` > `bookingStartDate` (booking end after start)
4. ✅ `bookingEndDate` ≤ `endDate` (booking must close before/when event ends)

### Visual Timeline
```
Timeline: bookingStart → eventStart → bookingEnd → eventEnd
          |             |            |             |
isLive:   TRUE ═════════════════════════════════════ FALSE
Booking:  ✓ ALLOWED ═════════════ ✗ BLOCKED
Visible:  ✓ VISIBLE TO USERS ══════════════════════
```

### Example Scenario
- `bookingStartDate`: Feb 1, 2026 (tickets go on sale)
- `eventStartDate`: March 15, 2026, 7 PM (concert starts)
- `bookingEndDate`: March 15, 2026, 6 PM (sales close 1 hour before)
- `eventEndDate`: March 15, 2026, 11 PM (concert ends)

**What Happens:**
- Feb 1 → March 15 6PM: Users can book tickets ✅
- March 15 6PM → 7PM: Event visible but booking blocked ⚠️
- March 15 7PM → 11PM: Event ongoing, no booking/cancellation 🎵
- After March 15 11PM: Event ends, `isLive=false` ❌

---

## API Changes

### 1. Create Event API
**Endpoint:** `POST /api/web/events`

**OLD Request Body:**
```json
{
  "name": "Tech Conference 2026",
  "description": "...",
  "startDate": "2026-03-15T09:00:00Z",
  "endDate": "2026-03-15T18:00:00Z",
  "category": "TECHNOLOGY",
  "mode": "OFFLINE",
  "city": "Mumbai",
  "price": 500
}
```

**NEW Request Body (REQUIRED FIELDS):**
```json
{
  "name": "Tech Conference 2026",
  "description": "...",
  "startDate": "2026-03-15T09:00:00Z",
  "endDate": "2026-03-15T18:00:00Z",
  "bookingStartDate": "2026-02-15T00:00:00Z",  // NEW - REQUIRED
  "bookingEndDate": "2026-03-15T17:00:00Z",    // NEW - REQUIRED
  "duration": 540,                              // Optional (minutes)
  "category": "TECHNOLOGY",
  "mode": "OFFLINE",
  "city": "Mumbai",
  "price": 500
}
```

**Validation Errors You'll Receive:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "bookingStartDate",
      "message": "Booking start date is required"
    },
    {
      "field": "bookingEndDate",
      "message": "Booking end date must be after booking start date"
    },
    {
      "field": "bookingEndDate",
      "message": "Booking end date cannot be after event end date"
    }
  ]
}
```

### 2. Update Event API
**Endpoint:** `PUT /api/web/events/:id`

You can now update booking dates independently:
```json
{
  "bookingStartDate": "2026-02-20T00:00:00Z",
  "bookingEndDate": "2026-03-15T15:00:00Z"
}
```

**Cross-field validation will trigger if:**
- `bookingEndDate` ≤ `bookingStartDate`
- `bookingEndDate` > `endDate`
- `bookingStartDate` ≥ `endDate`

### 3. Get Events API Response
**Endpoint:** `GET /api/web/events` or `GET /api/web/events/:id`

**Response Format:**
```json
{
  "success": true,
  "message": "Events retrieved successfully",
  "data": {
    "events": [
      {
        "_id": "...",
        "name": "Tech Conference 2026",
        "description": "...",
        "startDate": "2026-03-15T09:00:00Z",
        "endDate": "2026-03-15T18:00:00Z",
        "bookingStartDate": "2026-02-15T00:00:00Z",  // NEW
        "bookingEndDate": "2026-03-15T17:00:00Z",    // NEW
        "duration": 540,                              // Optional
        "isLive": true,
        "category": "TECHNOLOGY",
        "mode": "OFFLINE",
        "city": "Mumbai",
        "price": 500,
        "imageUrls": ["..."],
        "createdAt": "...",
        "updatedAt": "..."
      }
    ]
  }
}
```

---

## Frontend Implementation Tasks

### Task 1: Update Event Creation Form

**File:** Your event create/edit form component

**Add 4 Date Inputs:**
```jsx
// Example using React (adapt to your framework)
<form onSubmit={handleCreateEvent}>
  {/* Existing fields... */}

  {/* Event Dates Section */}
  <div className="section-header">Event Schedule</div>

  <DateTimePicker
    label="Event Start Date & Time *"
    value={eventStartDate}
    onChange={setEventStartDate}
    minDate={new Date()}
    helperText="When does the event actually begin?"
  />

  <DateTimePicker
    label="Event End Date & Time *"
    value={eventEndDate}
    onChange={setEventEndDate}
    minDate={eventStartDate}
    helperText="When does the event actually end?"
  />

  {/* Booking Window Section */}
  <div className="section-header">Booking Window</div>

  <DateTimePicker
    label="Booking Start Date & Time *"
    value={bookingStartDate}
    onChange={setBookingStartDate}
    maxDate={eventEndDate}
    helperText="When can users start booking tickets?"
  />

  <DateTimePicker
    label="Booking End Date & Time *"
    value={bookingEndDate}
    onChange={setBookingEndDate}
    minDate={bookingStartDate}
    maxDate={eventEndDate}
    helperText="When should ticket sales close?"
  />

  {/* Optional Duration */}
  <TextField
    label="Duration (minutes)"
    type="number"
    value={duration}
    onChange={(e) => setDuration(e.target.value)}
    helperText="Optional: Event duration in minutes"
  />
</form>
```

**Validation Logic:**
```javascript
const validateEventDates = (formData) => {
  const errors = {};

  const { startDate, endDate, bookingStartDate, bookingEndDate } = formData;

  // Required fields
  if (!startDate) errors.startDate = "Event start date is required";
  if (!endDate) errors.endDate = "Event end date is required";
  if (!bookingStartDate) errors.bookingStartDate = "Booking start date is required";
  if (!bookingEndDate) errors.bookingEndDate = "Booking end date is required";

  // Date logic validation
  if (endDate && startDate && new Date(endDate) <= new Date(startDate)) {
    errors.endDate = "Event end must be after start date";
  }

  if (bookingStartDate && endDate && new Date(bookingStartDate) >= new Date(endDate)) {
    errors.bookingStartDate = "Booking start must be before event end";
  }

  if (bookingEndDate && bookingStartDate && new Date(bookingEndDate) <= new Date(bookingStartDate)) {
    errors.bookingEndDate = "Booking end must be after booking start";
  }

  if (bookingEndDate && endDate && new Date(bookingEndDate) > new Date(endDate)) {
    errors.bookingEndDate = "Booking end cannot be after event end";
  }

  return errors;
};
```

### Task 2: Update Event List/Table View

**Add Columns:**
```jsx
// Example table columns
const columns = [
  { field: 'name', headerName: 'Event Name', width: 200 },
  {
    field: 'eventDates',
    headerName: 'Event Period',
    width: 250,
    renderCell: (params) => (
      <div>
        <div><strong>Start:</strong> {formatDate(params.row.startDate)}</div>
        <div><strong>End:</strong> {formatDate(params.row.endDate)}</div>
      </div>
    )
  },
  {
    field: 'bookingWindow',
    headerName: 'Booking Window',
    width: 250,
    renderCell: (params) => (
      <div>
        <div><strong>Opens:</strong> {formatDate(params.row.bookingStartDate)}</div>
        <div><strong>Closes:</strong> {formatDate(params.row.bookingEndDate)}</div>
      </div>
    )
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 150,
    renderCell: (params) => (
      <Chip
        label={getEventStatus(params.row)}
        color={getStatusColor(params.row)}
      />
    )
  }
];

// Helper to determine event status
const getEventStatus = (event) => {
  const now = new Date();
  const bookingStart = new Date(event.bookingStartDate);
  const bookingEnd = new Date(event.bookingEndDate);
  const eventStart = new Date(event.startDate);
  const eventEnd = new Date(event.endDate);

  if (now < bookingStart) return "Upcoming";
  if (now >= bookingStart && now <= bookingEnd) return "Booking Open";
  if (now > bookingEnd && now < eventStart) return "Booking Closed";
  if (now >= eventStart && now <= eventEnd) return "Ongoing";
  if (now > eventEnd) return "Completed";

  return "Unknown";
};

const getStatusColor = (event) => {
  const status = getEventStatus(event);
  const colorMap = {
    "Upcoming": "default",
    "Booking Open": "success",
    "Booking Closed": "warning",
    "Ongoing": "info",
    "Completed": "error"
  };
  return colorMap[status] || "default";
};
```

### Task 3: Update Event Details View

**Display All 4 Dates Clearly:**
```jsx
const EventDetailsView = ({ event }) => (
  <div className="event-details">
    <section className="dates-section">
      <h3>Event Schedule</h3>
      <div className="date-info">
        <CalendarIcon />
        <div>
          <strong>Event Starts:</strong>
          <p>{formatDateTime(event.startDate)}</p>
        </div>
      </div>
      <div className="date-info">
        <CalendarIcon />
        <div>
          <strong>Event Ends:</strong>
          <p>{formatDateTime(event.endDate)}</p>
        </div>
      </div>

      <h3>Booking Window</h3>
      <div className="date-info">
        <TicketIcon />
        <div>
          <strong>Booking Opens:</strong>
          <p>{formatDateTime(event.bookingStartDate)}</p>
        </div>
      </div>
      <div className="date-info">
        <TicketIcon />
        <div>
          <strong>Booking Closes:</strong>
          <p>{formatDateTime(event.bookingEndDate)}</p>
        </div>
      </div>

      {/* Status Badge */}
      <div className="status-badge">
        <StatusChip event={event} />
      </div>
    </section>
  </div>
);
```

### Task 4: Add Helpful UI Indicators

**Pre-filled Smart Defaults:**
```javascript
// When creating a new event, suggest smart defaults
const handleEventStartDateChange = (newStartDate) => {
  setEventStartDate(newStartDate);

  // Auto-suggest booking start as 30 days before event
  if (!bookingStartDate) {
    const suggestedBookingStart = new Date(newStartDate);
    suggestedBookingStart.setDate(suggestedBookingStart.getDate() - 30);
    setBookingStartDate(suggestedBookingStart);
  }

  // Auto-suggest booking end as 1 hour before event start
  if (!bookingEndDate) {
    const suggestedBookingEnd = new Date(newStartDate);
    suggestedBookingEnd.setHours(suggestedBookingEnd.getHours() - 1);
    setBookingEndDate(suggestedBookingEnd);
  }
};
```

**Visual Timeline Preview:**
```jsx
const TimelinePreview = ({ startDate, endDate, bookingStartDate, bookingEndDate }) => {
  return (
    <div className="timeline-preview">
      <h4>Event Timeline Preview</h4>
      <div className="timeline">
        <div className="timeline-point booking-start">
          <span>Booking Opens</span>
          <small>{formatDate(bookingStartDate)}</small>
        </div>
        <div className="timeline-line booking-period" />
        <div className="timeline-point event-start">
          <span>Event Starts</span>
          <small>{formatDate(startDate)}</small>
        </div>
        <div className="timeline-line event-period" />
        <div className="timeline-point booking-end">
          <span>Booking Closes</span>
          <small>{formatDate(bookingEndDate)}</small>
        </div>
        <div className="timeline-line remaining-period" />
        <div className="timeline-point event-end">
          <span>Event Ends</span>
          <small>{formatDate(endDate)}</small>
        </div>
      </div>
    </div>
  );
};
```

### Task 5: Handle Error Messages

**Display Backend Validation Errors:**
```javascript
const handleSubmit = async (formData) => {
  try {
    const response = await axios.post('/api/web/events', formData);
    // Success handling
    showSuccessToast('Event created successfully!');
    navigate('/events');
  } catch (error) {
    if (error.response?.data?.errors) {
      // Backend validation errors
      const errors = error.response.data.errors;
      errors.forEach(err => {
        setFieldError(err.field, err.message);
      });

      // Show summary toast
      showErrorToast(
        `Validation failed: ${errors.length} error(s) found. Please check the form.`
      );
    } else {
      showErrorToast('Failed to create event. Please try again.');
    }
  }
};
```

---

## Testing Checklist

### ✅ Create Event Form
- [ ] All 4 date fields are visible and labeled clearly
- [ ] Date pickers enforce min/max constraints
- [ ] Validation shows before API call (client-side)
- [ ] Backend validation errors display properly
- [ ] Form shows helpful tooltips/hints
- [ ] Smart defaults work (optional but recommended)

### ✅ Event List View
- [ ] Both booking window and event dates visible
- [ ] Status badge shows correct state
- [ ] Filtering/sorting works with new fields

### ✅ Event Details View
- [ ] All 4 dates displayed clearly
- [ ] Timeline/visual representation (optional)
- [ ] Current status visible

### ✅ Edit Event Form
- [ ] Pre-fills all 4 dates from existing event
- [ ] Allows updating booking dates independently
- [ ] Validates cross-field constraints

### ✅ Edge Cases
- [ ] Events created before migration show correctly
- [ ] Events with booking window closed but event ongoing
- [ ] Events where booking closes before event starts

---

## Common Pitfalls to Avoid

### ❌ DON'T DO THIS
```javascript
// Don't assume bookingEndDate = eventEndDate
const bookingEndDate = eventEndDate; // WRONG!

// Don't use endDate for booking logic
if (now > event.endDate) {
  showMessage("Booking closed"); // WRONG! Use bookingEndDate
}

// Don't allow bookingEndDate after eventEndDate
setBookingEndDate(someDateAfterEventEnd); // WILL FAIL VALIDATION
```

### ✅ DO THIS INSTEAD
```javascript
// Use separate fields
const bookingEndDate = event.bookingEndDate;
const eventEndDate = event.endDate;

// Use correct field for booking status
if (now > event.bookingEndDate) {
  showMessage("Booking closed");
}

// Enforce constraints in UI
<DatePicker
  maxDate={eventEndDate}
  value={bookingEndDate}
/>
```

---

## API Endpoints Reference

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/web/events` | POST | Admin | Create new event (requires all 4 dates) |
| `/api/web/events` | GET | Admin | List all events (includes 4 dates) |
| `/api/web/events/:id` | GET | Admin | Get event details (includes 4 dates) |
| `/api/web/events/:id` | PUT | Admin | Update event (can update dates independently) |
| `/api/web/events/:id` | DELETE | Admin | Soft delete event |
| `/api/web/events/update-expired` | POST | Admin | Manually trigger expired events update |

---

## Migration Notes

### Existing Events
All existing events have been automatically migrated:
- `bookingStartDate` = event's creation date (or now if past)
- `bookingEndDate` = old `endDate` value (preserves behavior)

When editing old events, the form should pre-fill these migrated values.

### Backward Compatibility
The `duration` field still exists for backward compatibility but is optional. You can:
- Keep it in the form (optional field)
- Auto-calculate it from startDate and endDate
- Remove it entirely (won't break anything)

---

## Support & Questions

If you encounter issues:
1. Check the backend validation error messages (they're descriptive)
2. Verify date relationships in your validation logic
3. Review this document's examples
4. Test with the example dates provided

**Backend Developer Contact:** [Your contact info]
**API Documentation:** [Link to Postman/Swagger]
**Migration Plan:** See `C:\Users\bhavy\.claude\plans\quizzical-herding-trinket.md`

---

## Quick Start Code Template

```javascript
// Complete example for creating an event
const CreateEventForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: null,
    endDate: null,
    bookingStartDate: null,
    bookingEndDate: null,
    duration: '',
    category: 'TECHNOLOGY',
    mode: 'OFFLINE',
    city: '',
    price: 0
  });

  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation
    const validationErrors = validateEventDates(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const response = await fetch('/api/web/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.errors) {
          // Map backend errors to form
          const backendErrors = {};
          errorData.errors.forEach(err => {
            backendErrors[err.field] = err.message;
          });
          setErrors(backendErrors);
        }
        return;
      }

      // Success!
      const data = await response.json();
      alert('Event created successfully!');
      // Redirect to events list

    } catch (error) {
      console.error('Failed to create event:', error);
      alert('An error occurred. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Your form fields here */}
    </form>
  );
};
```

---

**Document Version:** 1.0
**Last Updated:** January 2026
**Backend Migration Date:** [Date you ran the migration]
