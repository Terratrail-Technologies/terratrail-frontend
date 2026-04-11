Product Requirements Document
TerraTrail — Real Estate Sales & Subscription Management Platform



3. Navigation & Information Architecture
3.1 Main Dashboard Sidebar
Item
Description
Overview
Analytics dashboard
Properties
Property listing management
Customers
Customer and subscription management
Sales Reps
Sales agent and commission tracking
Notifications
In-app notification center
Data Export
Export workspace data
Workspace
Link to workspace settings

Bottom sidebar: Plan usage meter · Branded link setup CTA · View estate · Help · Account
3.2 Settings Sidebar
Item
Description
General
Workspace details + preferences
People
Team members and roles
Billing
Plan and billing management
Add-ons
Optional feature add-ons
Activity Logs
Audit trail
Permissions
Customer rep permission controls
Email Notifications
Email trigger configuration


4. Feature Specifications

4.1 Overview Dashboard
Summary Stats (4 Cards)
Card
Sub-label
description
Properties
No of properties: no of  active properties
Active properties are those still on sales
Customers
Total no of customers and no of active properties (with active subscriptions)
Active customers still paying installments
Subscriptions
Total no of sub and no of  active (instalment)



Financial Panel (Dark Block)
Metric
Description
Total Revenue
From paid subscription payments
Outstanding Balance
Unpaid installments from active subscriptions
Potential Revenue
Total contract value if all subscriptions pay in full
Net Revenue
Revenue minus commissions

Commission Cards
Card
Description
Approved referral payments:
Total commissions calculated from the approved subscription/installment payments
Payouts
What has been paid to the realtor
Pending payouts
Commission earned but not yet paid
Potential referral payments
Total commission of all referrals if the payment is complete.

Analytics Leaderboards (side-by-side pairs)
Properties: Top by Subscriptions · Top by Revenue
Sales Reps: Top Sales Reps (by referrals)
Customers: Top by Revenue · Top by Subscriptions
Quick Links (Bottom)
Add a property · · Manage customers · Invite team member
Requirements:
All figures in Nigerian Naira (₦)
"Last 24h:  X payments" summary in header
Empty states must show instructional placeholder copy

4.2 Properties Module
4.2.1 Properties List View
Search bar · Filter button · "+ Add Property" CTA
Empty state: "No properties yet" + CTA
Property listing:
A table or gri
4.2.2 Create / Edit Property — 7-Step Wizard
After initial creation (Step 1), the page title changes to "Edit Property" and two additional CTAs appear in the header: Manage Commission and Open Booking Form.
Step 1 — Basic Information
Field
Type
Notes
Property Name
Text
e.g. "TehillahEstate"
Property Type
Dropdown
Options: Residential Land, Farm Land (2 types confirmed)
Description
Rich text
Supports Markdown & HTML; full toolbar
Total SQMs
Number
e.g. 100
Brochure (PDF)
File upload
Optional; available after initial save only

CTA: "Create Property" → saves record and moves to step 2

Step 2 — Property Gallery
Cover Image: Single large image upload (drag-and-drop zone)
Gallery Images: Up to 10 images; drag to reorder
CTA: "Save" or "Save & Continue →"
Empty state: "No gallery images added yet — Upload images using the button above"

Step 3 — Location Details
Field
Type
Notes
Street Address
Text
Optional
City
Text


State
Dropdown
e.g. Lagos
Country
Dropdown
Default: Nigeria
Postal Code
Text
Optional
Nearest Landmark
Text
Optional
Additional Directions
Textarea
Optional
Latitude
Number
Auto-fills via "Use Current Location"
Longitude
Number
Auto-fills via "Use Current Location"
Map Preview
Embedded map
Live preview of pinned coordinates

Location helper: "Get Location Coordinates" — two options: "Use Current Location" (browser geolocation) or external "Location Finder" link
Success toast: "Location coordinates updated!"
CTA: "Save" or "Save & Continue →"

