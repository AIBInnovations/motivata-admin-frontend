# Membership Request API Documentation

## Overview

This API handles the admin-approval membership flow where users submit a request, admin reviews and approves with a payment link, and membership is granted upon payment completion.

---

## Endpoints

### 1. GET /api/web/membership-requests/plans

Get available membership plans for the public form dropdown.

**Auth:** None (public endpoint)

**Request:**

```
GET /api/web/membership-requests/plans
```

**Response:**

```json
{
  "status": 200,
  "message": "Membership plans fetched successfully",
  "error": null,
  "data": {
    "plans": [
      {
        "_id": "6789abc123def456789abc12",
        "name": "Gold Membership",
        "description": "Premium access to all events",
        "price": 2999,
        "compareAtPrice": 3999,
        "durationInDays": 365,
        "perks": ["Priority booking", "10% discount on events", "Exclusive access"],
        "isFeatured": true,
        "isAvailable": true
      },
      {
        "_id": "6789abc123def456789abc13",
        "name": "Silver Membership",
        "description": "Standard membership benefits",
        "price": 1499,
        "compareAtPrice": null,
        "durationInDays": 180,
        "perks": ["5% discount on events"],
        "isFeatured": false,
        "isAvailable": true
      }
    ]
  }
}
```

---

### 2. POST /api/web/membership-requests

Submit a new membership request from public form.

**Auth:** None (public endpoint)

**Request:**

```
POST /api/web/membership-requests
Content-Type: application/json

{
  "phone": "9876543210",
  "name": "Rahul Sharma",
  "requestedPlanId": "6789abc123def456789abc12"
}
```

Note: `requestedPlanId` is optional. User can submit without selecting a plan.

**Response (Success - 201):**

```json
{
  "status": 201,
  "message": "Membership request submitted successfully. You will be notified once reviewed.",
  "error": null,
  "data": {
    "requestId": "6789abc123def456789abc99",
    "status": "PENDING"
  }
}
```

**Response (Conflict - 409):**

```json
{
  "status": 409,
  "message": "You already have a pending membership request. Please wait for admin review.",
  "error": "You already have a pending membership request. Please wait for admin review.",
  "data": null
}
```

**Response (Validation Error - 422):**

```json
{
  "status": 422,
  "message": "Validation failed",
  "error": [
    {
      "field": "phone",
      "message": "Phone number must be 10-15 digits"
    }
  ],
  "data": null
}
```

---

### 3. GET /api/web/membership-requests/pending-count

Get count of pending requests for admin dashboard badge.

**Auth:** Required (Admin)

**Request:**

```
GET /api/web/membership-requests/pending-count
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3ODlhYmMxMjNkZWY0NTY3ODlhYmM3NyIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTczNjY3ODQwMH0.abc123xyz
```

**Response:**

```json
{
  "status": 200,
  "message": "Pending count fetched",
  "error": null,
  "data": {
    "count": 5
  }
}
```

---

### 4. GET /api/web/membership-requests

List all membership requests with filters and pagination.

**Auth:** Required (Admin)

**Request:**

```
GET /api/web/membership-requests?page=1&limit=20&status=PENDING&search=rahul&sortBy=createdAt&sortOrder=desc
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3ODlhYmMxMjNkZWY0NTY3ODlhYmM3NyIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTczNjY3ODQwMH0.abc123xyz
```

**Query Parameters:**

- page: number (default 1)
- limit: number (default 20, max 100)
- status: PENDING, APPROVED, REJECTED, PAYMENT_SENT, COMPLETED (optional)
- search: string - searches phone and name (optional)
- sortBy: createdAt, status, name (default createdAt)
- sortOrder: asc, desc (default desc)

**Response:**

