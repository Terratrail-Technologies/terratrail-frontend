import { ExternalLink, MessageCircle, Mail, BookOpen, FileText, Video, ChevronRight } from "lucide-react";
import { usePageTitle } from "../hooks/usePageTitle";

const FAQ = [
  {
    q: "How do I add a new property?",
    a: "Go to Properties → click 'New Property' in the top right. The wizard will guide you through adding details, pricing plans, gallery images, and bank accounts.",
  },
  {
    q: "How do I assign a customer to a property?",
    a: "Open a customer's profile → click 'Add Subscription' → select the property and pricing plan. The subscription will be created and an installment schedule generated automatically.",
  },
  {
    q: "How does the installment reminder system work?",
    a: "The system automatically sends reminders at 7 days before, 2 days before, on the due date, and 2 days after each installment. You can toggle reminders in Settings → Email Notifications.",
  },
  {
    q: "How do I record a payment?",
    a: "Open the customer's subscription → click 'Record Payment' on the relevant installment → enter the amount, reference, and upload the receipt. An admin will need to approve it.",
  },
  {
    q: "How do I set up the public estate page?",
    a: "Go to Settings → General → enable 'Create Estate Public Pages'. Your page will be live at your workspace URL. Customers can browse properties and book site inspections.",
  },
  {
    q: "How do I invite team members?",
    a: "Go to Settings → People → click 'Send Invitation via Email'. Enter the email and role. The invitee will receive a link valid for 7 days.",
  },
  {
    q: "What happens when a customer's subscription is completed?",
    a: "Once all installments are approved, the subscription status changes to COMPLETED. You can then allocate a specific plot number from the customer's detail page.",
  },
  {
    q: "How do I change my billing plan?",
    a: "Go to Settings → Billing → choose a plan and click 'Switch to this plan'. Our team will contact you with payment details to activate the new plan.",
  },
];

const RESOURCES = [
  { icon: BookOpen,  label: "Getting Started Guide",    href: "#", desc: "Step-by-step guide for new workspaces" },
  { icon: Video,     label: "Video Tutorials",          href: "#", desc: "Watch how-to videos for key features" },
  { icon: FileText,  label: "API Documentation",        href: "#", desc: "Integrate Terratrail with your systems" },
  { icon: FileText,  label: "Changelog",                href: "#", desc: "What's new in each release" },
];

export function HelpPage() {
  usePageTitle("Help & Support");

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="bg-white border-b border-neutral-200 px-6 sm:px-8 py-5">
        <h1 className="text-2xl font-semibold text-neutral-900">Help & Support</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Find answers, contact support, or browse documentation.</p>
      </div>

      <div className="p-6 sm:p-8 max-w-4xl space-y-8">

        {/* ── Contact ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a
            href="mailto:support@terratrail.io"
            className="flex items-center gap-4 bg-white border border-neutral-200 rounded-xl p-5 hover:border-[#0E2C72]/40 hover:shadow-sm transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#0E2C72]/6 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-[#0E2C72]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-900 group-hover:text-[#0a2260] transition-colors">Email Support</p>
              <p className="text-xs text-neutral-500 mt-0.5">support@terratrail.io · Reply within 24h</p>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-neutral-300 ml-auto shrink-0" />
          </a>

          <a
            href="https://wa.me/2349000000000"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 bg-white border border-neutral-200 rounded-xl p-5 hover:border-[#0E2C72]/40 hover:shadow-sm transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
              <MessageCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-900 group-hover:text-green-700 transition-colors">WhatsApp Support</p>
              <p className="text-xs text-neutral-500 mt-0.5">Chat with us on WhatsApp · Mon–Fri 9am–6pm</p>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-neutral-300 ml-auto shrink-0" />
          </a>
        </div>

        {/* ── Resources ────────────────────────────────────────────────── */}
        <div>
          <h2 className="text-base font-semibold text-neutral-900 mb-3">Resources</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {RESOURCES.map((r) => (
              <a
                key={r.label}
                href={r.href}
                className="flex items-center gap-3 bg-white border border-neutral-200 rounded-xl px-4 py-3.5 hover:border-neutral-300 hover:shadow-sm transition-all group"
              >
                <r.icon className="w-4 h-4 text-neutral-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-800 group-hover:text-neutral-900">{r.label}</p>
                  <p className="text-xs text-neutral-400 mt-0.5">{r.desc}</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
              </a>
            ))}
          </div>
        </div>

        {/* ── FAQ ──────────────────────────────────────────────────────── */}
        <div>
          <h2 className="text-base font-semibold text-neutral-900 mb-3">Frequently Asked Questions</h2>
          <div className="bg-white border border-neutral-200 rounded-xl divide-y divide-neutral-100">
            {FAQ.map((item, i) => (
              <details key={i} className="group px-5 py-4">
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <span className="text-sm font-medium text-neutral-800 group-open:text-[#0E2C72] pr-4">{item.q}</span>
                  <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0 transition-transform group-open:rotate-90" />
                </summary>
                <p className="text-sm text-neutral-600 leading-relaxed mt-3">{item.a}</p>
              </details>
            ))}
          </div>
        </div>

        <p className="text-xs text-neutral-400 text-center pb-4">
          Terratrail &mdash; Real Estate Management Platform &mdash; Version 1.0
        </p>
      </div>
    </div>
  );
}

