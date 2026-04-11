// Mock data for TerraTrail platform

export const workspace = {
  name: "Tehillah Estate",
  slug: "tehillah",
  logo: null,
  plan: "Growth",
  timezone: "Africa/Lagos",
  region: "Nigeria",
};

export const properties = [
  {
    id: "1",
    name: "Tehillah Estate Phase 1",
    type: "Residential Land",
    totalSqm: 50000,
    status: "published",
    location: {
      address: "Lekki-Epe Expressway",
      city: "Lagos",
      state: "Lagos",
      country: "Nigeria",
    },
    coverImage: null,
    gallery: [],
    description: "Premium residential land in the heart of Lekki with excellent infrastructure and proximity to major landmarks.",
    subscriptions: 24,
    revenue: 156000000,
    createdAt: "2025-11-15",
  },
  {
    id: "2",
    name: "Green Valley Farms",
    type: "Farm Land",
    totalSqm: 100000,
    status: "published",
    location: {
      address: "Ibeju-Lekki",
      city: "Lagos",
      state: "Lagos",
      country: "Nigeria",
    },
    coverImage: null,
    gallery: [],
    description: "Expansive farmland perfect for agricultural ventures with fertile soil and water access.",
    subscriptions: 12,
    revenue: 48000000,
    createdAt: "2025-12-01",
  },
];

export const customers = [
  {
    id: "1",
    name: "Chukwudi Okafor",
    email: "chukwudi.okafor@email.com",
    phone: "+234 803 456 7890",
    subscriptions: 2,
    activeSubscriptions: 2,
    totalRevenue: 8500000,
    status: "active",
    customerRep: "Amaka Johnson",
    joinedAt: "2025-11-20",
  },
  {
    id: "2",
    name: "Blessing Adeyemi",
    email: "blessing.adeyemi@email.com",
    phone: "+234 805 234 5678",
    subscriptions: 1,
    activeSubscriptions: 1,
    totalRevenue: 4200000,
    status: "active",
    customerRep: "Amaka Johnson",
    joinedAt: "2025-12-05",
  },
  {
    id: "3",
    name: "Ibrahim Mohammed",
    email: "ibrahim.m@email.com",
    phone: "+234 807 890 1234",
    subscriptions: 1,
    activeSubscriptions: 0,
    totalRevenue: 12000000,
    status: "completed",
    customerRep: "Tunde Balogun",
    joinedAt: "2025-10-10",
  },
];

export const salesReps = [
  {
    id: "1",
    name: "Ngozi Eze",
    tier: "Legend",
    referralCode: "NGOZ-2024",
    referrals: 18,
    totalEarned: 2340000,
    pendingPayout: 450000,
    email: "ngozi.eze@email.com",
    phone: "+234 809 123 4567",
    joinedAt: "2025-09-01",
  },
  {
    id: "2",
    name: "Yusuf Bello",
    tier: "Senior",
    referralCode: "YUSF-2024",
    referrals: 12,
    totalEarned: 1560000,
    pendingPayout: 280000,
    email: "yusuf.bello@email.com",
    phone: "+234 808 765 4321",
    joinedAt: "2025-10-15",
  },
  {
    id: "3",
    name: "Ada Chukwu",
    tier: "Starter",
    referralCode: "ADAC-2024",
    referrals: 6,
    totalEarned: 780000,
    pendingPayout: 120000,
    email: "ada.chukwu@email.com",
    phone: "+234 806 543 2109",
    joinedAt: "2025-11-20",
  },
];

export const customerReps = [
  {
    id: "1",
    name: "Amaka Johnson",
    email: "amaka.johnson@terratrail.com",
    customersManaged: 45,
    subscriptionsManaged: 67,
    revenue: 89000000,
    role: "Customer Representative",
  },
  {
    id: "2",
    name: "Tunde Balogun",
    email: "tunde.balogun@terratrail.com",
    customersManaged: 32,
    subscriptionsManaged: 48,
    revenue: 62000000,
    role: "Customer Representative",
  },
];

