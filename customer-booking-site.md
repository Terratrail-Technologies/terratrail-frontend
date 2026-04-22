## **Customer Booking Site (Public Estate Page)**

This is the public-facing page accessible to anyone. No login required.

**URL:** `app.terratrail.com/{workspace-slug}/estates`

---

### **Homepage — Estate Listing Page**

**Header:**

* Company logo  
* Company name  
* Navigation: Properties · About · Contact · WhatsApp button

**Hero section:**

* Company banner image or property cover image  
* Company tagline or description  
* "View Properties" CTA button

**Properties Grid:**

Each published property displayed as a card:

* Cover image  
* Property name  
* Location (City, State)  
* Property type (Residential Land · Farm Land)  
* Land sizes available (e.g. 300 SQM · 500 SQM · 600 SQM)  
* Price from (lowest active plan price)  
* Units available count  
* "View Property" CTA button

**Filters above grid:**

* Filter by property type  
* Filter by land size  
* Filter by price range

**Footer:**

* Company name  
* Support email  
* WhatsApp number  
* Social links (Website · Instagram · others configured in workspace settings)  
* "Powered by terratrail" tag

---

### **Individual Property Page**

**URL:** `app.terratrail.com/{workspace-slug}/estates/{property-slug}`

**Header:**

* Property cover image (full width)  
* Property name overlaid  
* Location  
* Status badge (e.g. "Selling Fast" if less than 20% slots remaining)

**Key details row:**

* Property type  
* Total SQM  
* Location  
* Units available

**Description:**

* Full property description rendered in rich text

**Gallery section:**

* Photo gallery (if images uploaded)  
* Lightbox view on click

**Land Sizes & Pricing section:**

For each land size:

* Land size (e.g. 300 SQM)  
* Available slots count  
* "Fully Subscribed" badge if no slots remaining

Pricing plans table per land size:

| Plan | Price | Payment Type | Duration | Initial Payment | Monthly | Action |
| ----- | ----- | ----- | ----- | ----- | ----- | ----- |
| Prelaunch Price | ₦2,000,000 | Outright | — | — | — | Book Now |
| 12-Month Plan | ₦3,500,000 | Installment | 12 months | ₦500,000 | ₦250,000 | Book Now |
| 24-Month Plan | ₦4,000,000 | Installment | 24 months | ₦500,000 | ₦145,833 | Book Now |

* Inactive or fully subscribed plans hidden from public view

**Amenities section:**

* List of property amenities with status badges  
* e.g. Perimeter Fencing — In Progress

**Documents section:**

* List of downloadable documents  
* e.g. Survey Plan (PDF download)  
* Brochure download (PDF)

**Location section:**

* Map showing property location  
* Street address  
* Nearest landmark  
* Additional directions

**Site Inspection section:**

* "Schedule a Site Visit" CTA  
* Opens inspection request form (see below)

**Support section:**

* WhatsApp button (links to workspace WhatsApp number)  
* Support email link  
* Intercom chat widget (if configured)

---

### **Book Now Flow**

Triggered when prospective customer clicks "Book Now" on a pricing plan.

**Important note:** This does NOT complete a booking. It captures the customer's interest and submits a booking request for admin to review and approve. Admin must have already added the customer OR admin approves the request and adds them manually.

**Step 1 — Personal Details:**

| Field | Type | Required |
| ----- | ----- | ----- |
| Full Name | Text | Yes |
| Email Address | Text | Yes |
| Phone Number | Text | Yes |
| Address | Text | No |
| How did you hear about us? | Dropdown (Online Ad · Friends/Family · Flyer · Realtor · Other) | No |
| Referral Code | Text | No — if referred by a realtor |

**Step 2 — Booking Summary (read-only confirmation):**

* Property name  
* Land size  
* Plan name  
* Price per unit  
* Payment type  
* If installment: initial payment · monthly amount · duration  
* Bank account to make initial payment to

**Step 3 — Confirmation:**

* "Submit Booking Request" CTA  
* Customer receives email: "Your booking request has been received. Our team will contact you shortly."  
* Admin receives email \+ in-app notification: "New booking request from \[Name\] for \[Property\] — \[Land Size\] — \[Plan\]"

---

### **Site Inspection Request Form**

| Field | Type | Required |
| ----- | ----- | ----- |
| Full Name | Text | Yes |
| Email Address | Text | Yes |
| Phone Number | Text | Yes |
| Property | Dropdown (published properties) | Yes |
| Preferred Date | Date picker | Yes |
| Preferred Time | Time picker | Yes |
| Inspection Type | Radio (Physical · Virtual) | Yes |
| Number of Persons | Number | Yes |
| Additional Notes | Textarea | No |

* On submit → request appears in Site Inspection module  
* Customer receives email confirmation with inspection details  
* Admin and assigned customer rep notified

---

## **Customer Dashboard (Self-Service Portal)**

This is the authenticated customer-facing portal. Login via OTP only.

**URL:** `app.terratrail.com/{workspace-slug}/portal`

---

### **Login Page**

* Company logo  
* "Access Your Portfolio" heading  
* Email address field  
* Phone number field  
* "Send OTP" button  
* OTP input field (appears after email \+ phone submitted)  
* "Verify & Login" button  
* Helper text: "Enter the email and phone number your estate manager registered you with"  
* Error state: "No account found. Please contact your estate manager."  
* OTP expiry notice: "Your OTP expires in 10 minutes"