Step 4 — Property Amenities
Add amenities that describe property features (e.g., perimeter fencing)
Empty state: "No amenities added yet" + "+ Add your first amenity" CTA
Add New Amenity modal:
Field
Type
Notes
Amenity Name
Text
e.g. "Perimeter Fencing"
Status
Dropdown
Options include: Not Started (others likely: In Progress, Completed)
Description
Textarea
Optional

"Create more" checkbox — keeps modal open to batch-add amenities
CTA: Cancel · Create
Each amenity listed with status badge, edit (pencil) and delete (trash) icons
Success toast: "Amenity added successfully"
CTA: "Continue →" (amenities are optional — can skip) 
CTA: "Save" or "Save & Continue →"



Step 5 — Property Documents
state legal and supporting documents customers will receive after completed (survey plans, deeds of assignment, etc.)
Empty state: "No documents added — Add important property documents like survey plans, deeds of assignment, and other legal documents to make them available to potential buyers."
CTA: "+ Add Document" button (top right) · "+ Add your first document" (in empty state)
CTA: "Save" or "Save & Continue →"


⚠️ Publishing requirement: At least one document is required to publish the property (enforced at preview stage).

Step 6 — Pricing & Payment Plans
Purpose: Set up selling prices and installment payment plans for the property
Multiple pricing plans can be created per property (e.g., Launch Price, Prelaunch Price, Price per land size)
Create Pricing Plan modal:
Field
Type
Notes
Active Status
Toggle (on)
When on: plan is visible to customers
Plan Name
Text
e.g. "Pre-launch Price", "Launch Price"
Currency
Dropdown
Default: NGN
Price Per Unit
Number
Price per SQM or unit
Payment Spread Method
Radio
Two options (see below)

Payment Spread Method options:
Option
Description
Example
Initial Payment Separate (default)
Initial payment is upfront; full duration of installments follow
3-month plan with 30% initial → 1 initial + 3 installments = 4 total payments
Initial Payment as First Month
Initial payment counts as month 1; remaining installments spread over duration - 1
3-month plan with 30% initial → 3 total payments (initial is month 1)

⚠️ Lock warning: "This setting locks once a booking uses this pricing plan."
CTA: Cancel · Create Plan
Pricing Plans list view:
Each plan card shows: Plan Name · Status badge (Active) · Price (NGN) · Created timestamp · Payment plan count · Payment Plans link · Edit · Remove
CTA: "Add Pricing Plan" (top right) · "Continue →"
A property has multiple land sizes (e.g. 300 sqm, 500 sqm, 600 sqm). Each land size is essentially its own pricing tier.
For each land size, there are price types:
	∙	Prelaunch Price
	∙	Launch Price
	∙	Outright Price
	∙	Installment Price (which then branches further)
When a customer is booking, the selection flow should be:
	1.	Select land size
	2.	Select price type → Outright or Installment
	3.	If Outright → one total price, pay in full
	4.	If Installment → select a duration plan (e.g. 6 months, 12 months, 24 months)
	5.	If Installment → choose payment spread method:
	∙	Initial Payment Separate (default)
	∙	Initial Payment as First Month

Step 7 — Payment Methods
Purpose: Configure how the estate receives customer payments for this property
Multiple payment methods can be added
Add Payment Method modal:
Option
Description
Bank Transfer (default selected)
Receive payments via bank transfer
Online Payment
Accept payments via payment gateway

Bank Transfer fields:
Bank Name (text)
Account Name (text)
Account Number (text, minimum 10 digits, numbers only)
Status toggle: "This payment method is available for tenants"
Payment methods list view:
Grouped by type (e.g., "Bank Transfer Methods — 1 Bank")
Each method shows: Bank name · Status badge (Active) · Account Name · Account Number · ⋯ more options menu
CTA: "+ Add Method" · "Preview & Publish"

Property Preview & Publish:
Full visual preview of how the property will appear on the public estate page
Shows: Cover image placeholder · Property name · Location · Type + Units · Description · Pricing Plans (all active plans with price per sqm)
Status badge: "Draft"
Issues panel: Red error list showing blockers (e.g., "Property gallery is required", "At least one document is required")
Issue counter badge: "2 issues to fix" (top right, red)
CTAs: "Back to Editing" · "Publish Property" (greyed out until all issues resolved)
Publishing requirements (enforced):
Property gallery image (at least cover image)
At least one document uploaded

