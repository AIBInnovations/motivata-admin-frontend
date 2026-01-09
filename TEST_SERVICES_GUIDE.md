# Service Testing Guide

## Overview
A comprehensive testing interface for validating both **Direct Purchase** and **Admin Approval** service flows in the Motivata admin panel.

## Access the Test Page

Navigate to: **[http://localhost:5173/test-services](http://localhost:5173/test-services)**

Or click **"Test Services"** in the sidebar (with test tube icon 🧪)

---

## Test Flows

### 1. 🚀 Direct Purchase Flow
**Purpose**: Test instant payment services that don't require admin approval

**Configuration**:
- `requiresApproval: false`
- Price: ₹999
- Duration: 30 days
- Category: COACHING

**User Experience**:
1. User browses service catalog
2. Clicks "Subscribe Now"
3. Gets immediate payment link
4. Completes payment
5. Subscription activated instantly

**What This Tests**:
- Service creation with `requiresApproval: false`
- Direct payment flow
- Immediate activation
- No admin intervention required

---

### 2. 🔒 Admin Approval Flow
**Purpose**: Test services that require admin review before purchase

**Configuration**:
- `requiresApproval: true`
- Price: ₹2999
- Duration: 60 days
- Category: CONSULTATION

**User Experience**:
1. User requests service
2. Request goes to admin for review
3. Admin approves/rejects request
4. Payment link sent after approval
5. User completes payment
6. Subscription activated

**What This Tests**:
- Service creation with `requiresApproval: true`
- Service request submission
- Admin approval workflow
- Post-approval payment
- Subscription activation after payment

---

## How to Use

### Run Individual Tests

1. **Test Direct Purchase Only**
   - Click the green "Test Direct Purchase" button
   - Creates a service with `requiresApproval: false`
   - Logs result below

2. **Test Admin Approval Only**
   - Click the amber "Test Admin Approval" button
   - Creates a service with `requiresApproval: true`
   - Logs result below

3. **Run Both Tests Sequentially**
   - Click the purple "Run Both Tests" button
   - Creates both services with 1s delay between
   - Logs all results below

### View Test Results

Each test result shows:
- ✅ **Status**: Success/Error
- ⏱️ **Timestamp**: When the test ran
- 📊 **Duration**: Response time in milliseconds
- 🔢 **Status Code**: HTTP response code (200, 201, 400, etc.)
- 📦 **Response Data**: Full API response (expandable)
- 🆔 **Created Service Details**: Service ID, name, price, approval requirement

### Clear Results

Click **"Clear Results"** button to remove all test logs

---

## API Endpoints Tested

### Service Creation
```
POST /api/web/services
```

**Request Body**:
```json
{
  "name": "Service Name",
  "description": "Full description",
  "shortDescription": "Brief description",
  "price": 999,
  "compareAtPrice": 1499,
  "durationInDays": 30,
  "category": "COACHING",
  "perks": ["Perk 1", "Perk 2"],
  "displayOrder": 1,
  "isFeatured": true,
  "isActive": true,
  "requiresApproval": false  // Key field for flow testing
}
```

**Success Response** (201):
```json
{
  "success": true,
  "message": "Service created successfully",
  "data": {
    "service": {
      "_id": "service_id_here",
      "name": "Service Name",
      "price": 999,
      "requiresApproval": false,
      // ... other fields
    }
  }
}
```

**Error Response** (400):
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "name",
      "message": "Name is required"
    }
  ]
}
```

---

## Testing Checklist

### ✅ Pre-Test Setup
- [ ] Backend server running on `http://192.168.29.69:5000`
- [ ] `.env` configured with `VITE_API_BASE_URL=http://192.168.29.69:5000/api`
- [ ] Admin logged in (JWT token in localStorage)
- [ ] Dev server running on `http://localhost:5173`

### ✅ Direct Purchase Test
- [ ] Service created successfully
- [ ] Response status is 200/201
- [ ] `requiresApproval` field is `false`
- [ ] Service appears in Services page
- [ ] Service shows "Direct Purchase" badge

### ✅ Admin Approval Test
- [ ] Service created successfully
- [ ] Response status is 200/201
- [ ] `requiresApproval` field is `true`
- [ ] Service appears in Services page
- [ ] Service shows "Requires Approval" badge

### ✅ Error Handling Test
- [ ] Test with invalid data (empty name)
- [ ] Test with invalid price (negative)
- [ ] Test without authentication
- [ ] Verify proper error messages displayed

---

## Common Issues

### 1. **ERR_BLOCKED_BY_CLIENT**
**Problem**: Browser extension blocking requests
**Solution**:
- Open incognito/private mode
- Disable ad blockers (uBlock Origin, AdBlock)
- Disable browser extensions

### 2. **401 Unauthorized**
**Problem**: Not logged in or token expired
**Solution**:
- Log in again at `/login`
- Check localStorage has valid token

### 3. **Network Error**
**Problem**: Backend not running or wrong URL
**Solution**:
- Verify backend is running: `http://192.168.29.69:5000`
- Check `.env` file has correct `VITE_API_BASE_URL`
- Restart dev server after `.env` changes

### 4. **CORS Error**
**Problem**: Backend CORS not configured
**Solution**:
- Backend must allow `http://localhost:5173`
- Check backend CORS configuration

---

## Next Steps After Testing

After successful test results:

1. **Navigate to Services Page**
   - View created test services
   - Verify they appear correctly
   - Check filtering and search

2. **Test User Flow** (in user app)
   - Direct purchase: User can buy immediately
   - Admin approval: User can request service

3. **Test Admin Operations**
   - Edit services
   - Toggle active/inactive
   - Change approval requirements
   - Delete services

4. **Test Service Requests Page**
   - View pending requests (for approval-required services)
   - Approve/reject requests
   - Send payment links

5. **Test Service Orders Page**
   - View completed purchases
   - Check order status
   - Verify subscription activation

---

## Development Notes

### Test Data
The test creates services with these details:

**Direct Purchase**:
- Name: "Premium Coaching - Direct"
- Price: ₹999 (Compare at: ₹1499)
- Duration: 30 days
- Category: COACHING
- Perks: Immediate activation, Direct payment link, No approval needed

**Admin Approval**:
- Name: "VIP Consultation - Admin Approved"
- Price: ₹2999 (Compare at: ₹3999)
- Duration: 60 days
- Category: CONSULTATION
- Perks: Admin review required, Payment link sent after approval, Premium access

### Modifying Test Data
To change test data, edit the state in [TestServices.jsx](src/pages/TestServices.jsx):
- `directPurchaseData` for direct purchase tests
- `approvalRequiredData` for admin approval tests

---

## Support

If you encounter issues:
1. Check browser console for errors
2. Check network tab for API requests
3. Verify backend logs
4. Review test results for error details

---

**Last Updated**: 2026-01-09
**Version**: 1.0.0