---

### **Customer Dashboard — Home**

**Header:**

* Company logo  
* Customer name and initials avatar  
* Logout button

**Welcome message:** "Welcome back, \[Name\]. Here's a summary of your property portfolio."

---

### **Portfolio Summary Cards (top)**

* Total Properties Subscribed  
* Total Amount Paid  
* Total Outstanding Balance  
* Next Payment Due (date \+ amount)

---

### **Active Subscriptions List**

Each subscription displayed as a card:

**Subscription card:**

* Property name and cover image thumbnail  
* Land size  
* Plan name  
* Payment type (Outright · Installment)  
* Locked price  
* Progress bar: Amount Paid vs Total Price  
* Amount paid · Outstanding balance  
* Next due date · Next amount due  
* Status badge (Active · Completed · Defaulting)  
* Plot number (if allocated)  
* "View Details" CTA

---

### **Subscription Detail Page**

Accessed by clicking "View Details" on a subscription card.

**Header:**

* Property name  
* Land size · Plan name  
* Status badge

---

**Section 1 — Subscription Overview**

* Property name  
* Land size  
* Pricing plan  
* Payment type  
* Locked price  
* Initial payment amount  
* Monthly installment amount  
* Duration  
* Start date (date initial payment was approved)  
* Estimated completion date  
* Plot number (if allocated) — shown prominently with congratulations message

**Payment progress:**

* Total price  
* Amount paid  
* Outstanding balance  
* Installments paid / total installments  
* Visual progress bar

---

**Section 2 — Next Payment**

Displayed prominently if subscription is Active:

Next Payment Due  
₦250,000 due on June 5, 2026  
(14 days remaining)

Pay to:  
Bank: Opay  
Account Name: Test  
Account Number: 1234567890

Record Payment →

Overdue state:

⚠️ Payment Overdue  
₦250,000 was due on May 5, 2026  
(15 days overdue)

Please make payment immediately and record it below.

Record Payment →

---

**Section 3 — Installment Schedule**

Full installment table:

| \# | Due Date | Amount | Status | Payment Date | Receipt |
| ----- | ----- | ----- | ----- | ----- | ----- |
| Initial | Mar 5, 2026 | ₦500,000 | Paid | Mar 3, 2026 | View |
| Month 1 | Apr 5, 2026 | ₦250,000 | Paid | Apr 4, 2026 | View |
| Month 2 | May 5, 2026 | ₦250,000 | Overdue | — | — |
| Month 3 | Jun 5, 2026 | ₦250,000 | Upcoming | — | — |

* Paid installments shown in green  
* Overdue in red with "Record Payment" button  
* Due today in amber with "Record Payment" button  
* Upcoming in grey — no action available

---

**Section 4 — Record a Payment**

Available on Due or Overdue installments only:

| Field | Type | Required |
| ----- | ----- | ----- |
| Installment | Dropdown (Due · Overdue only) | Yes |
| Amount Paid | Number (₦) | Yes |
| Payment Date | Date picker | Yes |
| Bank Account Paid To | Dropdown (property active bank accounts) | Yes |
| Transaction Reference | Text | No |
| Receipt | File upload (image or PDF) | Yes |

* Submit → status changes to Pending Approval  
* Confirmation message: "Payment submitted successfully. Awaiting admin approval."  
* Admin notified immediately

**Rules:**

* Receipt upload is mandatory  
* Cannot submit if installment already has a Pending payment  
* Cannot submit payment for Upcoming installments  
* Cannot edit or delete a submitted payment

---

**Section 5 — Payment History**

| Date | Amount | Installment | Bank Paid To | Status | Receipt |
| ----- | ----- | ----- | ----- | ----- | ----- |
| Mar 3 | ₦500,000 | Initial | Opay | Approved | View |
| Apr 4 | ₦250,000 | Month 1 | Opay | Approved | View |
| May 10 | ₦250,000 | Month 2 | Opay | Pending | View |

---

**Section 6 — Property Information**

* Property name  
* Location  
* Property type  
* Description  
* Amenities list  
* Documents available for download  
* Map

---

**Section 7 — Support**

* WhatsApp button (links to workspace WhatsApp number)  
* Support email link  
* Intercom chat (if configured)  
* "Contact your estate manager" prompt

---

### **Notifications Page**

Customer can view all notifications received:

| Date | Message | Type |
| ----- | ----- | ----- |
| Apr 19 | Your payment of ₦250,000 has been approved | Payment |
| Apr 5 | Payment reminder: ₦250,000 due today | Reminder |
| Mar 5 | Welcome to Green Acres Estate | Welcome |

---

## **Key Rules Reflected in the UI**

**Public estate page:**

* Fully subscribed land sizes show "Fully Subscribed" — no Book Now button  
* Inactive pricing plans are hidden from public view  
* Price increases on plans are reflected immediately on public page  
* Existing subscribers are unaffected by price changes

**Customer portal:**

* Customer can only see their own subscriptions  
* If customer has multiple subscriptions they see all on the home dashboard  
* OTP authentication required every session  
* Session expires after 30 minutes of inactivity  
* Allocated plot shown prominently with congratulations message  
* Completed subscriptions remain visible in portfolio but show "Completed" badge  
* Customer cannot access another customer's data under any circumstance