4.3 Customers Module
From the Overview, navigation, and plan features, the Customers module tracks:
Customer profile (name, contact)
Active subscriptions (property + payment plan)
Subscription status (active / pending / cancelled)
Payment history and installment schedule
Assigned Customer Rep
Requirements:
Search by name or email
Filter by subscription status
Display subscription count and payment standing per customer
Link to customer self-service portal (available on all plans)

4.4 Customer Reps Module
Assign internal team members to manage specific properties and customers
Track subscriptions managed and revenue generated per rep
Leaderboards on Overview: Top by Subscriptions · Top by Revenue

4.5 Sales Reps (Realtors) Module
Summary Metrics
Metric
Description
Pending to Earn
From unpaid referral payments
Total Earned
Paid to reps + pending payout
Total Earning Potential
If all referral payments made

Sales Rep Tiers (3 confirmed)
Tier
Self-registration via invite link
Sales Rep (Starter)
app.TerraTrail.com/invites/{token}
Sales Rep (Senior)
app.TerraTrail.com/invites/{token}
Sales Rep (Legend)
app.TerraTrail.com/invites/{token}

Each tier has an independently resettable invite link
Resetting invalidates the old link immediately
Success toast: "Invite link reset successfully"
Rep self-registers via link → gets unique referral code automatically
Table Columns
Sales Representative · Tier · Referral Code · Referrals · Total Earned
Actions
Commission Settings (gear icon)
Open Invite Links (link icon)
Requirements:
Commission rates configurable per tier in Commission Settings
Commission triggered automatically when a referred customer makes a payment
Payout status trackable: pending / paid

4.6 Site Inspection Module
Page title: "Site Inspection Requests (N)"
Subtitle: "All requests across all properties"
Export: "Download CSV" button
Table columns: Contact · Properties · Date & countdown · Type · Category · Persons · Attended
Requests originate from the public estate page (customer self-schedule)
Attendance status manually updatable by admin or customer rep
Export: Download CSV of all inspection records

4.7 Data Export Module
Page title: "Data Export"
Subtitle: "Export your workspace data in various formats for analysis and reporting"
Export Types (8 confirmed):
Type
Icon
Customer Data
Person
Bookings
Calendar
Property Data
Building
Customer Representatives
Badge
Payment Transactions
Document
Payment Installments
Document
Revenue Reports
Chart
Activity Logs
Clock

Export history panel below: shows previously generated files for re-download
Empty state: "No export history yet"

4.8 Workspace Settings
4.8.1 General
Workspace Details sub-section:
Logo (image upload)
Workspace Name (text)
Workspace Slug (app.TerraTrail.com/{slug}) — editable
Completion indicator: "In Progress: 50%"
Preferences sub-section:
Timezone (dropdown)
Region (dropdown)
Initial Payment Counts as First Month (toggle, off by default)
Create Estate Public Pages (toggle, on by default) — controls sitemap inclusion
Public link shown when enabled: https://app.TerraTrail.com/{slug}/estates
Completion indicator: "Incomplete: 25%"
Help Center sub-section:
Intercom App ID (connects in-app live chat to customer portal)
WhatsApp Number (generates WhatsApp support link for customers; must include country code)
Support Email
Completion: "Not Started"
Social Links sub-section:
Website URL
Instagram
(Additional fields below fold — not captured)

4.8.2 People
List of all workspace members
Search by name or email
Filter by role: All · Owner · Admin · Customer Representative · Customer · Sales Representative
Actions: Share Invite Links · Send Invitations via email
4.8.3 Billing & Subscription
Plan Tiers (5 confirmed):
Plan
Price (₦/year)
Projects
Customers
Notes
Free
₦0
1
2
For trying out the platform
Starter
₦350,000
3
1,000
For small teams
Growth
₦750,000
10
5,000
Recommended
Scale
₦1,500,000
30
15,000
For larger portfolios
Enterprise
Custom
Unlimited
Unlimited
Custom integrations & SLA