```json
{
  "status": 200,
  "message": "Membership requests fetched successfully",
  "error": null,
  "data": {
    "requests": [
      {
        "_id": "6789abc123def456789abc99",
        "phone": "9876543210",
        "name": "Rahul Sharma",
        "requestedPlanId": {
          "_id": "6789abc123def456789abc12",
          "name": "Gold Membership",
          "price": 2999,
          "durationInDays": 365
        },
        "approvedPlanId": null,
        "status": "PENDING",
        "reviewedBy": null,
        "reviewedAt": null,
        "rejectionReason": null,
        "adminNotes": null,
        "paymentAmount": null,
        "paymentLinkId": null,
        "paymentUrl": null,
        "orderId": null,
        "existingUserId": {
          "_id": "6789abc123def456789abc55",
          "name": "Rahul Sharma",
          "email": "rahul@example.com",
          "phone": "9876543210",
          "enrollments": ["enrollment1", "enrollment2"]
        },
        "userMembershipId": null,
        "isDeleted": false,
        "createdAt": "2025-01-12T10:30:00.000Z",
        "updatedAt": "2025-01-12T10:30:00.000Z",
        "isExistingUser": true,
        "existingUserInfo": {
          "_id": "6789abc123def456789abc55",
          "name": "Rahul Sharma",
          "email": "rahul@example.com",
          "phone": "9876543210",
          "enrollmentCount": 2
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalCount": 1,
      "limit": 20,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
}
```

---

### 5. GET /api/web/membership-requests/:id

Get single membership request details.

**Auth:** Required (Admin)

**Request:**

```
GET /api/web/membership-requests/6789abc123def456789abc99
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3ODlhYmMxMjNkZWY0NTY3ODlhYmM3NyIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTczNjY3ODQwMH0.abc123xyz
```

**Response:**

```json
{
  "status": 200,
  "message": "Membership request fetched successfully",
  "error": null,
  "data": {
    "request": {
      "_id": "6789abc123def456789abc99",
      "phone": "9876543210",
      "name": "Rahul Sharma",
      "requestedPlanId": {
        "_id": "6789abc123def456789abc12",
        "name": "Gold Membership",
        "description": "Premium access to all events",
        "price": 2999,
        "durationInDays": 365,
        "perks": ["Priority booking", "10% discount on events"]
      },
      "approvedPlanId": null,
      "status": "PENDING",
      "reviewedBy": null,
      "reviewedAt": null,
      "existingUserId": {
        "_id": "6789abc123def456789abc55",
        "name": "Rahul Sharma",
        "email": "rahul@example.com",
        "phone": "9876543210",
        "createdAt": "2024-06-15T08:00:00.000Z"
      },
      "createdAt": "2025-01-12T10:30:00.000Z",
      "isExistingUser": true,
      "existingUserInfo": {
        "_id": "6789abc123def456789abc55",
        "name": "Rahul Sharma",
        "email": "rahul@example.com",
        "phone": "9876543210",
        "enrollmentCount": 2,
        "registeredAt": "2024-06-15T08:00:00.000Z"
      }
    }
  }
}
```

---

### 6. POST /api/web/membership-requests/:id/approve

Approve request, assign plan, set payment amount, and send payment link via WhatsApp.

**Auth:** Required (Admin)

**Request:**

```
POST /api/web/membership-requests/6789abc123def456789abc99/approve
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3ODlhYmMxMjNkZWY0NTY3ODlhYmM3NyIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTczNjY3ODQwMH0.abc123xyz
Content-Type: application/json

{
  "planId": "6789abc123def456789abc12",
  "paymentAmount": 2499,
  "adminNotes": "Giving 500 rupees discount as referred by existing member",
  "sendWhatsApp": true
}
```

**Request Body Fields:**

- planId: string (required) - MongoDB ObjectId of the membership plan
- paymentAmount: number (required) - Can differ from plan price for discounts
- adminNotes: string (optional) - Internal notes, max 500 chars
- sendWhatsApp: boolean (optional, default true) - Whether to send WhatsApp notification

**Response:**

```json
{
  "status": 200,
  "message": "Membership request approved. Payment link sent.",
  "error": null,
  "data": {
    "request": {
      "_id": "6789abc123def456789abc99",
      "phone": "9876543210",
      "name": "Rahul Sharma",
      "status": "PAYMENT_SENT",
      "approvedPlanId": {
        "_id": "6789abc123def456789abc12",
        "name": "Gold Membership",
        "price": 2999,
        "durationInDays": 365
      },
      "paymentAmount": 2499,
      "paymentLinkId": "plink_abc123xyz",
      "paymentUrl": "https://rzp.io/i/abc123",
      "orderId": "MR_1736678400000_abc123xyz",
      "reviewedBy": {
        "_id": "6789abc123def456789abc77",
        "name": "Admin User",
        "username": "admin"
      },
      "reviewedAt": "2025-01-12T11:00:00.000Z",
      "adminNotes": "Giving 500 rupees discount as referred by existing member"
    },
    "paymentLink": "https://rzp.io/i/abc123",
    "paymentLinkId": "plink_abc123xyz",
    "whatsappSent": true
  }
}
```

