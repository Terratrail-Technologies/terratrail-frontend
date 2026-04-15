# TerraTrail Backend — API Integration Documentation

> **Version:** 2.0 | **Base URL:** `http://localhost:8000/api/v1` | **Interactive Docs:** `/api/v1/docs/`

---

## Table of Contents

1. [Authentication & Headers](#1-authentication--headers)
2. [Workspace Resolution](#2-workspace-resolution)
3. [Standard Response Conventions](#3-standard-response-conventions)
4. [Auth Module](#4-auth-module)
5. [Workspaces Module](#5-workspaces-module)
6. [Properties Module](#6-properties-module)
7. [Customers Module](#7-customers-module)
8. [Payments Module](#8-payments-module)
9. [Commissions Module](#9-commissions-module)
10. [Notifications & Dashboard Module](#10-notifications--dashboard-module)
11. [Customer Self-Service Portal](#11-customer-self-service-portal)
12. [Permission Reference](#12-permission-reference)
13. [Enum / Choice Reference](#13-enum--choice-reference)
14. [PRD Gap Analysis](#14-prd-gap-analysis)

```
Only remaining work is the automated daily reminder engine (Celery beat tasks) and wiring a real email/SMS provider into NotificationService.
```

---

## 1. Authentication & Headers

TerraTrail uses **two separate authentication schemes** depending on who is making the request.

### Admin / Workspace Users (JWT)

```
Authorization: Bearer <access_token>
X-Workspace-Slug: <workspace_slug>
Content-Type: application/json
```

### Customer Portal Users (PortalToken)

```
Authorization: PortalToken <portal_token>
Content-Type: application/json
```

> `X-Workspace-Slug` is required on every admin request that touches workspace-scoped data. It is **not** used for portal endpoints (workspace is derived from the customer record).

### Token Lifecycle — Admin JWT

| Token     | Lifetime              | How to use                       |
| --------- | --------------------- | -------------------------------- |
| `access`  | Short-lived (minutes) | `Authorization: Bearer <access>` |
| `refresh` | Long-lived (days)     | `POST /auth/token/refresh/`      |

### Token Lifecycle — Customer Portal

| Token          | Lifetime   | How to use                           |
| -------------- | ---------- | ------------------------------------ |
| `portal_token` | 30 minutes | `Authorization: PortalToken <token>` |

Portal tokens expire after 30 minutes of inactivity. Re-authenticate via the OTP flow.

---

## 2. Workspace Resolution

Every admin request to workspace-scoped endpoints must include the workspace slug in the `X-Workspace-Slug` header. The backend middleware resolves the workspace from this header and scopes all data queries to it.

```
GET /api/v1/customers/
Authorization: Bearer eyJ...
X-Workspace-Slug: my-estate-company
```

---

## 3. Standard Response Conventions

### Success

```json
{ "...resource fields..." }
```

### Error

```json
{ "message": "Human-readable error description." }
```

### Validation Error (400)

```json
{
  "field_name": ["Error message for this field."],
  "another_field": ["Another error."]
}
```

### Pagination

```json
{
  "count": 42,
  "next": "http://localhost:8000/api/v1/customers/?page=2",
  "previous": null,
  "results": ["...items..."]
}
```

### File Uploads

Use `Content-Type: multipart/form-data` for any endpoint that accepts file fields (`featured_image`, `document_file`, `image`, `receipt_file`).

### Decimal Fields

All monetary values are returned as strings (e.g. `"83333.33"`) to preserve precision. Parse with `parseFloat()` for display.

---

## 4. Auth Module

**Base:** `/api/v1/auth/`

---

### 4.1 Register

`POST /api/v1/auth/register/`

Create a new user account. No authentication required.

**Request Body**

```json
{
  "email": "admin@example.com",
  "password": "securepassword",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Response `201`**

```json
{
  "message": "Account created. Please verify your email using the OTP sent to you.",
  "user": {
    "id": "uuid",
    "email": "admin@example.com",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

---

### 4.2 Login

`POST /api/v1/auth/login/`

Authenticate with email + password. Returns JWT tokens.

**Request Body**

```json
{
  "email": "admin@example.com",
  "password": "securepassword"
}
```

**Response `200`**

```json
{
  "user": {
    "id": "uuid",
    "email": "admin@example.com",
    "first_name": "John",
    "last_name": "Doe"
  },
  "tokens": {
    "access": "eyJ...",
    "refresh": "eyJ..."
  }
}
```

**Errors:** `401` — Invalid credentials.

---

### 4.3 Refresh Token

`POST /api/v1/auth/token/refresh/`

**Request Body**

```json
{ "refresh": "eyJ..." }
```

**Response `200`**

```json
{ "access": "eyJ..." }
```

---

### 4.4 Get / Update Current User

`GET /api/v1/auth/me/`
`PATCH /api/v1/auth/me/`

**Auth:** Bearer required.

**Response `200` / Request body (PATCH)**

```json
{
  "id": "uuid",
  "email": "admin@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+2348000000000",
  "title": "MR",
  "gender": "MALE",
  "date_of_birth": "1990-01-01",
  "occupation": "Estate Manager",
  "address": "123 Main St",
  "country": "Nigeria",
  "state": "Lagos"
}
```

---

### 4.5 OTP — Request (Admin email verification)

`POST /api/v1/auth/otp/request/`

Rate-limited. Used for admin account email verification during onboarding.

**Request Body**

```json
{
  "email": "admin@example.com",
  "phone": "+2348000000000"
}
```

**Response `200`**

```json
{ "message": "OTP sent successfully.", "code": "123456" }
```

> `code` is only returned in `DEBUG=True`. In production the code is emailed only.

**Errors:** `429` — Rate limited / locked out.

---

### 4.6 OTP — Verify (Admin)

`POST /api/v1/auth/otp/verify/`

**Request Body**

```json
{
  "email": "admin@example.com",
  "phone": "+2348000000000",
  "code": "123456"
}
```

**Response `200`**

```json
{
  "user": { "...user object..." },
  "tokens": { "access": "eyJ...", "refresh": "eyJ..." }
}
```

---

### 4.7 List Workspace Members

`GET /api/v1/auth/members/`

**Auth:** Bearer + Admin only.

**Response `200`** — List of WorkspaceMembership objects.

---

### 4.8 Add Member to Workspace

`POST /api/v1/auth/members/add/`

**Auth:** Bearer + Admin only.

**Request Body**

```json
{ "email": "colleague@example.com", "role": "ADMIN" }
```

**Response `201`** — WorkspaceMembership object.

**Errors:** `404` — No user with that email exists.

---

## 5. Workspaces Module

**Base:** `/api/v1/workspaces/`

---

### 5.1 Create Workspace

`POST /api/v1/workspaces/create/`

**Auth:** Bearer required.

**Request Body**

```json
{ "name": "My Estate Company", "slug": "my-estate-company" }
```

**Response `201`**

```json
{
  "id": "uuid",
  "name": "My Estate Company",
  "slug": "my-estate-company",
  "billing_plan": "FREE",
  "is_active": true,
  "created_at": "2026-01-01T00:00:00Z"
}
```

---

### 5.2 List My Workspaces

`GET /api/v1/workspaces/mine/`

Returns all workspaces the authenticated user belongs to. Used for the workspace switcher.

**Auth:** Bearer required.

**Response `200`** — Array of workspace summary objects (id, name, slug, logo, billing_plan).

---

### 5.3 Get / Update Workspace Detail

`GET /api/v1/workspaces/detail/`
`PATCH /api/v1/workspaces/detail/`

**Auth:** Bearer + `X-Workspace-Slug` required.

**Response `200` / Request body (PATCH)**

```json
{
  "id": "uuid",
  "name": "My Estate Company",
  "slug": "my-estate-company",
  "logo": null,
  "timezone": "Africa/Lagos",
  "region": "Nigeria",
  "support_email": "support@example.com",
  "support_whatsapp": "+2348000000000",
  "billing_plan": "STARTER",
  "is_active": true
}
```

---

### 5.4 Get / Update Workspace Settings

`GET /api/v1/workspaces/settings/`
`PATCH /api/v1/workspaces/settings/`

**Auth:** Bearer + Admin only.

**Response `200` / Request body (PATCH)**

```json
{
  "id": "uuid",
  "workspace": "uuid",
  "can_reps_approve_bookings": false,
  "can_reps_manage_subscriptions": false,
  "can_reps_manage_sales_reps": false,
  "notify_customer_on_booking_status": true,
  "notify_admin_on_new_booking": true,
  "notify_customer_on_payment_receipt": true,
  "commission_starter_pct": "5.00",
  "commission_senior_pct": "7.50",
  "commission_legend_pct": "10.00"
}
```

> `commission_*_pct` are workspace-level default commission rates. Individual properties can override these via `commission_override_*` fields on the Property model.

---

### 5.5 List Workspace Activity

`GET /api/v1/workspaces/activity/`

**Auth:** Bearer required.

**Response `200`** — Paginated list of activity entries.

```json
{
  "results": [
    {
      "id": "uuid",
      "actor": { "id": "uuid", "first_name": "John", "last_name": "Doe" },
      "action_text": "Approved payment for Jane Doe",
      "category": "payment",
      "link": "/customers/uuid/",
      "created_at": "2026-01-01T00:00:00Z"
    }
  ]
}
```

---

### 5.6 List Members / Invite Member

`GET /api/v1/workspaces/members/` — List members.
`POST /api/v1/workspaces/invites/` — Send invite.

**Invite Request Body**

```json
{ "email": "newmember@example.com", "role": "ADMIN" }
```

---

### 5.7 Billing

`GET /api/v1/workspaces/billing/plans/` — List available plans.
`POST /api/v1/workspaces/billing/select/` — Select a plan (`{ "plan": "STARTER" }`).
`GET /api/v1/workspaces/billing/usage/` — View current usage vs limits.

---

## 6. Properties Module

**Base:** `/api/v1/properties/`

---

### 6.1 List Properties

`GET /api/v1/properties/`

**Auth:** Bearer required.

**Response `200`** — Paginated list of property summaries (id, name, type, status, location, pricing_plans_count, featured_image).

---

### 6.2 Create Property (All Stepper Steps)

`POST /api/v1/properties/`

**Auth:** Bearer required.
**Content-Type:** `multipart/form-data` (if uploading `featured_image`), else `application/json`.

All stepper steps except gallery images can be sent in one request. Nested fields are all optional — send only what is ready at creation time.

**Request Body**

```json
{
  "name": "Green Valley Estate",
  "property_type": "RESIDENTIAL_LAND",
  "description": "A beautiful residential estate.",
  "total_sqms": 5000,
  "unit_measurement": "SQM",
  "featured_image": "<file>",

  "location": {
    "address": "123 Main St",
    "city": "Lekki",
    "state": "Lagos",
    "country": "Nigeria",
    "postal_code": "101001",
    "latitude": "6.4350",
    "longitude": "3.4216"
  },

  "amenities": [
    {
      "name": "Electricity",
      "status": "COMPLETED",
      "description": "Full 24/7 power"
    }
  ],

  "documents": [
    {
      "document_type": "C_OF_O",
      "status": "READY",
      "notes": "From state government"
    }
  ],

  "pricing_plans": [
    {
      "plan_name": "Prelaunch — 300 SQM",
      "land_size": 300,
      "total_price": 600000,
      "payment_type": "INSTALLMENT",
      "initial_payment": 100000,
      "duration_months": 6,
      "payment_spread_method": "INITIAL_SEPARATE"
    }
  ],

  "bank_accounts": [
    {
      "bank_name": "First Bank",
      "account_name": "Green Valley Ltd",
      "account_number": "0123456789"
    }
  ]
}
```

**Response `201`** — Full property detail object (same as GET detail below).

> Gallery images are uploaded separately via `POST /properties/gallery/` (multipart, per image).

---

### 6.3 Get Property Detail

`GET /api/v1/properties/<id>/`

**Response `200`**

```json
{
  "id": "uuid",
  "name": "Green Valley Estate",
  "property_type": "RESIDENTIAL_LAND",
  "status": "DRAFT",
  "featured_image": null,
  "location": { "...location..." },
  "gallery_images": [ { "id": "uuid", "image": "url", "caption": "...", "order": 1 } ],
  "pricing_plans": [
    {
      "id": "uuid",
      "plan_name": "Prelaunch — 300 SQM",
      "land_size": "300.00",
      "total_price": "600000.00",
      "payment_type": "INSTALLMENT",
      "initial_payment": "100000.00",
      "duration_months": 6,
      "payment_spread_method": "INITIAL_SEPARATE",
      "monthly_installment": "83333.33",
      "is_active": true,
      "is_locked": false
    }
  ],
  "bank_accounts": [ { "...bank account..." } ],
  "amenities": [ { "...amenity..." } ],
  "documents": [ { "...document..." } ],
  "commission_override_starter": null,
  "commission_override_senior": null,
  "commission_override_legend": null,
  "commission_defaults": {
    "starter": "5.00",
    "senior": "7.50",
    "legend": "10.00"
  }
}
```

> **Commission logic:** `commission_override_*` of `null` means the workspace default from `commission_defaults` applies. A non-null value (e.g. `"8.00"`) overrides the default for this property only.

---

### 6.4 Update Property

`PATCH /api/v1/properties/<id>/`

Send only fields to change. Nested lists are **replaced wholesale** only when the key is present. Omitting a nested key leaves existing data untouched.

> Locked pricing plans (`is_locked: true`) are never deleted on update.

---

### 6.5 Delete Property

`DELETE /api/v1/properties/<id>/` — `204` No Content.

---

### 6.6 Publish / Unpublish

`POST /api/v1/properties/<id>/publish/`

Validates: name + location + at least one active pricing plan + at least one active bank account.

```json
{ "message": "Property published successfully.", "status": "PUBLISHED" }
```

`POST /api/v1/properties/<id>/unpublish/` — Returns property to `DRAFT`. Existing subscriptions unaffected.

---

### 6.7 Pricing Plans

| Endpoint                                | Method               | Description               |
| --------------------------------------- | -------------------- | ------------------------- |
| `/properties/plans/?property_id=<uuid>` | GET                  | List plans for a property |
| `/properties/plans/`                    | POST                 | Create standalone plan    |
| `/properties/plans/<id>/`               | GET / PATCH / DELETE | Plan detail               |
| `/properties/plans/<id>/activate/`      | POST                 | Activate plan             |
| `/properties/plans/<id>/deactivate/`    | POST                 | Deactivate plan           |

**Payment Spread Method:**

| Value              | Monthly installment formula                               |
| ------------------ | --------------------------------------------------------- |
| `INITIAL_SEPARATE` | `(total_price − initial_payment) ÷ duration_months`       |
| `INITIAL_AS_FIRST` | `(total_price − initial_payment) ÷ (duration_months − 1)` |

> A plan with active subscriptions has `is_locked: true` — its `payment_spread_method` cannot be changed and it cannot be deleted.

---

### 6.8 Bank Accounts

| Endpoint                                        | Method               |
| ----------------------------------------------- | -------------------- |
| `/properties/bank-accounts/?property_id=<uuid>` | GET                  |
| `/properties/bank-accounts/`                    | POST                 |
| `/properties/bank-accounts/<id>/`               | GET / PATCH / DELETE |

**Create body:** `{ "property": "uuid", "bank_name": "...", "account_name": "...", "account_number": "..." }`

---

### 6.9 Amenities

| Endpoint                                    | Method               |
| ------------------------------------------- | -------------------- |
| `/properties/amenities/?property_id=<uuid>` | GET                  |
| `/properties/amenities/`                    | POST                 |
| `/properties/amenities/<id>/`               | GET / PATCH / DELETE |

**Create body:** `{ "property": "uuid", "name": "...", "status": "NOT_STARTED", "description": "..." }`

---

### 6.10 Documents

| Endpoint                                    | Method               |
| ------------------------------------------- | -------------------- |
| `/properties/documents/?property_id=<uuid>` | GET                  |
| `/properties/documents/`                    | POST (multipart)     |
| `/properties/documents/<id>/`               | GET / PATCH / DELETE |

**Create body (multipart):** `property`, `document_type`, `status`, `notes`, `document_file`.

---

### 6.11 Gallery

| Endpoint                                  | Method               |
| ----------------------------------------- | -------------------- |
| `/properties/gallery/?property_id=<uuid>` | GET                  |
| `/properties/gallery/`                    | POST (multipart)     |
| `/properties/gallery/<id>/`               | GET / PATCH / DELETE |

**Create body (multipart):** `property`, `image`, `caption`, `order`.

---

## 7. Customers Module

**Base:** `/api/v1/customers/`

---

### 7.1 List Customers

`GET /api/v1/customers/`

**Query Parameters**

| Param             | Description                          |
| ----------------- | ------------------------------------ |
| `search`          | Search `full_name`, `email`, `phone` |
| `referral_source` | Filter by referral source enum       |

---

### 7.2 Create Customer (+ Optional Subscription)

`POST /api/v1/customers/`

**Request Body**

```json
{
  "full_name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+2348000000001",
  "address": "45 Victoria Island",
  "next_of_kin_name": "John Doe",
  "next_of_kin_phone": "+2348000000002",
  "referral_source": "SOCIAL_MEDIA",
  "property_id": "uuid",
  "pricing_plan_id": "uuid"
}
```

> If `property_id` + `pricing_plan_id` are provided, a subscription and full installment schedule are auto-generated. Omit them to create the customer only and add a subscription later.

**Response `201`** — Customer object, optionally with a `subscription` key.

---

### 7.3 Customer Detail / Update / Delete

`GET /api/v1/customers/<id>/` — Full detail with all subscriptions.
`PATCH /api/v1/customers/<id>/` — Update customer fields (not subscription data).
`DELETE /api/v1/customers/<id>/`

---

### 7.4 Subscriptions

| Endpoint                                      | Method | Description                               |
| --------------------------------------------- | ------ | ----------------------------------------- |
| `/customers/subscriptions/?status=&customer=` | GET    | List subscriptions (filterable)           |
| `/customers/subscriptions/`                   | POST   | Create subscription for existing customer |
| `/customers/subscriptions/<id>/`              | GET    | Full detail with installments             |

**Create body:** `{ "customer_id": "uuid", "property_id": "uuid", "pricing_plan_id": "uuid", "notes": "" }`

---

### 7.5 Installments

`GET /api/v1/customers/installments/?subscription=<uuid>&status=<status>`

Results ordered by `due_date` ascending. Filter by `status`: `UPCOMING`, `DUE`, `OVERDUE`, `PENDING`, `PAID`.

---

## 8. Payments Module

**Base:** `/api/v1/payments/`

---

### 8.1 List / Detail

`GET /api/v1/payments/?status=<status>` — List (filterable by `PENDING`, `APPROVED`, `REJECTED`).
`GET /api/v1/payments/<id>/` — Detail.

---

### 8.2 Record Payment

`POST /api/v1/payments/record/`

**Content-Type:** `multipart/form-data` (if uploading `receipt_file`).

**Request Body**

```json
{
  "installment_id": "uuid",
  "amount": "83333.33",
  "receipt_url": "https://...",
  "receipt_file": "<file>",
  "notes": "Paid via First Bank"
}
```

**Response `201`** — Payment object.

---

### 8.3 Approve Payment

`POST /api/v1/payments/<id>/approve/`

**Auth:** Admin only.

Triggers automatically:

1. Installment → `PAID`
2. Subscription `amount_paid` / `balance` updated
3. If installment #1: all future installment due dates recalculated from today (approval date anchor)
4. Commission calculated for assigned sales rep
5. Customer email + SMS notification sent

**Response `200`** — Updated payment object.

---

### 8.4 Reject Payment

`POST /api/v1/payments/<id>/reject/`

**Auth:** Admin only.

**Request Body:** `{ "reason": "Receipt unclear." }`

Reverts installment to `DUE` or `OVERDUE`. Customer email + SMS sent.

---

## 9. Commissions Module

**Base:** `/api/v1/commissions/`

---

### 9.1 Sales Reps

| Endpoint                  | Method               | Description                               |
| ------------------------- | -------------------- | ----------------------------------------- |
| `/commissions/reps/`      | GET                  | List reps                                 |
| `/commissions/reps/`      | POST                 | Create rep (auto-generates referral code) |
| `/commissions/reps/<id>/` | GET / PATCH / DELETE | Rep detail                                |

**Create body:** `{ "name": "...", "email": "...", "phone": "...", "tier": "STARTER" }`

---

### 9.2 List Commissions

`GET /api/v1/commissions/?status=<status>&sales_rep=<uuid>`

Filter by `status`: `PENDING`, `PAID`, `CANCELLED`. Filter by `sales_rep` UUID.

---

### 9.3 Mark Commission Paid

`POST /api/v1/commissions/<id>/mark-paid/`

**Request Body:** `{ "notes": "Transferred via GTBank on 2026-01-15" }`

Call this after manually transferring the amount to the sales rep's bank account.

---

## 10. Notifications & Dashboard Module

**Base:** `/api/v1/notifications/`

---

### 10.1 List Notification Logs

`GET /api/v1/notifications/?notification_type=EMAIL&status=SENT`

**Auth:** Admin only. Returns paginated log of all email/SMS notifications sent by the workspace.

---

### 10.2 Dashboard — Key Metrics

`GET /api/v1/notifications/dashboard/`

**Query Parameters (optional)**

| Param       | Description                                            |
| ----------- | ------------------------------------------------------ |
| `date_from` | ISO date — filter revenue & commissions from this date |
| `date_to`   | ISO date — filter revenue & commissions to this date   |

**Response `200`**

```json
{
  "revenue": "5000000.00",
  "net_revenue": "4750000.00",
  "outstanding_balance": "12000000.00",
  "potential_revenue": "25000000.00",
  "commission_earned": "250000.00",
  "commission_pending": "80000.00",
  "commission_potential": "330000.00",
  "active_subscriptions": 48,
  "total_customers": 63,
  "overdue_installments": 7,
  "pending_payments": 3,
  "filters": {
    "date_from": "2026-01-01",
    "date_to": "2026-12-31"
  }
}
```

| Field                  | Date-filtered | Description                                                |
| ---------------------- | :-----------: | ---------------------------------------------------------- |
| `revenue`              |      ✅       | Sum of approved payments                                   |
| `net_revenue`          |      ✅       | Revenue minus commissions paid to reps                     |
| `outstanding_balance`  |      ❌       | Unpaid balance (active + pending subscriptions)            |
| `potential_revenue`    |      ❌       | Total contract value if all non-cancelled subs pay in full |
| `commission_earned`    |      ✅       | Total commissions already paid out                         |
| `commission_pending`   |      ✅       | Commission earned but not yet paid                         |
| `commission_potential` |      ✅       | earned + pending combined                                  |
| `active_subscriptions` |      ❌       | Count of `ACTIVE` subscriptions                            |
| `total_customers`      |      ❌       | Total customer count                                       |
| `overdue_installments` |      ❌       | Count of `OVERDUE` installments                            |
| `pending_payments`     |      ❌       | Count of payments awaiting approval                        |

---

### 10.3 Dashboard — Sales Rep Leaderboard

`GET /api/v1/notifications/dashboard/leaderboard/?date_from=&date_to=`

Top 20 active sales reps ranked by commission earned within the date range.

**Response `200`**

```json
{
  "leaderboard": [
    {
      "id": "uuid",
      "name": "Mike Sales",
      "tier": "STARTER",
      "referral_code": "MIKE001",
      "total_earned": "150000.00",
      "total_pending": "50000.00",
      "total_referrals": 12
    }
  ]
}
```

---

### 10.4 Dashboard — Revenue Breakdown by Property

`GET /api/v1/notifications/dashboard/revenue/?date_from=&date_to=`

**Response `200`**

```json
{
  "breakdown": [
    {
      "property": "Green Valley Estate",
      "total_revenue": "3000000.00",
      "payment_count": 36
    }
  ]
}
```

---

### 10.5 Dashboard — Property Leaderboard

`GET /api/v1/notifications/dashboard/properties/?date_from=&date_to=`

> `top_by_subscriptions` is always-current (not date-filtered). `top_by_revenue` is date-filtered.

**Response `200`**

```json
{
  "top_by_subscriptions": [
    { "id": "uuid", "name": "Green Valley Estate", "subscription_count": 32 }
  ],
  "top_by_revenue": [
    {
      "id": "uuid",
      "name": "Green Valley Estate",
      "total_revenue": "3000000.00"
    }
  ]
}
```

---

### 10.6 Dashboard — Customer Leaderboard

`GET /api/v1/notifications/dashboard/customers/?date_from=&date_to=`

> `top_by_revenue` is date-filtered. `top_by_subscriptions` is always-current.

**Response `200`**

```json
{
  "top_by_revenue": [
    {
      "id": "uuid",
      "full_name": "Jane Doe",
      "email": "jane@example.com",
      "total_paid": "450000.00"
    }
  ],
  "top_by_subscriptions": [
    {
      "id": "uuid",
      "full_name": "John Smith",
      "email": "john@example.com",
      "subscription_count": 3
    }
  ]
}
```

---

## 11. Customer Self-Service Portal

**Base:** `/api/v1/portal/`

The portal is a **completely separate auth flow** for customers — they do not need an admin account or password. Authentication is OTP-based, matching email + phone against the `Customer` model.

### Auth flow summary

```
1. POST /api/v1/portal/auth/request-otp/   →  OTP sent to customer's email
2. POST /api/v1/portal/auth/verify-otp/    →  receive PortalToken (30 min)
3. GET  /api/v1/portal/me/                 →  Authorization: PortalToken <token>
```

---

### 11.1 Request OTP (Portal)

`POST /api/v1/portal/auth/request-otp/`

**Auth:** None. Rate-limited.

Both `email` AND `phone` must match a single `Customer` record (PRD 5.6.1).

**Request Body**

```json
{
  "email": "jane@example.com",
  "phone": "+2348000000001"
}
```

**Response `200`**

```json
{
  "message": "OTP sent to your email address.",
  "code": "123456"
}
```

> `code` is only returned in `DEBUG=True`. Never shown in production.

**Errors:**

- `400` — Missing email or phone.
- `404` — `"No account found. Please contact your estate manager."` (no matching customer).
- `429` — Rate limited or locked out after 3 failed attempts (15-minute lockout).

---

### 11.2 Verify OTP (Portal)

`POST /api/v1/portal/auth/verify-otp/`

**Auth:** None. Rate-limited.

**Request Body**

```json
{
  "email": "jane@example.com",
  "phone": "+2348000000001",
  "code": "123456"
}
```

**Response `200`**

```json
{
  "message": "Login successful.",
  "token": "abc123xyzSecureToken...",
  "expires_at": "2026-01-15T10:30:00+00:00",
  "customer": {
    "id": "uuid",
    "full_name": "Jane Doe",
    "email": "jane@example.com",
    "phone": "+2348000000001"
  }
}
```

Store `token` and use it as `Authorization: PortalToken <token>` for all subsequent portal requests.

**Errors:**

- `400` — Invalid OTP, expired OTP (10 min), missing fields. Error message includes remaining attempts.
- `404` — Customer not found.

> Any previously active portal session for this customer is invalidated on successful login.

---

### 11.3 My Profile & Subscription Overview

`GET /api/v1/portal/me/`

**Auth:** `PortalToken` required.

Returns customer profile and a summary card per subscription — use this for the portal dashboard.

**Response `200`**

```json
{
  "id": "uuid",
  "full_name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+2348000000001",
  "address": "45 Victoria Island",
  "subscriptions": [
    {
      "id": "uuid",
      "property_name": "Green Valley Estate",
      "plan_name": "Prelaunch — 300 SQM",
      "total_price": "600000.00",
      "amount_paid": "183333.33",
      "balance": "416666.67",
      "status": "ACTIVE",
      "next_due_date": "2026-04-15",
      "next_due_amount": "83333.33"
    }
  ]
}
```

> `next_due_date` and `next_due_amount` are `null` if there are no `DUE` or `OVERDUE` installments.

---

### 11.4 List Subscriptions (Portal)

`GET /api/v1/portal/subscriptions/`

**Auth:** `PortalToken` required.

Returns all subscriptions for the authenticated customer with full installment schedules.

**Response `200`** — Array of full subscription objects.

---

### 11.5 Subscription Detail (Portal)

`GET /api/v1/portal/subscriptions/<id>/`

**Auth:** `PortalToken` required.

Returns full subscription detail + approved payment history. Returns `404` for subscriptions belonging to other customers.

**Response `200`**

```json
{
  "subscription": {
    "id": "uuid",
    "property_name": "Green Valley Estate",
    "plan_name": "Prelaunch — 300 SQM",
    "total_price": "600000.00",
    "amount_paid": "183333.33",
    "balance": "416666.67",
    "status": "ACTIVE",
    "installments": [
      {
        "installment_number": 1,
        "due_date": "2026-01-15",
        "amount": "100000.00",
        "status": "PAID",
        "paid_date": "2026-01-15"
      },
      {
        "installment_number": 2,
        "due_date": "2026-02-15",
        "amount": "83333.33",
        "status": "PAID",
        "paid_date": "2026-02-14"
      },
      {
        "installment_number": 3,
        "due_date": "2026-03-15",
        "amount": "83333.33",
        "status": "DUE",
        "paid_date": null
      }
    ]
  },
  "payment_history": [
    {
      "id": "uuid",
      "amount": "100000.00",
      "status": "APPROVED",
      "created_at": "2026-01-15T09:00:00Z"
    }
  ]
}
```

---

### 11.6 Record Payment (Portal)

`POST /api/v1/portal/payments/`

**Auth:** `PortalToken` required.
**Content-Type:** `multipart/form-data`

**Portal payment rules (PRD 5.6.5):**

- `receipt_file` is **mandatory** — rejected without it.
- Installment must be `DUE` or `OVERDUE`.
- Cannot submit if a `PENDING` payment already exists for the installment.
- Customer can only pay against their own installments.

**Request Fields (multipart/form-data)**

| Field            | Type   | Required | Description          |
| ---------------- | ------ | :------: | -------------------- |
| `installment_id` | UUID   |    ✅    | Installment to pay   |
| `amount`         | number |    ✅    | Amount paid (₦)      |
| `receipt_file`   | file   |    ✅    | Image or PDF receipt |
| `notes`          | string |    —     | Optional notes       |

**Response `201`**

```json
{
  "id": "uuid",
  "installment": "uuid",
  "amount": "83333.33",
  "status": "PENDING",
  "receipt_file": "http://.../receipt.pdf",
  "created_at": "2026-03-14T10:00:00Z"
}
```

After submission, the installment status becomes `PENDING` and the admin receives an email notification.

**Errors:**

- `400` — Missing fields, installment already `PENDING`/`PAID`, wrong status.
- `404` — Installment not found or belongs to another customer.

---

## 12. Permission Reference

| Permission Class             | Auth Header           | Who can access                                         |
| ---------------------------- | --------------------- | ------------------------------------------------------ |
| `AllowAny`                   | None                  | Public — no authentication required                    |
| `IsAuthenticated`            | `Bearer <jwt>`        | Any logged-in admin/workspace user                     |
| `IsWorkspaceAdmin`           | `Bearer <jwt>`        | Workspace owners and admins only                       |
| `IsWorkspaceAdminOrReadOnly` | `Bearer <jwt>`        | Admins write; any authenticated workspace member reads |
| `IsCustomerPortalUser`       | `PortalToken <token>` | Authenticated customer portal users only               |

---

## 13. Enum / Choice Reference

### Property Type

| Value              | Label            |
| ------------------ | ---------------- |
| `RESIDENTIAL_LAND` | Residential Land |
| `FARM_LAND`        | Farm Land        |
| `COMMERCIAL`       | Commercial       |
| `MIXED_USE`        | Mixed Use        |

### Property Status

| Value       | Label     |
| ----------- | --------- |
| `DRAFT`     | Draft     |
| `PUBLISHED` | Published |

### Payment Spread Method

| Value              | Behaviour                                                                      |
| ------------------ | ------------------------------------------------------------------------------ |
| `INITIAL_SEPARATE` | Initial payment is standalone; full `duration_months` of installments follow   |
| `INITIAL_AS_FIRST` | Initial payment counts as month 1; remaining spread over `duration_months − 1` |

### Amenity Status

| Value         | Label       |
| ------------- | ----------- |
| `NOT_STARTED` | Not Started |
| `IN_PROGRESS` | In Progress |
| `COMPLETED`   | Completed   |

### Document Type

| Value                | Label                             |
| -------------------- | --------------------------------- |
| `C_OF_O`             | Certificate of Occupancy (C of O) |
| `DEED_OF_ASSIGNMENT` | Deed of Assignment                |
| `SURVEY_PLAN`        | Survey Plan                       |
| `OTHER`              | Other                             |

### Document Status

| Value         | Label       |
| ------------- | ----------- |
| `NOT_STARTED` | Not Started |
| `IN_PROGRESS` | In Progress |
| `READY`       | Ready       |

### Customer Referral Source

| Value          | Label        |
| -------------- | ------------ |
| `WALK_IN`      | Walk In      |
| `REFERRAL`     | Referral     |
| `SOCIAL_MEDIA` | Social Media |
| `WEBSITE`      | Website      |
| `AGENT`        | Agent        |
| `OTHER`        | Other        |

### Subscription Status

| Value       | Definition                                               |
| ----------- | -------------------------------------------------------- |
| `PENDING`   | Created; initial payment not yet approved                |
| `ACTIVE`    | Current on payments — no overdue installments            |
| `COMPLETED` | All installments fully paid and approved                 |
| `DEFAULTED` | One or more installments overdue with no pending payment |
| `CANCELLED` | Manually cancelled by admin                              |

### Installment Status

| Value      | Definition                                |
| ---------- | ----------------------------------------- |
| `UPCOMING` | Due date in the future; no action needed  |
| `DUE`      | Due date arrived; no payment recorded     |
| `OVERDUE`  | Past due date; no payment recorded        |
| `PENDING`  | Payment recorded; awaiting admin approval |
| `PAID`     | Payment approved                          |

### Payment Status

| Value      | Label                 |
| ---------- | --------------------- |
| `PENDING`  | Awaiting admin review |
| `APPROVED` | Approved              |
| `REJECTED` | Rejected              |

### Sales Rep Tier

| Value     | Label   |
| --------- | ------- |
| `STARTER` | Starter |
| `SENIOR`  | Senior  |
| `LEGEND`  | Legend  |

### Commission Type

| Value     | Label                                 |
| --------- | ------------------------------------- |
| `PERCENT` | Percentage of approved payment amount |
| `FIXED`   | Fixed amount per approved payment     |

### Commission Status

| Value       | Label          |
| ----------- | -------------- |
| `PENDING`   | Pending payout |
| `PAID`      | Paid out       |
| `CANCELLED` | Cancelled      |

### Workspace Role

| Value       | Label                |
| ----------- | -------------------- |
| `OWNER`     | Workspace owner      |
| `ADMIN`     | Admin                |
| `CUSTOMER`  | Customer             |
| `SALES_REP` | Sales Representative |

### Billing Plan

| Value        | Description                                   |
| ------------ | --------------------------------------------- |
| `FREE`       | Default — limited properties, customers, reps |
| `STARTER`    | Increased limits                              |
| `GROWTH`     | Higher limits                                 |
| `SCALE`      | Enterprise-grade limits                       |
| `ENTERPRISE` | Unlimited                                     |

---

## 14. PRD Gap Analysis

**Status Legend:** ✅ Implemented | ⚠️ Partial | ❌ Not Built

---

### 5.1 Workspace & Onboarding ✅

Registration, login, OTP verification, workspace creation, settings, multiple workspaces, workspace switcher, member management + invitations — all implemented.

---

### 5.2 Properties Module ✅

All stepper steps in a single POST request, gallery via separate multipart endpoint, publish/unpublish with validation, both pricing plan types, both spread methods, `monthly_installment` auto-calculated, `is_locked` on plans with active subscriptions, commission overrides per property — all implemented.

---

### 5.3 Customers Module ✅

Customer CRUD, create customer + subscription in one request, standalone subscription creation, auto-generated installment schedule, full customer detail with subscriptions + schedules — all implemented.

---

### 5.4 Payment Tracking ✅

| Requirement                                                       | Status                                                                                                             |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Record payment (admin)                                            | ✅                                                                                                                 |
| Approve / reject with email+SMS                                   | ✅                                                                                                                 |
| All payment statuses                                              | ✅                                                                                                                 |
| Commission auto-triggered on approval                             | ✅                                                                                                                 |
| **Installment date recalculation after initial payment approved** | ✅ Fixed — `PaymentService` now calls `SubscriptionService.regenerate_schedule()` when installment #1 is approved  |
| **Automated daily reminder engine**                               | ⚠️ Celery beat is installed (`django_celery_beat` in migrations); reminder tasks need to be defined and registered |

---

### 5.5 Sales Reps & Commissions ✅

Sales rep CRUD, auto-generated referral code, three tiers (Starter/Senior/Legend), commission auto-calculated on approval, mark commission as paid, workspace-level rates + per-property overrides — all implemented.

---

### 5.6 Customer Self-Service Portal ✅

| Requirement                                          | Status                               |
| ---------------------------------------------------- | ------------------------------------ |
| OTP flow matching email+phone vs Customer model      | ✅                                   |
| OTP lockout after 3 failed attempts (15-min)         | ✅ (OTPService)                      |
| 30-minute session expiry                             | ✅ (CustomerPortalSession)           |
| Customer profile + subscription dashboard            | ✅ `GET /portal/me/`                 |
| Installment schedule view                            | ✅ `GET /portal/subscriptions/<id>/` |
| Payment history tab                                  | ✅ included in subscription detail   |
| Customer record payment (receipt mandatory)          | ✅ `POST /portal/payments/`          |
| Customer can only see own data                       | ✅ scoped via CustomerPortalSession  |
| Cannot submit second payment for PENDING installment | ✅ enforced in PaymentService        |

---

### 5.7 Overview Dashboard ✅

| Metric                                                          | Status                                        |
| --------------------------------------------------------------- | --------------------------------------------- |
| Total Revenue (date-filtered)                                   | ✅                                            |
| Net Revenue (revenue − commissions paid)                        | ✅                                            |
| Outstanding Balance (always-current)                            | ✅                                            |
| Potential Revenue (always-current)                              | ✅                                            |
| Commission breakdown (earned / pending / potential)             | ✅                                            |
| Active subscriptions, customers, overdue, pending payments      | ✅                                            |
| Sales rep leaderboard (top 20, date-filtered)                   | ✅                                            |
| Revenue breakdown by property (date-filtered)                   | ✅                                            |
| **Property leaderboard** (top by subscriptions, top by revenue) | ✅ `GET /notifications/dashboard/properties/` |
| **Customer leaderboard** (top by revenue, top by subscriptions) | ✅ `GET /notifications/dashboard/customers/`  |
| **Date range filtering** (date_from / date_to params)           | ✅                                            |

---

### 5.8 Email Notifications ⚠️

| Item                                  | Status                                                                                                                |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| NotificationLog model + service layer | ✅                                                                                                                    |
| Email/SMS provider integration        | ⚠️ `NotificationService.send_email/send_sms` exists — wire up a real provider (SendGrid, Mailgun, Termii) in settings |
| Automated daily reminder cron tasks   | ⚠️ Celery beat installed; reminder task definitions + schedule registration needed                                    |

---

### 5.9 Workspace Settings ✅

Name/slug, logo, timezone, support contacts, member management, billing, commission rate defaults, notification toggles — all implemented.

---

### Remaining Work (Post-Gap)

1. **Automated reminder engine** — Define Celery tasks that run daily at 8 AM, scan installments by due-date proximity, fire email+SMS reminders per PRD schedule (7d, 2d, due-day, 2d-overdue), and respect the notification toggle settings.
2. **Email/SMS provider wiring** — Connect `NotificationService` to a real provider (e.g. SendGrid for email, Termii for SMS) via environment variables.