Plan Features Comparison:
Feature
Free
Starter
Growth
Scale
Enterprise
CORE PLATFORM










Booking & subscription management
✓
✓
✓
✓
✓
Installment tracking & reminders
✓
✓
✓
✓
✓
Unit inventory tracking
✓
✓
✓
✓
✓
Admin & customer rep roles
✓
✓
✓
✓
✓
Approval workflows
✓
✓
✓
✓
✓
Subscription downsizing & cancellation
✓
✓
✓
✓
✓
Property appreciation tracking
✓
✓
✓
✓
✓
Customer self-service portal
✓
✓
✓
✓
✓
Email support
✓
✓
✓
✓
✓
BRANDING










Custom subdomain
—
✓
✓
✓
✓
SCALE










Projects
1
3
10
30
Unlimited
Customers
2
1,000
5,000
15,000
Unlimited
ENTERPRISE










Custom integrations & SLA
—
—
—
—
✓

Enterprise: "Contact Sales" external link
"Need help? Contact Support" button at page bottom

4.8.4 Add-ons
Add-on
Description
Requirement
Custom Subdomain
Branded subdomain (e.g. yourcompany...)
Starter plan or above

Each add-on has a "Configure" expandable action
Locked add-ons show upgrade prompt inline

4.8.5 Activity Logs
Title: "Activity Logs — Track all activities happening in your workspace"
Refresh button (top right)
Paginated list: "Showing 1–5 of 5 · Page 1 of 1"
Log entry format:
User avatar (initials) · Action description · Entity type tag (e.g., "Workspace" link) · "View Details" link · Relative timestamp (e.g., "16 minutes ago")
Confirmed logged actions (from screenshots):
"Praise generated an invite link for role 'salesRep'" (×3)
"Praise generated an invite link for role 'customerRep'"
"Praise created workspace 'Tehillah'"
Requirements:
All workspace actions are automatically logged
Logs are paginated
Each log entry is drillable via "View Details"
End of logs shows: "You've reached the end of activity logs for this workspace."

4.8.6 Permissions
Title: "Permissions — Control what customer reps and other roles can do in this workspace"
Customer Representatives Permissions (3 toggles):
Permission
Description
Default
Allow Customer Representatives to Approve/Reject Bookings
Customer reps can approve or reject bookings (same as admin for that action)
Off
Allow Customer Representatives to Manage Subscriptions
Requires "Approve/Reject Bookings" to be enabled first (shown greyed out when parent is off)
Off
Allow Customer Representatives to Manage Sales Reps and Commission
Customer reps can see all sales representatives and manage them (same permission as admin for sales-reps area)
Off

Completion: "Not Started"
CTA: "Save Changes"
Requirements:
Permission 2 (Manage Subscriptions) is dependent on Permission 1 being enabled
Dependent toggles are visually greyed out and locked when parent is disabled

4.8.7 Email Notifications
Title: "Email Notifications"
Subtitle: "Choose when to send email notifications for bookings, payments, and subscriptions"
Completion: "Completed: 100%" ✅
Bookings section:
Trigger
Who receives it
Default
Booking Approved or Rejected
Customer
On
New Booking Submitted
Admins + assigned customer rep
On

Payments & Subscriptions section:
Trigger
Who receives it
Default
Payment Receipt Uploaded
Admins + assigned customer rep
On
Payment Approval & Rejection
Customer + customer rep
On
Payment Reminders
Customers + admins (7 days before, 2 days before, due date, 2 days after)
On
Subscription Completed
Customer + customer rep
On

Properties section:
Trigger
Who receives it
Default
New Property Published
All customers + all sales reps (with property details and, for reps, a share link with their referral code)
On

Requirements:
All email notification toggles are ON by default
Payment reminders follow a 4-point schedule: 7 days before, 2 days before, on due date, 2 days after
When a new property is published, sales reps receive a personalised email with their referral code link