**Response (Bad Request - 400):**

```json
{
  "status": 400,
  "message": "Cannot approve request with status: PAYMENT_SENT. Only PENDING requests can be approved.",
  "error": "Cannot approve request with status: PAYMENT_SENT. Only PENDING requests can be approved.",
  "data": null
}
```

---

### 7. POST /api/web/membership-requests/:id/reject

Reject a membership request with reason.

**Auth:** Required (Admin)

**Request:**

```
POST /api/web/membership-requests/6789abc123def456789abc99/reject
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3ODlhYmMxMjNkZWY0NTY3ODlhYmM3NyIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTczNjY3ODQwMH0.abc123xyz
Content-Type: application/json

{
  "rejectionReason": "Incomplete information provided. Please resubmit with valid details.",
  "adminNotes": "Phone number seems incorrect"
}
```

**Request Body Fields:**

- rejectionReason: string (required) - Reason shown to user, max 500 chars
- adminNotes: string (optional) - Internal notes, max 500 chars

**Response:**

```json
{
  "status": 200,
  "message": "Membership request rejected",
  "error": null,
  "data": {
    "request": {
      "_id": "6789abc123def456789abc99",
      "phone": "9876543210",
      "name": "Rahul Sharma",
      "status": "REJECTED",
      "rejectionReason": "Incomplete information provided. Please resubmit with valid details.",
      "adminNotes": "Phone number seems incorrect",
      "reviewedBy": {
        "_id": "6789abc123def456789abc77",
        "name": "Admin User",
        "username": "admin"
      },
      "reviewedAt": "2025-01-12T11:00:00.000Z"
    }
  }
}
```

---

### 8. POST /api/web/membership-requests/:id/resend-link

Resend payment link via WhatsApp for already approved requests.

**Auth:** Required (Admin)

**Request:**

```
POST /api/web/membership-requests/6789abc123def456789abc99/resend-link
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3ODlhYmMxMjNkZWY0NTY3ODlhYmM3NyIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTczNjY3ODQwMH0.abc123xyz
```

**Response:**

```json
{
  "status": 200,
  "message": "Payment link resent successfully",
  "error": null,
  "data": {
    "paymentLink": "https://rzp.io/i/abc123"
  }
}
```

**Response (Bad Request - 400):**

```json
{
  "status": 400,
  "message": "Cannot resend link for request with status: PENDING. Only PAYMENT_SENT requests can have links resent.",
  "error": "Cannot resend link for request with status: PENDING. Only PAYMENT_SENT requests can have links resent.",
  "data": null
}
```

---

## Status Flow

```
PENDING --> (admin approves) --> PAYMENT_SENT --> (user pays) --> COMPLETED
PENDING --> (admin rejects) --> REJECTED
```

---

## Frontend Implementation Guide (React.js Admin Panel)

### API Service Setup

Create an API service file for membership requests:

```javascript
// services/membershipRequestService.js

import api from './api'; // your axios instance with auth interceptor

const BASE_URL = '/membership-requests';

export const membershipRequestService = {
  // Get plans for form (public)
  getPlansForForm: () => api.get(`${BASE_URL}/plans`),

  // Submit request (public)
  submitRequest: (data) => api.post(BASE_URL, data),

  // Get pending count (admin)
  getPendingCount: () => api.get(`${BASE_URL}/pending-count`),

  // Get all requests with filters (admin)
  getAllRequests: (params) => api.get(BASE_URL, { params }),

  // Get single request (admin)
  getRequestById: (id) => api.get(`${BASE_URL}/${id}`),

  // Approve request (admin)
  approveRequest: (id, data) => api.post(`${BASE_URL}/${id}/approve`, data),

  // Reject request (admin)
  rejectRequest: (id, data) => api.post(`${BASE_URL}/${id}/reject`, data),

  // Resend payment link (admin)
  resendPaymentLink: (id) => api.post(`${BASE_URL}/${id}/resend-link`),
};
```

### Dashboard Badge Component

