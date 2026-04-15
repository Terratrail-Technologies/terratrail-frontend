# TerraTrail API Documentation
*Backend Integration & Endpoint Specifications*

## Overview
This document outlines the standard RESTful APIs required by the frontend application. The backend should be designed to receive and send JSON payloads. Authentication is assumed to be handled centrally via Authorization header (`Bearer <token>`).

### Standard Response Formats
**Success Response:**
```json
{
  "status": "success",
  "data": { ... } // Single object or Array
}
```

**Error Response:**
```json
{
  "status": "error",
  "message": "Human readable error message",
  "code": "ERROR_CODE"
}
```

---

## 1. Workspace
Manages standard workspace metadata including tenancy, regional settings, and billing plans.

### `GET /api/v1/workspace`
Fetch the details of the currently authenticated workspace.
* **Response** `200 OK`:
  ```json
  {
    "id": "workspace-123",
    "name": "Tehillah Estate",
    "slug": "tehillah",
    "logo": null,
    "plan": "Growth",
    "timezone": "Africa/Lagos",
    "region": "Nigeria"
  }
  ```

---

## 2. Properties & Inventory 
Manages the real estate properties, their respective statuses, and configurations.

### `GET /api/v1/properties`
Fetch all properties under the workspace. Supports query params like `?status=published`.
* **Response** `200 OK`:
  ```json
  [
    {
      "id": "1",
      "name": "Tehillah Estate Phase 1",
      "type": "Residential Land",
      "totalSqm": 50000,
      "status": "published",
      "location": { "address": "...", "city": "Lagos", "state": "Lagos", "country": "Nigeria" },
      "subscriptions": 24,
      "revenue": 156000000,
      "createdAt": "2025-11-15"
    }
  ]
  ```

### `POST /api/v1/properties`
Create a new property listing (Property Wizard).
* **Request Body**:
  ```json
  {
    "name": "Tehillah Estate Phase 2",
    "type": "Residential Land",
    "description": "Premium land...",
    "totalSqm": 20000,
    "location": { "city": "Lagos" },
    "amenities": [ { "name": "Fencing", "status": "Not Started" } ],
    "pricingPlans": [ { "name": "Pre-launch", "pricePerUnit": 5000, "currency": "NGN" } ]
  }
  ```
* **Response** `201 Created`

### `POST /api/v1/properties/:id/images`
Upload gallery and cover images. Expects `multipart/form-data`.
* **Response** `200 OK`

---

## 3. Customers
Manages the buyers and their associated subscriptions.

### `GET /api/v1/customers`
Retrieve all customers in the workspace.
* **Response** `200 OK`:
  ```json
  [
    {
      "id": "1",
      "name": "Chukwudi Okafor",
      "email": "chukwudi.okafor@email.com",
      "phone": "+234 803 456 7890",
      "subscriptions": 2,
      "activeSubscriptions": 2,
      "totalRevenue": 8500000,
      "status": "active",
      "customerRep": "Amaka Johnson",
      "joinedAt": "2025-11-20"
    }
  ]
  ```

### `POST /api/v1/customers`
Create a new customer profile.
* **Request Body**:
  ```json
  {
    "name": "Chukwudi Okafor",
    "email": "chukwudi.okafor@email.com",
    "phone": "+2348034567890",
    "assignedRepId": "rep-456"
  }
  ```
* **Response** `201 Created`

---

## 4. Sales & Customer Representatives
Manage internal operators, realtors, and commission.

### `GET /api/v1/sales-reps`
Returns a list of external realtors/sales representatives.
* **Response** `200 OK`:
  ```json
  [
    {
      "id": "1",
      "name": "Ngozi Eze",
      "tier": "Legend",
      "referralCode": "NGOZ-2024",
      "referrals": 18,
      "totalEarned": 2340000,
      "pendingPayout": 450000
    }
  ]
  ```

### `GET /api/v1/customer-reps`
Returns a list of internal customer representatives.

### `POST /api/v1/invites`
Generate an invite link to onboard a new realtor or representative.
* **Request Body**:
  ```json
  {
    "email": "realtor@example.com",
    "role": "salesRep" 
  }
  ```
* **Response** `201 Created`:
  ```json
  { "inviteLink": "https://terra-trail.app/invite/abc-123" }
  ```

---

## 5. Subscriptions & Transactions
Core ledger recording installments and payment workflows.

### `GET /api/v1/transactions`
Retrieve financial transaction logs.
* **Response** `200 OK`:
  ```json
  [
    {
      "id": "1",
      "customer": "Chukwudi Okafor",
      "property": "Tehillah Estate Phase 1",
      "amount": 2500000,
      "type": "Installment",
      "status": "approved",
      "method": "Bank Transfer",
      "date": "2026-04-05"
    }
  ]
  ```

### `PUT /api/v1/transactions/:id/status`
Approve or reject a pending transaction/payment.
* **Request Body**:
  ```json
  { "status": "approved" }
  ```

---

## 6. Site Inspections
Scheduling workflow for clients to physically inspect property bounds.

### `GET /api/v1/inspections`
* **Response** `200 OK`:
  ```json
  [
    {
      "id": "1",
      "contact": { "name": "Folake Williams", "phone": "+234..." },
      "property": "Tehillah Estate Phase 1",
      "date": "2026-04-12",
      "time": "10:00 AM",
      "type": "In-Person",
      "category": "Individual",
      "status": "upcoming"
    }
  ]
  ```

---

## 7. Dashboard Analytics
Aggregate data specifically designed for the `Overview.tsx` frontend page.

### `GET /api/v1/analytics/dashboard`
Returns computationally heavy aggregate metrics so the frontend doesn't need to manually map thousands of records.
* **Response** `200 OK`:
  ```json
  {
    "properties": { "total": 2, "active": 2 },
    "customers": { "total": 3, "active": 2 },
    "subscriptions": { "total": 37, "active": 28 },
    "financial": {
      "totalRevenue": 204000000,
      "outstandingBalance": 89000000,
      "potentialRevenue": 356000000,
      "netRevenue": 187000000
    },
    "commission": {
      "approvedReferralPayments": 4680000,
      "payouts": 3830000,
      "pendingPayouts": 850000
    },
    "recentPayments": 8
  }
  ```

---

## 8. Activity Logs
Audit trail of actions taken within the workspace.

### `GET /api/v1/activity-logs`
* **Response** `200 OK`:
  ```json
  [
    {
      "id": "1",
      "user": "Praise Adebayo",
      "action": "generated an invite link",
      "entity": "Workspace",
      "timestamp": "2026-04-10T12:00:00Z"
    }
  ]
  ```
