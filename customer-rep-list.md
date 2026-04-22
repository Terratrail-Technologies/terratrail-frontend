## **Customer Rep List Page**

**Header:** Customer Representatives — Manage your team and their assigned properties

**Summary cards (top):**

* Total Customer Reps  
* Total Properties Managed  
* Total Customers Managed  
* Total Subscriptions Managed

**Table columns:**

* Rep Name  
* Email  
* Phone  
* Properties Assigned  
* Customers Managed  
* Active Subscriptions  
* Total Revenue Managed  
* Status (Active · Inactive)  
* Actions (View · Edit · Deactivate)

**Search and filters:**

* Search by name or email  
* Filter by status: All · Active · Inactive  
* Filter by assigned property

**Action buttons (top right):**

* Invite via Email  
  * Add Customer Rep

---

## **Customer Rep Detail Page**

**Header:** Rep name · Status badge

**Action buttons:**

* Edit Rep  
* Deactivate  
* Reassign Customers

---

### **Tab 1 — Overview**

**Rep profile:**

* Full name  
* Email  
* Phone  
* Date added  
* Status  
* Added by (admin name)

**Performance summary:**

* Total properties assigned  
* Total customers managed  
* Active subscriptions  
* Completed subscriptions  
* Defaulting subscriptions  
* Total revenue managed (sum of collected payments from their customers)  
* Outstanding balance across their customers

**Permissions summary:**

* Can Approve/Reject Bookings: Yes / No  
* Can Manage Subscriptions: Yes / No  
* Can Manage Sales Reps and Commission: Yes / No

---

### **Tab 2 — Assigned Properties**

List of all properties this rep is assigned to manage:

| Column | Description |
| ----- | ----- |
| Property Name | Name of the property |
| Property Type | Residential Land · Farm Land |
| Location | City, State |
| Customers | Number of customers they manage on this property |
| Active Subscriptions | Count of active subscriptions |
| Revenue Collected | Total approved payments from their customers on this property |
| Outstanding | Total outstanding balance from their customers |
| Actions | View Property · Unassign |

**Assign Property button** — admin can assign additional properties to this rep

**Rules:**

* A property can be assigned to multiple customer reps  
* Unassigning a rep from a property does not affect existing customer subscriptions  
* Admin must reassign those customers to another rep or leave unassigned

---

### **Tab 3 — Managed Customers**

Full list of all customers assigned to this rep across all properties:

| Column | Description |
| ----- | ----- |
| Customer Name | Name |
| Phone | Contact number |
| Property | Which property |
| Land Size | Which land size |
| Plan | Pricing plan name |
| Locked Price | Customer's locked-in price (₦) |
| Amount Paid | Total approved payments (₦) |
| Outstanding | Remaining balance (₦) |
| Next Due Date | Next installment due date |
| Subscription Status | Active · Completed · Defaulting · Cancelled |
| Actions | View Customer |

**Search and filters:**

* Search by customer name  
* Filter by property  
* Filter by subscription status

---

### **Tab 4 — Activity Log**

Chronological record of all actions this rep has taken on the platform:

| Column | Description |
| ----- | ----- |
| Date | When the action occurred |
| Action | e.g. Approved booking · Recorded payment · Updated customer profile |
| Customer | Which customer was affected |
| Property | Which property |
| Details | Specific details of the action |

---

### **Tab 5 — Profile**

* Full name  
* Email  
* Phone  
* Date added  
* Added by  
* Status  
* Edit profile option

---

## **Permissions (Controlled from Workspace Settings)**

These apply globally to all customer reps in the workspace:

| Permission | Description | Default |
| ----- | ----- | ----- |
| Allow Customer Reps to Approve/Reject Bookings | Rep can approve or reject bookings same as admin | Off |
| Allow Customer Reps to Manage Subscriptions | Requires booking permission to be on first | Off |
| Allow Customer Reps to Manage Sales Reps and Commission | Rep can see and manage all realtors | Off |

---

## **Key Rules Reflected in the UI**

* Customer rep can only see customers and properties assigned to them  
* Customer rep cannot see other reps' customers  
* If a customer rep is deactivated their assigned customers remain but become unassigned  
* Admin must reassign unassigned customers manually or via bulk reassign  
* Reassign Customers button allows admin to move all of a rep's customers to another rep in one action  
* A customer can only be assigned to one customer rep at a time  
* Revenue figures shown to customer rep are limited to their own assigned customers only  
* Customer rep cannot change their own permissions

---

