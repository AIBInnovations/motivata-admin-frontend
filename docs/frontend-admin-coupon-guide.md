# Admin Frontend Guide: Membership Discount Coupon System

## Overview

This guide explains how to implement the admin panel functionality for creating and managing discount coupons that can be applied to membership purchases.

---

## Context

The backend now supports a coupon system for memberships with the following capabilities:
- Admin can create coupons that are applicable to memberships specifically (or all purchase types)
- Coupons have discount percentage, max discount cap, usage limits, validity dates
- Users can apply these coupons when purchasing memberships to get discounts

---

## API Endpoints (Admin)

### 1. Create Coupon
```
POST /api/web/coupons
Authorization: Bearer <admin_token>
Content-Type: application/json

Request Body:
{
  "code": "MEMBER50",                    // Required: Unique code (3-50 chars, auto-uppercased)
  "discountPercent": 50,                 // Required: 0-100
  "maxDiscountAmount": 500,              // Required: Max discount in INR
  "minPurchaseAmount": 100,              // Optional: Min purchase to use coupon (default: 0)
  "maxUsageLimit": 100,                  // Optional: Total uses allowed (null = unlimited)
  "maxUsagePerUser": 1,                  // Optional: Uses per user/phone (default: 1)
  "validFrom": "2024-01-01T00:00:00Z",   // Required: Start date (ISO format)
  "validUntil": "2024-12-31T23:59:59Z",  // Required: End date (must be after validFrom)
  "description": "50% off on memberships", // Optional: Description for reference
  "isActive": true,                      // Optional: Enable/disable (default: true)
  "applicableTo": ["MEMBERSHIP"]         // NEW: Where coupon can be used
}

// applicableTo options:
// - ["ALL"] - Works for events, memberships, sessions (default)
// - ["MEMBERSHIP"] - Only for membership purchases
// - ["EVENT"] - Only for event ticket purchases
// - ["SESSION"] - Only for session bookings
// - ["EVENT", "MEMBERSHIP"] - Multiple types allowed

Response (201):
{
  "success": true,
  "message": "Coupon created successfully",
  "data": {
    "coupon": {
      "_id": "...",
      "code": "MEMBER50",
      "discountPercent": 50,
      "maxDiscountAmount": 500,
      "applicableTo": ["MEMBERSHIP"],
      ...
    }
  }
}
```

### 2. Get All Coupons
```
GET /api/web/coupons?page=1&limit=10&isActive=true&search=MEMBER
Authorization: Bearer <admin_token>

Query Parameters:
- page: Page number (default: 1)
- limit: Items per page (default: 10, max: 100)
- sortBy: "code" | "discountPercent" | "validFrom" | "validUntil" | "createdAt"
- sortOrder: "asc" | "desc"
- isActive: true | false (filter by active status)
- search: Search in code and description

Response (200):
{
  "success": true,
  "data": {
    "coupons": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalCount": 50,
      "limit": 10
    }
  }
}
```

### 3. Get Coupon by ID
```
GET /api/web/coupons/:id
Authorization: Bearer <admin_token>
```

### 4. Update Coupon
```
PUT /api/web/coupons/:id
Authorization: Bearer <admin_token>

Request Body (all fields optional):
{
  "discountPercent": 40,
  "maxDiscountAmount": 400,
  "isActive": false,
  "applicableTo": ["MEMBERSHIP", "SESSION"]
}
```

### 5. Delete Coupon (Soft Delete)
```
DELETE /api/web/coupons/:id
Authorization: Bearer <admin_token>
```

### 6. Restore Deleted Coupon
```
POST /api/web/coupons/:id/restore
Authorization: Bearer <admin_token>
```

### 7. View Deleted Coupons
```
GET /api/web/coupons/deleted
Authorization: Bearer <admin_token>
```

---

## UI Components to Build

### 1. Coupon List Page (`/admin/coupons`)

**Features:**
- Table displaying all coupons with columns:
  - Code
  - Discount (show as "50% (max ₹500)")
  - Applicable To (show badges: "MEMBERSHIP", "EVENT", etc.)
  - Validity (show date range)
  - Usage (show "45/100" or "45/∞")
  - Status (Active/Inactive toggle)
  - Actions (Edit, Delete)
- Search bar to filter by code/description
- Filter dropdown for "Applicable To" types
- Pagination controls
- "Create Coupon" button

**Example Table Row:**
```
| MEMBER50 | 50% (max ₹500) | [MEMBERSHIP] | Jan 1 - Dec 31, 2024 | 45/100 | ✓ Active | Edit | Delete |
```

### 2. Create/Edit Coupon Form (`/admin/coupons/create` or `/admin/coupons/:id/edit`)

**Form Fields:**