4.9 Account Settings
Purpose: Personal account management (separate from workspace settings).
Section 1 — Your Avatar
Initials-based gradient avatar displayed
"Change Avatar" button
Section 2 — Your Personal Information
Field
Type
Title
Dropdown (Mr., Mrs., Dr., etc.)
Full Name (Surname Last)
Text
Email
Text (pre-filled, likely read-only)
Phone
Text (+234 format shown)
Gender
Dropdown
Date of Birth
Date
Occupation
Dropdown
Marital Status
Dropdown
Address
Text
Country
Dropdown
State
Dropdown
Nationality
Dropdown

Completion: "Incomplete: 17%"
CTA: "Save Changes"
Section 3 — Your Next of Kin Information
Field
Type
Next of Kin Name
Text
Relationship
Dropdown
Address
Text
Phone Number
Text
Email
Text

Completion: "Not Started"
CTA: "Save Changes"
Section 4 — Referral Information
Field: Referral Source (dropdown)
Options: Online Ad · Friends/Family · Flyer · Other
(Tracks how the user heard about TerraTrail)
Section 5 — Notification Preferences
Notification Sounds toggle (On by default) — plays sounds when new notifications arrive
Section 6 — Delete Account
Label: "Delete Account — Permanently delete your account and all of its data. This action is irreversible."
CTA: "Delete Account" (red destructive button)

5. Payment Architecture
5.1 Payment Collection Methods (confirmed)
TerraTrail supports two payment collection modes per property:
Method
How it works
Bank Transfer
Admin enters bank details (bank name, account name, account number). Customers transfer directly to this account and upload a payment receipt. Admin approves the receipt.
Online Payment
Payment collected via an integrated payment gateway (gateway partner not named in UI).

Key insight: This answers the previously open question — TerraTrail is NOT purely manual. Both manual (bank transfer + receipt upload) and automated (online gateway) payment collection are supported per property.
5.2 Payment Flow (Bank Transfer)
Customer selects a payment plan and makes a bank transfer
Customer uploads payment receipt via their self-service portal
System notifies admins and the assigned customer rep (email trigger: "Payment Receipt Uploaded")
Admin or customer rep (if permitted) approves or rejects the receipt
System emails customer with approval/rejection result
Approved payments update the installment schedule and revenue metrics
5.3 Pricing Plan Structure
Each property can have multiple pricing plans (e.g., Prelaunch Price, Launch Price)
Each pricing plan has a price per unit (SQM) and currency (NGN)
Each pricing plan can have multiple payment plan schedules (installment configurations)
Payment spread method (Initial Separate vs. Initial as First Month) locks once a booking is made on that plan

6. Public Estate Page & Customer Portal
6.1 Public Estate Page
Toggle-controlled: "Create Estate Public Pages" in Workspace Settings
When ON: included in sitemap for SEO
URL: https://app.TerraTrail.com/{slug}/estates
Displays all published properties with cover images, type, units, pricing plans, and description
Visitors can download property brochures (PDF)
Visitors can submit site inspection requests
Publishing a new property triggers an email to all customers and sales reps
6.2 Customer Self-Service Portal
Available on all plans (confirmed in plan features table)
Customers can view their subscriptions, payment history, and installment schedules
Customers upload payment receipts through the portal
Customers can access support via Intercom, WhatsApp link, or support email (configured per workspace)

7. Monetization & Pricing
Plan
Price (₦/year)
Projects
Customers
Custom Subdomain
Custom Integrations
Free
₦0
1
2
—
—
Starter
₦350,000
3
1,000
✓
—
Growth
₦750,000
10
5,000
✓
—
Scale
₦1,500,000
30
15,000
✓
—
Enterprise
Custom
Unlimited
Unlimited
✓
✓

All plans include the full core platform feature set. Differentiation is by scale and branding.

