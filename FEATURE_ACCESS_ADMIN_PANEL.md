# Admin Panel - Feature Access Management Guide

## Overview
This document explains how to integrate the Feature Request management system into the Motivata Admin Panel. Admins can:
1. **Manage Feature Pricing** - Create/edit pricing for individual features and bundles
2. **Review Feature Requests** - Approve or reject customer requests
3. **Send Payment Links** - Generate and send Razorpay payment links
4. **View User Feature Access** - See which users have access to which features

---

## New Admin Panel Sections Required

### 1. Feature Pricing Management
### 2. Feature Requests Queue
### 3. User Feature Access Viewer

---

## Section 1: Feature Pricing Management

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/web/feature-pricing` | GET | List all pricing options |
| `/api/web/feature-pricing` | POST | Create new pricing |
| `/api/web/feature-pricing/:id` | GET | Get single pricing |
| `/api/web/feature-pricing/:id` | PUT | Update pricing |
| `/api/web/feature-pricing/:id` | DELETE | Delete pricing (soft) |
| `/api/web/feature-pricing/:id/restore` | POST | Restore deleted pricing |

### Get All Pricing
**Request:** `GET /api/web/feature-pricing`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Params (optional):**
- `includeInactive=true` - Include inactive pricing
- `includeDeleted=true` - Include soft-deleted pricing

**Response:**
```json
{
  "success": true,
  "message": "Feature pricing fetched successfully",
  "data": {
    "pricing": [...],
    "individualFeatures": [
      {
        "_id": "abc123",
        "featureKey": "SOS",
        "name": "SOS Tab Access",
        "description": "Access to SOS quizzes and assessments",
        "price": 199,
        "compareAtPrice": 299,
        "durationInDays": 30,
        "isLifetime": false,
        "isBundle": false,
        "includedFeatures": [],
        "perks": ["Access to all SOS quizzes", "Progress tracking"],
        "displayOrder": 1,
        "isFeatured": true,
        "isActive": true,
        "isAvailable": true
      }
    ],
    "bundles": [
      {
        "_id": "def456",
        "featureKey": "SOS_CONNECT",
        "name": "SOS + Connect Bundle",
        "description": "Get both SOS and Connect access at a discounted price",
        "price": 349,
        "compareAtPrice": 398,
        "durationInDays": 30,
        "isBundle": true,
        "includedFeatures": ["SOS", "CONNECT"],
        "perks": ["Access to SOS", "Access to Connect", "Save ₹49"],
        "isFeatured": true
      }
    ],
    "total": 4
  }
}
```

### Create Pricing
**Request:** `POST /api/web/feature-pricing`

**Body:**
```json
{
  "featureKey": "SOS",
  "name": "SOS Tab Access",
  "description": "Access to SOS quizzes and assessments",
  "price": 199,
  "compareAtPrice": 299,
  "durationInDays": 30,
  "isBundle": false,
  "includedFeatures": [],
  "perks": ["Access to all SOS quizzes", "Progress tracking"],
  "displayOrder": 1,
  "isFeatured": true,
  "isActive": true
}
```

**For Bundle:**
```json
{
  "featureKey": "SOS_CONNECT",
  "name": "SOS + Connect Bundle",
  "description": "Get both SOS and Connect access",
  "price": 349,
  "compareAtPrice": 398,
  "durationInDays": 30,
  "isBundle": true,
  "includedFeatures": ["SOS", "CONNECT"],
  "perks": ["Access to SOS", "Access to Connect", "Save ₹49"],
  "displayOrder": 10,
  "isFeatured": true,
  "isActive": true
}
```

### Update Pricing
**Request:** `PUT /api/web/feature-pricing/:id`

**Body (partial update allowed):**
```json
{
  "price": 249,
  "isActive": false
}
```

### Delete Pricing
**Request:** `DELETE /api/web/feature-pricing/:id`

---

## Section 2: Feature Requests Queue

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/web/feature-requests` | GET | List all requests with filters |
| `/api/web/feature-requests/pending-count` | GET | Get pending request count |
| `/api/web/feature-requests/:id` | GET | Get single request details |
| `/api/web/feature-requests/:id/approve` | POST | Approve and send payment link |
| `/api/web/feature-requests/:id/reject` | POST | Reject request |
| `/api/web/feature-requests/:id/resend-link` | POST | Resend payment link |

### Get All Feature Requests
**Request:** `GET /api/web/feature-requests`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Query Params:**
- `page=1` - Page number (default: 1)
- `limit=20` - Items per page (default: 20)
- `status=PENDING` - Filter by status (PENDING, APPROVED, REJECTED, PAYMENT_SENT, COMPLETED)
- `featureKey=SOS` - Filter by feature
- `search=john` - Search by phone or name
- `sortBy=createdAt` - Sort field
- `sortOrder=desc` - Sort order