Show pending count badge on sidebar menu item:

```javascript
// components/Sidebar/MembershipRequestBadge.jsx

import { useEffect, useState } from 'react';
import { membershipRequestService } from '../../services/membershipRequestService';

export default function MembershipRequestBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const response = await membershipRequestService.getPendingCount();
        setCount(response.data.data.count);
      } catch (error) {
        console.error('Failed to fetch pending count:', error);
      }
    };

    fetchCount();
    // Optionally poll every 30 seconds
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  if (count === 0) return null;

  return (
    <span className="badge badge-warning">{count}</span>
  );
}
```

### Requests List Page

```javascript
// pages/MembershipRequests/MembershipRequestsList.jsx

import { useEffect, useState } from 'react';
import { membershipRequestService } from '../../services/membershipRequestService';

export default function MembershipRequestsList() {
  const [requests, setRequests] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    status: '',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await membershipRequestService.getAllRequests(filters);
      setRequests(response.data.data.requests);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (page) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'PENDING': return 'badge-warning';
      case 'PAYMENT_SENT': return 'badge-info';
      case 'COMPLETED': return 'badge-success';
      case 'REJECTED': return 'badge-danger';
      default: return 'badge-secondary';
    }
  };

  return (
    <div className="membership-requests-list">
      <h1>Membership Requests</h1>

      {/* Filters */}
      <div className="filters">
        <input
          type="text"
          placeholder="Search by phone or name..."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
        />

        <select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
        >
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="PAYMENT_SENT">Payment Sent</option>
          <option value="COMPLETED">Completed</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {/* Requests Table */}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="requests-table">
          {requests.map((request) => (
            <div key={request._id} className="request-row">
              <div className="request-info">
                <span className="name">{request.name}</span>
                <span className="phone">{request.phone}</span>
                {request.isExistingUser && (
                  <span className="existing-user-badge">Existing User</span>
                )}
              </div>

              <div className="request-plan">
                {request.requestedPlanId?.name || 'No plan selected'}
              </div>

              <div className="request-status">
                <span className={`badge ${getStatusBadgeClass(request.status)}`}>
                  {request.status}
                </span>
              </div>

              <div className="request-date">
                {new Date(request.createdAt).toLocaleDateString()}
              </div>

              <div className="request-actions">
                <button onClick={() => openRequestModal(request)}>
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="pagination">
        <button
          disabled={!pagination.hasPrevPage}
          onClick={() => handlePageChange(pagination.currentPage - 1)}
        >
          Previous
        </button>
        <span>
          Page {pagination.currentPage} of {pagination.totalPages}
        </span>
        <button
          disabled={!pagination.hasNextPage}
          onClick={() => handlePageChange(pagination.currentPage + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
```

### Approval Modal Component