8. User Flows
8.1 Admin Onboarding
Sign up → Enter display name → Name workspace → Overview (empty) → Configure General Settings → Add first property
8.2 Create & Publish a Property (7 Steps)
Step 1: Basic info → Step 2: Gallery (cover + up to 10 images) → Step 3: Location (address + coordinates + map) → Step 4: Amenities (optional) → Step 5: Documents (required for publish) → Step 6: Pricing & Payment Plans → Step 7: Payment Methods → Preview & Publish (fix issues if any) → Published
8.3 Add & Onboard a Customer
Customers → Add customer → Assign property + pricing plan → Customer gets portal access → Customer makes bank transfer → Uploads receipt → Admin approves → Installment schedule activated
8.4 Onboard a Sales Rep
Sales Reps → Open Invite Links → Select tier → Copy link → Share → Rep self-registers → Unique referral code assigned → Rep appears in Sales Reps table
8.5 Track Commission
Customer referred by sales rep makes a payment → Commission calculated automatically → Shows in "Pending to Earn" → Admin approves payout → Moves to "Total Earned"
8.6 Site Inspection
Customer submits inspection request from public estate page → Appears in Site Inspection module → Admin reviews Contact, Property, Date, Type, Persons → Updates Attended status post-visit → Export CSV for records
8.7 Data Export
Data Export → Select export type → Configure → Generate → Download from export history
8.8 Monitor Performance
Overview → Review revenue / outstanding balance / potential revenue / commission metrics → Check leaderboards for top properties, reps, customers

9. Non-Functional Requirements
Area
Requirement
Currency
All monetary values in Nigerian Naira (₦ / NGN)
Responsiveness
Fully mobile-responsive web app
Performance
Dashboard metrics load within 2 seconds
Empty States
All lists and analytics panels must have instructional empty states
Toast Notifications
Green success toasts for: property created, amenity added, location updated, invite link reset
Completion Indicators
Settings sections display completion % with status icon (amber = in progress, red = incomplete, green = complete)
Dependent Toggles
UI must visually lock dependent settings when parent toggle is off
Publish Validation
Property publish must enforce: gallery image required + at least one document required
Roles & Auth
Owner > Admin > Customer Rep (configurable) / Sales Rep / Customer
Audit Trail
All workspace actions logged automatically in Activity Logs
SEO
Public estate pages included in sitemap when public pages toggle is ON
Integrations
Intercom (live chat portal), WhatsApp support link, online payment gateway, browser geolocation


10. Open Questions — Final Status
✅ All Major Questions Resolved
#
Question
Resolution
1
Property wizard steps 2–7
Fully confirmed: Gallery · Location · Amenities · Documents · Pricing Plans · Payment Methods
2
Property type options
Confirmed: Residential Land · Farm Land
3
Payment collection method
Confirmed: Bank Transfer (manual receipt upload + admin approval) AND Online Payment (via gateway)
4
Does a customer portal exist?
Confirmed on all plans
5
Sales rep tiers
Confirmed: Starter · Senior · Legend (3 tiers)
6
Email notification triggers
Fully documented: 7 triggers across Bookings, Payments & Subscriptions, Properties
7
Permissions module
Fully documented: 3 customer rep permission toggles with dependency logic
8
Activity Logs
Confirmed: Paginated, real-time, drillable via "View Details"
9
Account Settings
Fully documented: Personal info · Next of Kin · Referral source · Notification prefs · Delete account
10
Billing tiers
All 5 tiers confirmed with ₦ pricing
11
Publish requirements
Confirmed: Gallery image + at least one document required
12
Amenity statuses
Confirmed: At minimum "Not Started" (likely also In Progress, Completed)

⚠ Minor Remaining Gaps
#
Gap
1
Online Payment gateway partner — "Accept payments via payment gateway" shown but gateway name (Paystack, Flutterwave, etc.) not visible
2
Payment plan installment fields — the installment configuration detail (duration, %, intervals) within a pricing plan is not captured
3
Subscription downsizing & cancellation UI — confirmed as a feature; UI flow not captured
4
Property appreciation tracking UI — confirmed as a feature; UI and data model not captured
5
Customers module detail — customer profile, subscription list, and payment history screens not captured
6
Social links fields below fold — only Website and Instagram visible; others unknown
7
Onboarding progress bar bug — step 2/2 shows 50% instead of 100% (confirmed bug)