**Response:**
```json
{
  "success": true,
  "message": "Feature requests fetched successfully",
  "data": {
    "requests": [
      {
        "_id": "req123",
        "phone": "9876543210",
        "name": "John Doe",
        "requestedFeatures": [
          { "featureKey": "SOS" },
          { "featureKey": "CONNECT" }
        ],
        "requestedBundleId": null,
        "status": "PENDING",
        "reviewedBy": null,
        "reviewedAt": null,
        "rejectionReason": null,
        "adminNotes": null,
        "originalAmount": null,
        "paymentAmount": null,
        "couponCode": null,
        "discountPercent": 0,
        "discountAmount": 0,
        "paymentLinkId": null,
        "paymentUrl": null,
        "orderId": null,
        "createdAt": "2025-01-28T10:30:00.000Z",
        "updatedAt": "2025-01-28T10:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 100,
      "itemsPerPage": 20,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

### Get Pending Count (For Dashboard Badge)
**Request:** `GET /api/web/feature-requests/pending-count`

**Response:**
```json
{
  "success": true,
  "message": "Pending count fetched",
  "data": {
    "count": 12
  }
}
```

### Get Single Request Details
**Request:** `GET /api/web/feature-requests/:id`

**Response:**
```json
{
  "success": true,
  "message": "Feature request fetched successfully",
  "data": {
    "request": {
      "_id": "req123",
      "phone": "9876543210",
      "name": "John Doe",
      "requestedFeatures": [
        { "featureKey": "SOS" },
        { "featureKey": "CONNECT" }
      ],
      "requestedBundleId": null,
      "approvedFeatures": [],
      "status": "PENDING",
      "existingUserId": {
        "_id": "user456",
        "name": "John Doe",
        "phone": "9876543210"
      },
      "createdAt": "2025-01-28T10:30:00.000Z"
    }
  }
}
```

### Approve Feature Request
**Request:** `POST /api/web/feature-requests/:id/approve`

**Body:**
```json
{
  "features": ["SOS", "CONNECT"],
  "paymentAmount": 349,
  "durationInDays": 30,
  "adminNotes": "Customer verified via call",
  "sendWhatsApp": true,
  "couponCode": "WELCOME20"
}
```

**Parameters:**
- `features` (optional) - Array of features to grant. If not provided, uses requested features
- `paymentAmount` (optional) - Custom amount. If not provided, calculates from pricing
- `durationInDays` (optional) - Access duration. Default: 30 days. Use 0 or null for lifetime
- `adminNotes` (optional) - Internal notes
- `sendWhatsApp` (optional) - Send payment link via WhatsApp. Default: true
- `couponCode` (optional) - Coupon to apply

**Response:**
```json
{
  "success": true,
  "message": "Feature request approved. Payment link sent.",
  "data": {
    "request": {
      "_id": "req123",
      "status": "PAYMENT_SENT",
      "paymentUrl": "https://rzp.io/i/abc123",
      "paymentLinkId": "plink_abc123",
      "orderId": "FR_1706432400000_xyz789",
      "approvedFeatures": ["SOS", "CONNECT"],
      "paymentAmount": 349,
      "durationInDays": 30
    },
    "paymentLink": "https://rzp.io/i/abc123",
    "paymentLinkId": "plink_abc123",
    "whatsappSent": true,
    "pricing": {
      "originalAmount": 398,
      "couponCode": "WELCOME20",
      "discountPercent": 20,
      "discountAmount": 79.6,
      "finalAmount": 318.4
    }
  }
}
```

### Reject Feature Request
**Request:** `POST /api/web/feature-requests/:id/reject`

**Body:**
```json
{
  "rejectionReason": "Invalid phone number provided",
  "adminNotes": "Customer unreachable"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Feature request rejected.",
  "data": {
    "request": {
      "_id": "req123",
      "status": "REJECTED",
      "rejectionReason": "Invalid phone number provided",
      "reviewedBy": {
        "_id": "admin789",
        "name": "Admin User"
      },
      "reviewedAt": "2025-01-28T11:00:00.000Z"
    }
  }
}
```

### Resend Payment Link
**Request:** `POST /api/web/feature-requests/:id/resend-link`

**Response:**
```json
{
  "success": true,
  "message": "Payment link resent successfully.",
  "data": {
    "requestId": "req123",
    "paymentLink": "https://rzp.io/i/abc123"
  }
}
```

---

## UI Components Required

### 1. Feature Pricing Management Page

```
┌─────────────────────────────────────────────────────────────────┐
│  Feature Pricing                                    [+ Add New] │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ INDIVIDUAL FEATURES                                       │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │ SOS Tab        │ ₹199 │ 30 days │ Active  │ [Edit] [Del] │ │
│  │ Connect Tab    │ ₹199 │ 30 days │ Active  │ [Edit] [Del] │ │
│  │ Challenge Tab  │ ₹199 │ 30 days │ Active  │ [Edit] [Del] │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ BUNDLES                                                   │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │ SOS + Connect  │ ₹349 │ SOS, CONNECT │ Active │ [Edit]   │ │
│  │ All Access     │ ₹499 │ ALL THREE    │ Active │ [Edit]   │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Feature Requests Queue Page

