import { useState } from "react";
import { Check } from "lucide-react";
import { Badge } from "../../../components/ui/badge";

export function EmailNotifications() {
  const [bookingApproved, setBookingApproved] = useState(true);
  const [newBooking, setNewBooking] = useState(true);
  const [receiptUploaded, setReceiptUploaded] = useState(true);
  const [paymentApproval, setPaymentApproval] = useState(true);
  const [paymentReminders, setPaymentReminders] = useState(true);
  const [subscriptionCompleted, setSubscriptionCompleted] = useState(true);
  const [propertyPublished, setPropertyPublished] = useState(true);

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-neutral-900">Email Notifications</h2>
          <p className="text-sm text-neutral-500 mt-1">
            Choose when to send email notifications for bookings, payments, and subscriptions
          </p>
        </div>
        <Badge className="bg-emerald-100 text-emerald-700">
          <div className="flex items-center gap-1">
            <Check className="w-3 h-3" />
            Completed: 100%
          </div>
        </Badge>
      </div>

      {/* Bookings Section */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6 space-y-6">
        <h3 className="font-medium text-neutral-900">Bookings</h3>

        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="font-medium text-neutral-900">Booking Approved or Rejected</div>
              <div className="text-sm text-neutral-600 mt-1">Sent to: Customer</div>
            </div>
            <input
              type="checkbox"
              checked={bookingApproved}
              onChange={(e) => setBookingApproved(e.target.checked)}
              className="mt-1 w-4 h-4 text-emerald-600 border-neutral-300 rounded focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="font-medium text-neutral-900">New Booking Submitted</div>
              <div className="text-sm text-neutral-600 mt-1">Sent to: Admins + assigned customer rep</div>
            </div>
            <input
              type="checkbox"
              checked={newBooking}
              onChange={(e) => setNewBooking(e.target.checked)}
              className="mt-1 w-4 h-4 text-emerald-600 border-neutral-300 rounded focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Payments & Subscriptions Section */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6 space-y-6">
        <h3 className="font-medium text-neutral-900">Payments & Subscriptions</h3>

        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="font-medium text-neutral-900">Payment Receipt Uploaded</div>
              <div className="text-sm text-neutral-600 mt-1">Sent to: Admins + assigned customer rep</div>
            </div>
            <input
              type="checkbox"
              checked={receiptUploaded}
              onChange={(e) => setReceiptUploaded(e.target.checked)}
              className="mt-1 w-4 h-4 text-emerald-600 border-neutral-300 rounded focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="font-medium text-neutral-900">Payment Approval & Rejection</div>
              <div className="text-sm text-neutral-600 mt-1">Sent to: Customer + customer rep</div>
            </div>
            <input
              type="checkbox"
              checked={paymentApproval}
              onChange={(e) => setPaymentApproval(e.target.checked)}
              className="mt-1 w-4 h-4 text-emerald-600 border-neutral-300 rounded focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="font-medium text-neutral-900">Payment Reminders</div>
              <div className="text-sm text-neutral-600 mt-1">
                Sent to: Customers + admins
                <div className="text-xs text-neutral-500 mt-1">
                  Schedule: 7 days before, 2 days before, due date, 2 days after
                </div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={paymentReminders}
              onChange={(e) => setPaymentReminders(e.target.checked)}
              className="mt-1 w-4 h-4 text-emerald-600 border-neutral-300 rounded focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="font-medium text-neutral-900">Subscription Completed</div>
              <div className="text-sm text-neutral-600 mt-1">Sent to: Customer + customer rep</div>
            </div>
            <input
              type="checkbox"
              checked={subscriptionCompleted}
              onChange={(e) => setSubscriptionCompleted(e.target.checked)}
              className="mt-1 w-4 h-4 text-emerald-600 border-neutral-300 rounded focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Properties Section */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6 space-y-6">
        <h3 className="font-medium text-neutral-900">Properties</h3>

        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="font-medium text-neutral-900">New Property Published</div>
              <div className="text-sm text-neutral-600 mt-1">
                Sent to: All customers + all sales reps
                <div className="text-xs text-neutral-500 mt-1">
                  Includes property details and, for reps, a share link with their referral code
                </div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={propertyPublished}
              onChange={(e) => setPropertyPublished(e.target.checked)}
              className="mt-1 w-4 h-4 text-emerald-600 border-neutral-300 rounded focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button className="inline-flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors">
          <Check className="w-4 h-4" />
          Save Changes
        </button>
      </div>
    </div>
  );
}