```jsx
// Coupon Code
<TextField
  label="Coupon Code"
  required
  helperText="3-50 characters, will be auto-uppercased"
  inputProps={{ style: { textTransform: 'uppercase' } }}
/>

// Discount Settings
<TextField label="Discount Percentage" type="number" min={0} max={100} required />
<TextField label="Max Discount Amount (₹)" type="number" min={0} required />
<TextField label="Min Purchase Amount (₹)" type="number" min={0} defaultValue={0} />

// Usage Limits
<TextField
  label="Max Total Uses"
  type="number"
  min={1}
  helperText="Leave empty for unlimited"
/>
<TextField
  label="Max Uses Per User"
  type="number"
  min={1}
  defaultValue={1}
/>

// Validity Period
<DateTimePicker label="Valid From" required />
<DateTimePicker label="Valid Until" required />

// Applicable To (NEW - Important!)
<FormControl>
  <FormLabel>Applicable To</FormLabel>
  <CheckboxGroup>
    <Checkbox value="ALL" label="All (Events, Memberships, Sessions)" />
    <Checkbox value="EVENT" label="Events Only" />
    <Checkbox value="MEMBERSHIP" label="Memberships Only" />
    <Checkbox value="SESSION" label="Sessions Only" />
  </CheckboxGroup>
  <FormHelperText>Select where this coupon can be used</FormHelperText>
</FormControl>

// Description
<TextField label="Description" multiline rows={2} />

// Status
<Switch label="Active" defaultChecked />
```

**Validation Rules:**
- Code: Required, 3-50 chars
- Discount Percent: Required, 0-100
- Max Discount Amount: Required, >= 0
- Valid Until must be after Valid From
- At least one "Applicable To" option must be selected

### 3. Coupon Detail View (`/admin/coupons/:id`)

**Display:**
- All coupon details
- Usage statistics:
  - Total uses: 45
  - Remaining: 55
  - Unique users: 42
- Recent usage history (if tracking)

---

## Implementation Notes

### Handling "Applicable To" Field

**When Creating:**
```javascript
// If user selects "All", send ["ALL"]
// If user selects specific types, send array of those types
// Don't send both "ALL" and specific types

const getApplicableTo = (selections) => {
  if (selections.includes('ALL')) {
    return ['ALL'];
  }
  return selections.filter(s => s !== 'ALL');
};
```

**When Displaying:**
```javascript
// Show appropriate badges
const ApplicableToBadges = ({ types }) => {
  if (types.includes('ALL')) {
    return <Badge color="blue">All Types</Badge>;
  }
  return types.map(type => (
    <Badge key={type} color={getColorForType(type)}>
      {type}
    </Badge>
  ));
};

const getColorForType = (type) => {
  switch(type) {
    case 'MEMBERSHIP': return 'purple';
    case 'EVENT': return 'green';
    case 'SESSION': return 'orange';
    default: return 'gray';
  }
};
```

### Date Handling

```javascript
// Always send dates in ISO format
const formatDateForAPI = (date) => {
  return date.toISOString();
};

// Display dates in local timezone
const formatDateForDisplay = (isoString) => {
  return new Date(isoString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
```

### Error Handling

```javascript
// Common errors from API
const errorMessages = {
  'Coupon code already exists': 'This coupon code is already in use. Choose a different code.',
  'Valid until date must be after valid from date': 'End date must be after start date.',
};

const handleAPIError = (error) => {
  const message = error.response?.data?.message;
  return errorMessages[message] || message || 'Something went wrong';
};
```

---

## Example: Creating a Membership-Only Coupon

**Use Case:** Admin wants to create a "WELCOME2024" coupon that gives 30% off (max ₹200) on membership purchases only.

**API Call:**
```javascript
const createMembershipCoupon = async () => {
  const response = await fetch('/api/web/coupons', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      code: 'WELCOME2024',
      discountPercent: 30,
      maxDiscountAmount: 200,
      minPurchaseAmount: 0,
      maxUsageLimit: 500,
      maxUsagePerUser: 1,
      validFrom: '2024-01-01T00:00:00.000Z',
      validUntil: '2024-12-31T23:59:59.999Z',
      description: 'Welcome offer for new members - 30% off on first membership',
      isActive: true,
      applicableTo: ['MEMBERSHIP']  // <-- This is the key!
    })
  });

  return response.json();
};
```

---

## Sharing Coupons with Users

After creating a coupon, admin can share it with users via:
1. Email campaigns
2. SMS notifications
3. In-app banners
4. Social media posts
5. Physical promotional materials

The coupon code is what users will enter during checkout.

---

## Testing Checklist

- [ ] Create coupon with all fields
- [ ] Create coupon with minimum required fields
- [ ] Create membership-only coupon
- [ ] Edit coupon and change applicableTo
- [ ] Verify duplicate code is rejected
- [ ] Verify validUntil > validFrom validation
- [ ] Soft delete and restore coupon
- [ ] Search and filter coupons
- [ ] Pagination works correctly