export const siteInspections = [
  {
    id: "1",
    contact: {
      name: "Folake Williams",
      phone: "+234 803 567 8901",
      email: "folake.w@email.com",
    },
    property: "Tehillah Estate Phase 1",
    date: "2026-04-12",
    time: "10:00 AM",
    type: "In-Person",
    category: "Individual",
    persons: 2,
    attended: false,
    status: "upcoming",
  },
  {
    id: "2",
    contact: {
      name: "Emeka Obi",
      phone: "+234 805 432 1098",
      email: "emeka.obi@email.com",
    },
    property: "Green Valley Farms",
    date: "2026-04-10",
    time: "2:00 PM",
    type: "In-Person",
    category: "Family",
    persons: 4,
    attended: true,
    status: "completed",
  },
];

export const transactions = [
  {
    id: "1",
    customer: "Chukwudi Okafor",
    property: "Tehillah Estate Phase 1",
    amount: 2500000,
    type: "Installment",
    status: "approved",
    method: "Bank Transfer",
    date: "2026-04-05",
  },
  {
    id: "2",
    customer: "Blessing Adeyemi",
    property: "Tehillah Estate Phase 1",
    amount: 1500000,
    type: "Initial Payment",
    status: "pending",
    method: "Bank Transfer",
    date: "2026-04-07",
  },
];

export const activityLogs = [
  {
    id: "1",
    user: "Praise Adebayo",
    action: "generated an invite link for role 'salesRep'",
    entity: "Workspace",
    timestamp: "16 minutes ago",
  },
  {
    id: "2",
    user: "Praise Adebayo",
    action: "generated an invite link for role 'customerRep'",
    entity: "Workspace",
    timestamp: "45 minutes ago",
  },
  {
    id: "3",
    user: "Praise Adebayo",
    action: "created workspace 'Tehillah'",
    entity: "Workspace",
    timestamp: "2 hours ago",
  },
];

// Dashboard statistics
export const dashboardStats = {
  properties: {
    total: 2,
    active: 2,
  },
  customers: {
    total: 3,
    active: 2,
  },
  subscriptions: {
    total: 37,
    active: 28,
  },
  financial: {
    totalRevenue: 204000000,
    outstandingBalance: 89000000,
    potentialRevenue: 356000000,
    netRevenue: 187000000,
  },
  commission: {
    approvedReferralPayments: 4680000,
    payouts: 3830000,
    pendingPayouts: 850000,
    potentialReferralPayments: 7200000,
  },
  recentPayments: 8,
};

export const pricingPlans = [
  {
    name: "Free",
    price: 0,
    period: "year",
    projects: 1,
    customers: 2,
    features: [
      "Booking & subscription management",
      "Installment tracking & reminders",
      "Unit inventory tracking",
      "Admin & customer rep roles",
      "Approval workflows",
      "Customer self-service portal",
      "Email support",
    ],
  },
  {
    name: "Starter",
    price: 350000,
    period: "year",
    projects: 3,
    customers: 1000,
    features: [
      "Everything in Free",
      "Custom subdomain",
      "Up to 3 properties",
      "1,000 customers",
    ],
  },
  {
    name: "Growth",
    price: 750000,
    period: "year",
    projects: 10,
    customers: 5000,
    recommended: true,
    features: [
      "Everything in Starter",
      "Up to 10 properties",
      "5,000 customers",
      "Priority support",
    ],
  },
  {
    name: "Scale",
    price: 1500000,
    period: "year",
    projects: 30,
    customers: 15000,
    features: [
      "Everything in Growth",
      "Up to 30 properties",
      "15,000 customers",
      "Dedicated support",
    ],
  },
  {
    name: "Enterprise",
    price: null,
    period: "year",
    projects: -1,
    customers: -1,
    features: [
      "Unlimited properties",
      "Unlimited customers",
      "Custom integrations",
      "SLA guarantee",
      "24/7 priority support",
    ],
  },
];
