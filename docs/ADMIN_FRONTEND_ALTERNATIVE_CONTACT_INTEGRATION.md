# Admin Frontend Integration Guide: Alternative Contact for Payment Links

## Table of Contents
1. [Overview](#overview)
2. [Feature Scope](#feature-scope)
3. [UI/UX Requirements](#uiux-requirements)
4. [API Integration](#api-integration)
5. [Field Validations](#field-validations)
6. [Response Handling](#response-handling)
7. [Error Handling](#error-handling)
8. [Testing Scenarios](#testing-scenarios)
9. [Examples](#examples)

---

## Overview

This feature allows admins to specify alternative phone numbers and/or email addresses when approving membership requests or service requests. Payment links can be sent to:
- **Registered contact only** (default/existing behavior)
- **Alternative contact only**
- **Both registered AND alternative contacts**

### Key Characteristics
- **Transaction-specific**: Alternative contacts are stored per transaction, NOT in user profile
- **Multi-channel**: Supports WhatsApp (for phone numbers) and Email
- **Flexible routing**: Multi-select checkboxes allow choosing where to send
- **Graceful failure**: Payment link generation succeeds even if notifications fail

---

## Feature Scope

### Where to Implement

#### 1. Membership Request Approval Page
**Route**: `/admin/membership-requests/:id/approve` (or similar)

**Current Flow**:
- Admin selects plan
- Admin sets payment amount
- Admin clicks "Approve & Send Payment Link"

**New Fields to Add**:
- Alternative Phone Number (optional)
- Alternative Email (optional)
- Contact Preference (multi-select checkboxes)

#### 2. Service Request Approval Page
**Route**: `/admin/service-requests/:id/approve` (or similar)

**Current Flow**:
- Admin reviews service request
- Admin clicks "Approve & Send Payment Link"

**New Fields to Add**:
- Alternative Phone Number (optional)
- Alternative Email (optional)
- Contact Preference (multi-select checkboxes)

---

## UI/UX Requirements

### Field Layout

Add a new section titled **"Payment Link Delivery"** or **"Notification Settings"** in the approval modal/form.

#### Recommended Layout:

```
┌─────────────────────────────────────────────────────┐
│  Payment Link Delivery                               │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Alternative Phone Number (Optional)                │
│  ┌─────────────────────────────────────────────┐   │
│  │ 9876543210                                   │   │
│  └─────────────────────────────────────────────┘   │
│  ℹ 10-digit Indian phone number                     │
│                                                      │
│  Alternative Email (Optional)                       │
│  ┌─────────────────────────────────────────────┐   │
│  │ alternative@example.com                      │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
│  Send Payment Link To:                              │
│  ☑ Registered contact (9123456789)                  │
│  ☑ Alternative contact                              │
│                                                      │
│  [ Cancel ]                    [ Approve & Send ]   │
└─────────────────────────────────────────────────────┘
```

### Field Details

#### 1. Alternative Phone Number
- **Type**: Text input
- **Label**: "Alternative Phone Number (Optional)"
- **Placeholder**: "9876543210"
- **Help Text**: "10-digit Indian phone number without country code"
- **Validation**:
  - Optional (can be empty)
  - If provided: Exactly 10 digits
  - No special characters or spaces
  - Pattern: `/^\d{10}$/`

#### 2. Alternative Email
- **Type**: Email input
- **Label**: "Alternative Email (Optional)"
- **Placeholder**: "alternative@example.com"
- **Help Text**: "Payment link will be sent to this email address"
- **Validation**:
  - Optional (can be empty)
  - If provided: Valid email format
  - Pattern: `/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/`

#### 3. Contact Preference (Multi-select Checkboxes)
- **Type**: Multi-select checkboxes (NOT radio buttons)
- **Label**: "Send Payment Link To:"
- **Options**:
  - ☑ Registered contact (show the actual phone number from request: e.g., "9123456789")
  - ☑ Alternative contact (only enabled if alternative phone OR email is filled)

**Behavior**:
- **Default**: "Registered contact" is checked by default
- **At least one required**: User must select at least one option
- **Disable alternative if empty**: If neither alternative phone nor email is provided, the "Alternative contact" checkbox should be disabled
- **Dynamic label**: Show the registered phone number in the label for clarity

### Interaction Flow

1. **Page Load**:
   - Alternative phone and email fields are empty
   - "Registered contact" checkbox is checked by default
   - "Alternative contact" checkbox is unchecked and disabled

2. **User enters alternative phone**:
   - "Alternative contact" checkbox becomes enabled
   - User can now check "Alternative contact" to send to both

3. **User unchecks "Registered contact"**:
   - If "Alternative contact" is not checked, show validation error: "At least one contact must be selected"
   - Prevent form submission

4. **Form submission**:
   - Validate all fields
   - Show loading state on "Approve & Send" button
   - Disable all inputs during submission

---

## API Integration

### 1. Membership Request Approval

#### Endpoint
```
POST /api/web/membership-requests/:id/approve
```

#### Request Headers
```json
{
  "Authorization": "Bearer <admin_token>",
  "Content-Type": "application/json"
}
```

#### Request Body (Existing + New Fields)
```javascript
{
  // Existing fields (keep these)
  "planId": "507f1f77bcf86cd799439011",
  "paymentAmount": 5000,
  "adminNotes": "Approved with discount",
  "sendWhatsApp": true,
  "couponCode": "WELCOME10",

  // NEW FIELDS
  "alternativePhone": "9876543210",        // Optional, string, 10 digits
  "alternativeEmail": "alt@example.com",   // Optional, string, valid email
  "contactPreference": ["REGISTERED", "ALTERNATIVE"]  // Array of strings
}
```

#### Contact Preference Values
- `["REGISTERED"]` - Send only to registered phone (default)
- `["ALTERNATIVE"]` - Send only to alternative phone/email
- `["REGISTERED", "ALTERNATIVE"]` - Send to both

#### Response (Success - 200 OK)
```json
{
  "success": true,
  "message": "Membership request approved. Payment link sent.",
  "data": {
    "request": {
      "_id": "...",
      "phone": "9123456789",
      "name": "John Doe",
      "status": "PAYMENT_SENT",
      "alternativePhone": "9876543210",
      "alternativeEmail": "alt@example.com",
      "contactPreference": ["REGISTERED", "ALTERNATIVE"],
      "paymentUrl": "https://rzp.io/l/xyz123",
      "paymentAmount": 5000,
      "approvedPlanId": {
        "name": "Premium Membership",
        "price": 5000
      }
    },
    "paymentLink": "https://rzp.io/l/xyz123",
    "paymentLinkId": "plink_abc123",
    "notifications": {
      "whatsapp": {
        "sent": ["9123456789", "9876543210"],  // Successfully sent
        "failed": []                            // Failed sends
      },
      "email": {
        "sent": ["alt@example.com"],
        "failed": []
      }
    },
    "pricing": {
      "originalAmount": 5000,
      "couponCode": "WELCOME10",
      "discountPercent": 10,
      "discountAmount": 500,
      "finalAmount": 4500
    }
  }
}
```

### 2. Service Request Approval

#### Endpoint
```
POST /api/web/service-requests/:id/approve
```

#### Request Headers
```json
{
  "Authorization": "Bearer <admin_token>",
  "Content-Type": "application/json"
}
```

#### Request Body (Existing + New Fields)
```javascript
{
  // Existing fields
  "adminNotes": "Approved",
  "sendWhatsApp": true,

  // NEW FIELDS
  "alternativePhone": "9876543210",
  "alternativeEmail": "alt@example.com",
  "contactPreference": ["REGISTERED", "ALTERNATIVE"]
}
```

#### Response (Success - 200 OK)
```json
{
  "success": true,
  "message": "Service request approved successfully",
  "data": {
    "request": {
      "_id": "...",
      "phone": "9123456789",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "status": "APPROVED",
      "services": [
        {
          "serviceName": "Yoga Class",
          "price": 3000
        }
      ],
      "totalAmount": 3000
    },
    "serviceOrder": {
      "_id": "...",
      "orderId": "SVC_ABC123",
      "alternativePhone": "9876543210",
      "alternativeEmail": "alt@example.com",
      "contactPreference": ["REGISTERED", "ALTERNATIVE"]
    },
    "paymentLink": "https://rzp.io/l/xyz456",
    "notifications": {
      "whatsapp": {
        "sent": ["9123456789", "9876543210"],
        "failed": []
      },
      "email": {
        "sent": ["jane@example.com", "alt@example.com"],
        "failed": []
      }
    }
  }
}
```

---

## Field Validations

### Frontend Validations (Before API Call)

#### Alternative Phone Number
```javascript
function validateAlternativePhone(phone) {
  if (!phone) return { valid: true }; // Optional field

  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');

  // Check if exactly 10 digits
  if (cleaned.length !== 10) {
    return {
      valid: false,
      error: 'Phone number must be exactly 10 digits'
    };
  }

  return { valid: true, value: cleaned };
}
```

#### Alternative Email
```javascript
function validateAlternativeEmail(email) {
  if (!email) return { valid: true }; // Optional field

  // Email regex
  const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;

  if (!emailRegex.test(email)) {
    return {
      valid: false,
      error: 'Please enter a valid email address'
    };
  }

  return { valid: true, value: email.toLowerCase().trim() };
}
```

#### Contact Preference
```javascript
function validateContactPreference(preference, hasAlternative) {
  // Must have at least one selection
  if (!preference || preference.length === 0) {
    return {
      valid: false,
      error: 'Please select at least one contact to send the payment link'
    };
  }

  // If ALTERNATIVE is selected, must have alternative phone or email
  if (preference.includes('ALTERNATIVE') && !hasAlternative) {
    return {
      valid: false,
      error: 'Please provide alternative phone or email to send to alternative contact'
    };
  }

  return { valid: true };
}
```

### Complete Form Validation Example
```javascript
function validatePaymentLinkForm(formData) {
  const errors = {};

  // Validate alternative phone
  if (formData.alternativePhone) {
    const phoneValidation = validateAlternativePhone(formData.alternativePhone);
    if (!phoneValidation.valid) {
      errors.alternativePhone = phoneValidation.error;
    }
  }

  // Validate alternative email
  if (formData.alternativeEmail) {
    const emailValidation = validateAlternativeEmail(formData.alternativeEmail);
    if (!emailValidation.valid) {
      errors.alternativeEmail = emailValidation.error;
    }
  }

  // Check if alternative contact is provided
  const hasAlternative = Boolean(formData.alternativePhone || formData.alternativeEmail);

  // Validate contact preference
  const prefValidation = validateContactPreference(
    formData.contactPreference,
    hasAlternative
  );
  if (!prefValidation.valid) {
    errors.contactPreference = prefValidation.error;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}
```

---

## Response Handling

### Success Response

When the approval is successful, you'll receive a `notifications` object in the response that shows which notifications were sent successfully and which failed.

#### Display Success Message
Show a success toast/alert with details:

```javascript
function handleApprovalSuccess(response) {
  const { notifications, paymentLink } = response.data;

  // Build success message
  let message = 'Membership request approved! Payment link created.';

  if (notifications) {
    const whatsappSent = notifications.whatsapp.sent.length;
    const emailSent = notifications.email.sent.length;
    const whatsappFailed = notifications.whatsapp.failed.length;
    const emailFailed = notifications.email.failed.length;

    // Add notification details
    if (whatsappSent > 0) {
      message += `\n✓ WhatsApp sent to ${whatsappSent} number(s)`;
    }
    if (emailSent > 0) {
      message += `\n✓ Email sent to ${emailSent} address(es)`;
    }

    // Show warnings for failures
    if (whatsappFailed > 0 || emailFailed > 0) {
      message += `\n⚠ Some notifications failed to send`;
    }
  }

  // Show success toast
  showToast('success', message);

  // Redirect or refresh
  redirectToMembershipRequests();
}
```

#### Notification Status Display
Consider showing a detailed notification status modal:

```
┌─────────────────────────────────────────────┐
│  Payment Link Sent Successfully             │
├─────────────────────────────────────────────┤
│                                             │
│  Payment Link: https://rzp.io/l/xyz123     │
│  [Copy Link]                                │
│                                             │
│  Notifications:                             │
│                                             │
│  WhatsApp:                                  │
│  ✓ 9123456789 (Registered)                 │
│  ✓ 9876543210 (Alternative)                │
│                                             │
│  Email:                                     │
│  ✓ alt@example.com (Alternative)           │
│                                             │
│  [ Close ]                                  │
└─────────────────────────────────────────────┘
```

### Partial Failure Handling

If some notifications fail but the payment link is created:

```javascript
function handlePartialFailure(response) {
  const { notifications, paymentLink } = response.data;

  const failedContacts = [
    ...notifications.whatsapp.failed.map(f => ({
      type: 'WhatsApp',
      contact: f.recipient,
      error: f.error
    })),
    ...notifications.email.failed.map(f => ({
      type: 'Email',
      contact: f.recipient,
      error: f.error
    }))
  ];

  // Show warning modal
  showWarningModal({
    title: 'Payment Link Created with Notification Issues',
    message: `Payment link was created successfully, but some notifications failed to send.`,
    details: failedContacts,
    paymentLink: paymentLink,
    actions: [
      {
        label: 'Copy Payment Link',
        action: () => copyToClipboard(paymentLink)
      },
      {
        label: 'Resend Notifications',
        action: () => resendNotifications(failedContacts)
      },
      {
        label: 'Close',
        action: () => closeModal()
      }
    ]
  });
}
```

---

## Error Handling

### Backend Error Responses

#### 1. Validation Error (400 Bad Request)
```json
{
  "success": false,
  "message": "Invalid alternative phone number",
  "error": "Alternative phone must be exactly 10 digits"
}
```

**Display**: Show error toast and highlight the specific field

#### 2. Request Not Found (404 Not Found)
```json
{
  "success": false,
  "message": "Membership request not found"
}
```

**Display**: Show error toast and redirect to requests list

#### 3. Invalid Status (400 Bad Request)
```json
{
  "success": false,
  "message": "Cannot approve request with status: APPROVED. Only PENDING requests can be approved."
}
```

**Display**: Show error modal explaining the request has already been processed

#### 4. Server Error (500 Internal Server Error)
```json
{
  "success": false,
  "message": "Failed to approve membership request",
  "error": "Database connection error"
}
```

**Display**: Show generic error message and allow retry

### Frontend Error Handling Example

```javascript
async function approveMembershipRequest(requestId, formData) {
  try {
    // Show loading state
    setLoading(true);

    // Make API call
    const response = await axios.post(
      `/api/web/membership-requests/${requestId}/approve`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Handle success
    handleApprovalSuccess(response.data);

  } catch (error) {
    // Handle different error types
    if (error.response) {
      // Server responded with error
      const { status, data } = error.response;

      switch (status) {
        case 400:
          // Validation error
          showErrorToast(data.message || 'Invalid input. Please check your entries.');
          break;

        case 404:
          // Not found
          showErrorToast('Request not found. It may have been deleted.');
          setTimeout(() => redirectToMembershipRequests(), 2000);
          break;

        case 500:
          // Server error
          showErrorToast('Server error. Please try again later.');
          break;

        default:
          showErrorToast('An unexpected error occurred.');
      }
    } else if (error.request) {
      // No response received
      showErrorToast('Network error. Please check your connection.');
    } else {
      // Request setup error
      showErrorToast('An error occurred. Please try again.');
    }
  } finally {
    setLoading(false);
  }
}
```

---

## Testing Scenarios

### Manual Testing Checklist

#### Membership Request Approval

**Test Case 1: Send to registered contact only (default)**
- [ ] Leave alternative fields empty
- [ ] Keep "Registered contact" checked
- [ ] Submit approval
- [ ] Verify WhatsApp sent to registered phone
- [ ] Verify response shows notification sent

**Test Case 2: Send to alternative phone only**
- [ ] Enter valid alternative phone: `9876543210`
- [ ] Uncheck "Registered contact"
- [ ] Check "Alternative contact"
- [ ] Submit approval
- [ ] Verify WhatsApp sent only to alternative phone
- [ ] Verify response shows correct notification status

**Test Case 3: Send to both registered and alternative**
- [ ] Enter alternative phone: `9876543210`
- [ ] Check both "Registered contact" and "Alternative contact"
- [ ] Submit approval
- [ ] Verify WhatsApp sent to both numbers
- [ ] Verify response shows both notifications sent

**Test Case 4: Send to alternative email**
- [ ] Enter valid alternative email: `test@example.com`
- [ ] Uncheck "Registered contact"
- [ ] Check "Alternative contact"
- [ ] Submit approval
- [ ] Verify email sent to alternative address
- [ ] Verify response shows email notification

**Test Case 5: Send to both phone and email**
- [ ] Enter alternative phone: `9876543210`
- [ ] Enter alternative email: `test@example.com`
- [ ] Check both options
- [ ] Submit approval
- [ ] Verify both WhatsApp and email sent
- [ ] Verify response shows all notifications

**Test Case 6: Invalid phone number**
- [ ] Enter invalid phone: `123` (too short)
- [ ] Try to submit
- [ ] Verify validation error shows
- [ ] Verify form doesn't submit

**Test Case 7: Invalid email**
- [ ] Enter invalid email: `notanemail`
- [ ] Try to submit
- [ ] Verify validation error shows
- [ ] Verify form doesn't submit

**Test Case 8: No contact selected**
- [ ] Uncheck all checkboxes
- [ ] Try to submit
- [ ] Verify validation error: "At least one contact must be selected"
- [ ] Verify form doesn't submit

**Test Case 9: Alternative selected but no contact provided**
- [ ] Leave alternative fields empty
- [ ] Uncheck "Registered contact"
- [ ] Check "Alternative contact"
- [ ] Verify validation error
- [ ] Verify form doesn't submit

**Test Case 10: Partial notification failure**
- [ ] Enter invalid alternative phone (backend will fail)
- [ ] Check both options
- [ ] Submit approval
- [ ] Verify approval succeeds
- [ ] Verify response shows mixed notification results
- [ ] Verify UI shows warning about failed notifications

**Test Case 11: Backward compatibility**
- [ ] Leave all alternative fields empty
- [ ] Use default "Registered contact" only
- [ ] Submit approval
- [ ] Verify works exactly like before (no breaking changes)

#### Service Request Approval

Repeat similar test cases as above for service request approval page.

### Edge Cases to Test

1. **Very long phone number**: Enter `12345678901234` - should truncate/validate
2. **Phone with spaces**: Enter `98765 43210` - should remove spaces
3. **Phone with country code**: Enter `+919876543210` - should handle correctly
4. **Email with spaces**: Enter ` test@example.com ` - should trim
5. **Email with uppercase**: Enter `TEST@EXAMPLE.COM` - should convert to lowercase
6. **Special characters in phone**: Enter `(987) 654-3210` - should remove special chars
7. **Network timeout**: Test with slow network - should show loading state and handle timeout
8. **Concurrent approvals**: Approve same request twice quickly - should handle gracefully

---

## Examples

### React Component Example

```jsx
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';

function MembershipApprovalModal({ request, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    planId: '',
    paymentAmount: '',
    adminNotes: '',
    sendWhatsApp: true,
    alternativePhone: '',
    alternativeEmail: '',
    contactPreference: ['REGISTERED'], // Default
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Validate alternative phone
  const validatePhone = (phone) => {
    if (!phone) return null;
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length !== 10) {
      return 'Phone number must be exactly 10 digits';
    }
    return null;
  };

  // Validate alternative email
  const validateEmail = (email) => {
    if (!email) return null;
    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return null;
  };

  // Handle contact preference change
  const handleContactPreferenceChange = (value) => {
    const currentPreference = formData.contactPreference;

    if (currentPreference.includes(value)) {
      // Remove if already selected
      const newPreference = currentPreference.filter(v => v !== value);
      // Ensure at least one is selected
      if (newPreference.length === 0) {
        toast.error('At least one contact must be selected');
        return;
      }
      setFormData({ ...formData, contactPreference: newPreference });
    } else {
      // Add to selection
      setFormData({
        ...formData,
        contactPreference: [...currentPreference, value]
      });
    }
  };

  // Check if alternative contact is provided
  const hasAlternativeContact = Boolean(
    formData.alternativePhone || formData.alternativeEmail
  );

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate fields
    const newErrors = {};

    if (formData.alternativePhone) {
      const phoneError = validatePhone(formData.alternativePhone);
      if (phoneError) newErrors.alternativePhone = phoneError;
    }

    if (formData.alternativeEmail) {
      const emailError = validateEmail(formData.alternativeEmail);
      if (emailError) newErrors.alternativeEmail = emailError;
    }

    // Validate contact preference
    if (formData.contactPreference.length === 0) {
      newErrors.contactPreference = 'At least one contact must be selected';
    }

    if (formData.contactPreference.includes('ALTERNATIVE') && !hasAlternativeContact) {
      newErrors.contactPreference = 'Provide alternative phone or email to send to alternative contact';
    }

    // If there are errors, don't submit
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Clear errors
    setErrors({});
    setLoading(true);

    try {
      // Prepare request body
      const requestBody = {
        planId: formData.planId,
        paymentAmount: formData.paymentAmount,
        adminNotes: formData.adminNotes,
        sendWhatsApp: formData.sendWhatsApp,
      };

      // Add alternative fields if provided
      if (formData.alternativePhone) {
        requestBody.alternativePhone = formData.alternativePhone.replace(/\D/g, '');
      }
      if (formData.alternativeEmail) {
        requestBody.alternativeEmail = formData.alternativeEmail.toLowerCase().trim();
      }
      requestBody.contactPreference = formData.contactPreference;

      // Make API call
      const response = await axios.post(
        `/api/web/membership-requests/${request._id}/approve`,
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Handle success
      const { notifications, paymentLink } = response.data.data;

      // Build success message
      let message = 'Membership request approved!';
      if (notifications) {
        const whatsappSent = notifications.whatsapp.sent.length;
        const emailSent = notifications.email.sent.length;
        const whatsappFailed = notifications.whatsapp.failed.length;
        const emailFailed = notifications.email.failed.length;

        if (whatsappSent > 0) {
          message += `\n✓ WhatsApp sent to ${whatsappSent} number(s)`;
        }
        if (emailSent > 0) {
          message += `\n✓ Email sent to ${emailSent} address(es)`;
        }
        if (whatsappFailed > 0 || emailFailed > 0) {
          message += `\n⚠ Some notifications failed`;
        }
      }

      toast.success(message);
      onSuccess(response.data.data);
      onClose();

    } catch (error) {
      console.error('Approval error:', error);

      if (error.response) {
        const { status, data } = error.response;

        switch (status) {
          case 400:
            toast.error(data.message || 'Invalid input');
            break;
          case 404:
            toast.error('Request not found');
            setTimeout(() => onClose(), 2000);
            break;
          case 500:
            toast.error('Server error. Please try again.');
            break;
          default:
            toast.error('An error occurred');
        }
      } else if (error.request) {
        toast.error('Network error. Check your connection.');
      } else {
        toast.error('An error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Approve Membership Request</h2>

        <form onSubmit={handleSubmit}>
          {/* Existing fields (plan selection, amount, etc.) */}

          {/* NEW SECTION: Payment Link Delivery */}
          <div className="form-section">
            <h3>Payment Link Delivery</h3>

            {/* Alternative Phone */}
            <div className="form-group">
              <label htmlFor="alternativePhone">
                Alternative Phone Number (Optional)
              </label>
              <input
                type="text"
                id="alternativePhone"
                value={formData.alternativePhone}
                onChange={(e) => setFormData({
                  ...formData,
                  alternativePhone: e.target.value
                })}
                placeholder="9876543210"
                maxLength={10}
                className={errors.alternativePhone ? 'error' : ''}
              />
              <small className="help-text">
                10-digit Indian phone number without country code
              </small>
              {errors.alternativePhone && (
                <span className="error-message">{errors.alternativePhone}</span>
              )}
            </div>

            {/* Alternative Email */}
            <div className="form-group">
              <label htmlFor="alternativeEmail">
                Alternative Email (Optional)
              </label>
              <input
                type="email"
                id="alternativeEmail"
                value={formData.alternativeEmail}
                onChange={(e) => setFormData({
                  ...formData,
                  alternativeEmail: e.target.value
                })}
                placeholder="alternative@example.com"
                className={errors.alternativeEmail ? 'error' : ''}
              />
              <small className="help-text">
                Payment link will be sent to this email address
              </small>
              {errors.alternativeEmail && (
                <span className="error-message">{errors.alternativeEmail}</span>
              )}
            </div>

            {/* Contact Preference */}
            <div className="form-group">
              <label>Send Payment Link To:</label>

              <div className="checkbox-group">
                {/* Registered Contact */}
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.contactPreference.includes('REGISTERED')}
                    onChange={() => handleContactPreferenceChange('REGISTERED')}
                  />
                  <span>
                    Registered contact ({request.phone})
                  </span>
                </label>

                {/* Alternative Contact */}
                <label
                  className={`checkbox-label ${!hasAlternativeContact ? 'disabled' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={formData.contactPreference.includes('ALTERNATIVE')}
                    onChange={() => handleContactPreferenceChange('ALTERNATIVE')}
                    disabled={!hasAlternativeContact}
                  />
                  <span>
                    Alternative contact
                    {!hasAlternativeContact && ' (provide phone or email above)'}
                  </span>
                </label>
              </div>

              {errors.contactPreference && (
                <span className="error-message">{errors.contactPreference}</span>
              )}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? 'Approving...' : 'Approve & Send'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MembershipApprovalModal;
```

### Notification Results Display Component

```jsx
function NotificationResultsModal({ notifications, paymentLink, onClose }) {
  const whatsappSent = notifications?.whatsapp?.sent || [];
  const whatsappFailed = notifications?.whatsapp?.failed || [];
  const emailSent = notifications?.email?.sent || [];
  const emailFailed = notifications?.email?.failed || [];

  const hasFailures = whatsappFailed.length > 0 || emailFailed.length > 0;

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>
          {hasFailures ? '⚠ Partial Success' : '✓ Success'}
        </h2>

        <div className="notification-results">
          {/* Payment Link */}
          <div className="result-section">
            <h3>Payment Link</h3>
            <div className="payment-link-display">
              <input
                type="text"
                value={paymentLink}
                readOnly
                className="payment-link-input"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(paymentLink);
                  toast.success('Link copied!');
                }}
                className="btn btn-sm"
              >
                Copy
              </button>
            </div>
          </div>

          {/* WhatsApp Results */}
          {(whatsappSent.length > 0 || whatsappFailed.length > 0) && (
            <div className="result-section">
              <h3>WhatsApp Notifications</h3>

              {whatsappSent.map((phone, index) => (
                <div key={index} className="result-item success">
                  <span className="icon">✓</span>
                  <span>{phone}</span>
                </div>
              ))}

              {whatsappFailed.map((failure, index) => (
                <div key={index} className="result-item error">
                  <span className="icon">✗</span>
                  <span>{failure.recipient}</span>
                  <small className="error-text">{failure.error}</small>
                </div>
              ))}
            </div>
          )}

          {/* Email Results */}
          {(emailSent.length > 0 || emailFailed.length > 0) && (
            <div className="result-section">
              <h3>Email Notifications</h3>

              {emailSent.map((email, index) => (
                <div key={index} className="result-item success">
                  <span className="icon">✓</span>
                  <span>{email}</span>
                </div>
              ))}

              {emailFailed.map((failure, index) => (
                <div key={index} className="result-item error">
                  <span className="icon">✗</span>
                  <span>{failure.recipient}</span>
                  <small className="error-text">{failure.error}</small>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button onClick={onClose} className="btn btn-primary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## CSS Styling Examples

```css
/* Payment Link Delivery Section */
.form-section {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
  background-color: #f9f9f9;
}

.form-section h3 {
  margin-top: 0;
  margin-bottom: 16px;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

/* Form Groups */
.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #555;
}

.form-group input[type="text"],
.form-group input[type="email"] {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #4CAF50;
}

.form-group input.error {
  border-color: #f44336;
}

/* Help Text */
.help-text {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #777;
}

/* Error Messages */
.error-message {
  display: block;
  margin-top: 4px;
  color: #f44336;
  font-size: 13px;
}

/* Checkbox Group */
.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.checkbox-label:hover:not(.disabled) {
  background-color: #f0f0f0;
}

.checkbox-label.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background-color: #fafafa;
}

.checkbox-label input[type="checkbox"] {
  margin-right: 10px;
  cursor: pointer;
}

.checkbox-label.disabled input[type="checkbox"] {
  cursor: not-allowed;
}

/* Notification Results */
.notification-results {
  margin: 20px 0;
}

.result-section {
  margin-bottom: 24px;
}

.result-section h3 {
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #555;
}

.result-item {
  display: flex;
  align-items: center;
  padding: 10px;
  margin-bottom: 8px;
  border-radius: 4px;
  font-size: 14px;
}

.result-item.success {
  background-color: #e8f5e9;
  border-left: 3px solid #4CAF50;
}

.result-item.error {
  background-color: #ffebee;
  border-left: 3px solid #f44336;
}

.result-item .icon {
  margin-right: 10px;
  font-weight: bold;
}

.result-item .error-text {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #c62828;
}

/* Payment Link Display */
.payment-link-display {
  display: flex;
  gap: 10px;
  align-items: center;
}

.payment-link-input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: #f5f5f5;
  font-family: monospace;
  font-size: 13px;
}

/* Buttons */
.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary {
  background-color: #4CAF50;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #45a049;
}

.btn-secondary {
  background-color: #f5f5f5;
  color: #333;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #e0e0e0;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 13px;
}
```

---

## Summary Checklist for Frontend Developers

- [ ] Add "Alternative Phone Number" input field (optional, 10 digits)
- [ ] Add "Alternative Email" input field (optional, valid email)
- [ ] Add multi-select checkboxes for contact preference
- [ ] Default "Registered contact" checkbox to checked
- [ ] Disable "Alternative contact" if no alternative info provided
- [ ] Validate phone number format (10 digits)
- [ ] Validate email format (standard email regex)
- [ ] Ensure at least one checkbox is selected
- [ ] Build request body with new fields
- [ ] Handle API response with notification results
- [ ] Display success message with notification details
- [ ] Handle partial notification failures gracefully
- [ ] Show warning if some notifications fail
- [ ] Handle validation errors from backend
- [ ] Test all scenarios from testing checklist
- [ ] Ensure backward compatibility (works without new fields)
- [ ] Add loading states during API call
- [ ] Disable form during submission
- [ ] Add proper error messages for all validation failures

---

## Support & Questions

For any questions or issues during integration, please refer to:
- **Backend API Documentation**: `/docs/FEATURE_ACCESS_APP_INTEGRATION.md`
- **Implementation Plan**: `C:\Users\bhavy\.claude\plans\elegant-hopping-hummingbird.md`
- **Backend Team Contact**: [Your contact info]

---

**Document Version**: 1.0
**Last Updated**: 2026-01-30
**Author**: Backend Development Team