```
┌─────────────────────────────────────────────────────────────────┐
│  Feature Requests                           🔴 12 Pending       │
├─────────────────────────────────────────────────────────────────┤
│  Status: [All ▼]  Feature: [All ▼]  Search: [________] [🔍]   │
├─────────────────────────────────────────────────────────────────┤
│  Phone       │ Name      │ Features      │ Status  │ Actions   │
├─────────────────────────────────────────────────────────────────┤
│  9876543210  │ John Doe  │ SOS, CONNECT  │ PENDING │ [View]    │
│  8765432109  │ Jane Doe  │ CHALLENGE     │ PAYMENT │ [View]    │
│  7654321098  │ Bob Smith │ SOS           │ DONE    │ [View]    │
└─────────────────────────────────────────────────────────────────┘
```

### 3. Feature Request Detail Modal / Page

```
┌─────────────────────────────────────────────────────────────────┐
│  Feature Request Details                              [✕ Close] │
├─────────────────────────────────────────────────────────────────┤
│  Customer: John Doe                                             │
│  Phone: 9876543210                                              │
│  Submitted: Jan 28, 2025 at 10:30 AM                           │
│  Status: PENDING                                                │
│                                                                 │
│  Requested Features:                                            │
│  ☑ SOS       (₹199)                                            │
│  ☑ CONNECT   (₹199)                                            │
│  ☐ CHALLENGE (₹199)                                            │
│                                                                 │
│  ─────────────────────────────────────────────────────────     │
│  APPROVE                                                        │
│  ─────────────────────────────────────────────────────────     │
│  Features to Grant: [SOS, CONNECT selected]                     │
│  Duration: [30 days ▼] or [Lifetime ☐]                         │
│  Payment Amount: [₹ 349    ] (auto-calculated)                 │
│  Coupon Code: [WELCOME20] [Apply]                              │
│  Admin Notes: [_______________________________]                 │
│  Send WhatsApp: [✓]                                            │
│                                                                 │
│  [Approve & Send Payment Link]                                  │
│                                                                 │
│  ─────────────────────────────────────────────────────────     │
│  REJECT                                                         │
│  ─────────────────────────────────────────────────────────     │
│  Rejection Reason: [Invalid phone number_____]                  │
│  Admin Notes: [_______________________________]                 │
│                                                                 │
│  [Reject Request]                                               │
└─────────────────────────────────────────────────────────────────┘
```

### 4. Dashboard Widget

```
┌─────────────────────────────────┐
│  Feature Requests               │
│  ──────────────────────────     │
│  🔴 12 Pending Requests         │
│  📤 5 Awaiting Payment          │
│  ✅ 45 Completed This Month     │
│                                 │
│  [View All Requests →]          │
└─────────────────────────────────┘
```

---

## Status Flow Diagram

```
                    ┌─────────┐
                    │ PENDING │
                    └────┬────┘
                         │
           ┌─────────────┴─────────────┐
           │                           │
           ▼                           ▼
    ┌────────────┐              ┌──────────┐
    │  APPROVED  │              │ REJECTED │
    └─────┬──────┘              └──────────┘
          │
          ▼
   ┌──────────────┐
   │ PAYMENT_SENT │ ◄──── [Resend Link]
   └──────┬───────┘
          │
          │ (Razorpay webhook)
          ▼
    ┌───────────┐
    │ COMPLETED │
    └───────────┘
```

---

## Implementation Checklist

### Feature Pricing Page
- [ ] List all pricing options (individual + bundles)
- [ ] Create new pricing form
- [ ] Edit pricing modal
- [ ] Delete (soft) with confirmation
- [ ] Toggle active/inactive status
- [ ] Restore deleted pricing

### Feature Requests Queue
- [ ] List with pagination
- [ ] Filter by status (PENDING, PAYMENT_SENT, COMPLETED, REJECTED)
- [ ] Filter by feature key
- [ ] Search by phone/name
- [ ] Pending count badge on sidebar

### Request Detail/Approval
- [ ] View request details
- [ ] Feature selection checkboxes
- [ ] Duration dropdown (7, 15, 30, 90 days, Lifetime)
- [ ] Payment amount input (auto-calculate from pricing)
- [ ] Coupon code input with apply button
- [ ] Admin notes textarea
- [ ] WhatsApp toggle
- [ ] Approve button
- [ ] Rejection reason input
- [ ] Reject button

### After Approval
- [ ] Show payment link (copyable)
- [ ] Resend link button
- [ ] Status badge updates

### Dashboard
- [ ] Pending requests count widget
- [ ] Quick link to requests queue

---

## Error Handling

All endpoints return errors in this format:
```json
{
  "success": false,
  "error": "Error message here",
  "status": 400
}
```

Common errors:
- `400` - Validation error (check required fields)
- `401` - Unauthorized (login required)
- `403` - Forbidden (admin access required)
- `404` - Request/Pricing not found
- `409` - Conflict (duplicate feature key)

---

## Contact
For questions about this integration, contact the backend team.