```javascript
// components/MembershipRequests/ApprovalModal.jsx

import { useState, useEffect } from 'react';
import { membershipRequestService } from '../../services/membershipRequestService';

export default function ApprovalModal({ request, onClose, onSuccess }) {
  const [plans, setPlans] = useState([]);
  const [formData, setFormData] = useState({
    planId: request.requestedPlanId?._id || '',
    paymentAmount: '',
    adminNotes: '',
    sendWhatsApp: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await membershipRequestService.getPlansForForm();
        setPlans(response.data.data.plans);

        // Set default payment amount based on selected plan
        if (request.requestedPlanId?._id) {
          const plan = response.data.data.plans.find(
            (p) => p._id === request.requestedPlanId._id
          );
          if (plan) {
            setFormData((prev) => ({ ...prev, paymentAmount: plan.price }));
          }
        }
      } catch (err) {
        console.error('Failed to fetch plans:', err);
      }
    };

    fetchPlans();
  }, [request]);

  const handlePlanChange = (planId) => {
    const plan = plans.find((p) => p._id === planId);
    setFormData((prev) => ({
      ...prev,
      planId,
      paymentAmount: plan?.price || '',
    }));
  };

  const handleApprove = async () => {
    if (!formData.planId) {
      setError('Please select a membership plan');
      return;
    }
    if (!formData.paymentAmount || formData.paymentAmount < 0) {
      setError('Please enter a valid payment amount');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await membershipRequestService.approveRequest(request._id, formData);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Approve Membership Request</h2>

        {/* Request Info */}
        <div className="request-summary">
          <p><strong>Name:</strong> {request.name}</p>
          <p><strong>Phone:</strong> {request.phone}</p>
          {request.isExistingUser && (
            <div className="existing-user-info">
              <p><strong>Existing User</strong></p>
              <p>Email: {request.existingUserInfo?.email}</p>
              <p>Enrollments: {request.existingUserInfo?.enrollmentCount}</p>
            </div>
          )}
        </div>

        {/* Form */}
        <div className="form-group">
          <label>Membership Plan *</label>
          <select
            value={formData.planId}
            onChange={(e) => handlePlanChange(e.target.value)}
          >
            <option value="">Select a plan</option>
            {plans.map((plan) => (
              <option key={plan._id} value={plan._id}>
                {plan.name} - Rs. {plan.price} ({plan.durationInDays} days)
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Payment Amount (Rs.) *</label>
          <input
            type="number"
            min="0"
            value={formData.paymentAmount}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                paymentAmount: parseFloat(e.target.value) || '',
              }))
            }
          />
          <small>You can adjust for discounts</small>
        </div>

        <div className="form-group">
          <label>Admin Notes (optional)</label>
          <textarea
            value={formData.adminNotes}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, adminNotes: e.target.value }))
            }
            maxLength={500}
            placeholder="Internal notes..."
          />
        </div>

        <div className="form-group checkbox">
          <label>
            <input
              type="checkbox"
              checked={formData.sendWhatsApp}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  sendWhatsApp: e.target.checked,
                }))
              }
            />
            Send payment link via WhatsApp
          </label>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="modal-actions">
          <button onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            onClick={handleApprove}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Approving...' : 'Approve and Send Link'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

### Rejection Modal Component

```javascript
// components/MembershipRequests/RejectionModal.jsx

import { useState } from 'react';
import { membershipRequestService } from '../../services/membershipRequestService';

export default function RejectionModal({ request, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    rejectionReason: '',
    adminNotes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleReject = async () => {
    if (!formData.rejectionReason.trim()) {
      setError('Rejection reason is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await membershipRequestService.rejectRequest(request._id, formData);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>Reject Membership Request</h2>

        <div className="request-summary">
          <p><strong>Name:</strong> {request.name}</p>
          <p><strong>Phone:</strong> {request.phone}</p>
        </div>

        <div className="form-group">
          <label>Rejection Reason *</label>
          <textarea
            value={formData.rejectionReason}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                rejectionReason: e.target.value,
              }))
            }
            maxLength={500}
            placeholder="Reason for rejection (will be visible to user)..."
            required
          />
        </div>

        <div className="form-group">
          <label>Admin Notes (optional)</label>
          <textarea
            value={formData.adminNotes}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, adminNotes: e.target.value }))
            }
            maxLength={500}
            placeholder="Internal notes..."
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="modal-actions">
          <button onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            onClick={handleReject}
            disabled={loading}
            className="btn-danger"
          >
            {loading ? 'Rejecting...' : 'Reject Request'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

### Resend Link Handler

```javascript
// In your list or detail component

const handleResendLink = async (requestId) => {
  if (!window.confirm('Resend payment link via WhatsApp?')) return;

  try {
    const response = await membershipRequestService.resendPaymentLink(requestId);
    alert('Payment link resent successfully');
    // Optionally show the link: response.data.data.paymentLink
  } catch (error) {
    alert(error.response?.data?.message || 'Failed to resend link');
  }
};
```

### Key Implementation Notes

1. The public form (for users) should be on a separate public route without authentication. Call `getPlansForForm()` on mount and `submitRequest()` on form submit.

2. For the admin list page, implement debounced search to avoid too many API calls while typing.

3. Show the "Existing User" indicator prominently - this helps admin know if the requester is already in the system.

4. When approving, pre-fill the payment amount with the selected plan's price, but allow admin to modify it for discounts.

5. The "Resend Link" button should only appear for requests with status "PAYMENT_SENT".

6. Payment completion happens automatically via webhook. You do not need to implement any frontend logic for this. Just refresh the list or poll periodically to see status updates.

7. Consider adding a toast notification system for success/error messages instead of alerts.

8. For real-time updates, you can either poll the pending count every 30 seconds or implement WebSocket integration if available.
