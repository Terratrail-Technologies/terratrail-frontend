import { Check, HelpCircle } from "lucide-react";
import { pricingPlans } from "../../../utils/mockData";
import { Badge } from "../../../components/ui/badge";

export function BillingSettings() {
  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString("en-NG")}`;
  };

  return (
    <div className="max-w-5xl space-y-8">
      {/* Current Plan */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-medium text-neutral-900">Current Plan</h3>
            <p className="text-sm text-neutral-500 mt-1">You are currently on the Growth plan</p>
          </div>
          <Badge className="bg-emerald-100 text-emerald-700">Active</Badge>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-semibold text-neutral-900">₦750,000</span>
          <span className="text-neutral-500">/year</span>
        </div>
        <div className="mt-4 text-sm text-neutral-600">
          <div>10 Properties · 5,000 Customers</div>
          <div className="text-neutral-500 mt-1">Renews on April 15, 2027</div>
        </div>
      </div>

      {/* Plans Grid */}
      <div>
        <h3 className="font-medium text-neutral-900 mb-4">Available Plans</h3>
        <div className="grid grid-cols-3 gap-6">
          {pricingPlans.slice(0, 3).map((plan) => (
            <div
              key={plan.name}
              className={`bg-white rounded-lg border-2 p-6 ${
                plan.name === "Growth" ? "border-emerald-500" : "border-neutral-200"
              }`}
            >
              {plan.recommended && (
                <Badge className="bg-emerald-100 text-emerald-700 mb-4">Recommended</Badge>
              )}
              <h4 className="font-semibold text-neutral-900 text-lg mb-2">{plan.name}</h4>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-semibold text-neutral-900">
                  {formatCurrency(plan.price)}
                </span>
                <span className="text-neutral-500">/{plan.period}</span>
              </div>
              <div className="space-y-2 mb-6">
                <div className="text-sm text-neutral-600">
                  <span className="font-medium">{plan.projects}</span> {plan.projects === 1 ? "Property" : "Properties"}
                </div>
                <div className="text-sm text-neutral-600">
                  <span className="font-medium">{plan.customers.toLocaleString()}</span> Customers
                </div>
              </div>
              <ul className="space-y-2 mb-6">
                {plan.features.slice(0, 4).map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-neutral-600">
                    <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                disabled={plan.name === "Growth"}
                className={`w-full py-2 rounded-md font-medium transition-colors ${
                  plan.name === "Growth"
                    ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                }`}
              >
                {plan.name === "Growth" ? "Current Plan" : "Upgrade"}
              </button>
            </div>
          ))}
        </div>

        {/* Enterprise Card */}
        <div className="mt-6 bg-neutral-900 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-lg mb-2">Enterprise</h4>
              <p className="text-neutral-300 text-sm mb-4">
                Unlimited properties and customers with custom integrations and SLA
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4" />
                  <span>Unlimited everything</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4" />
                  <span>Custom integrations & SLA</span>
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4" />
                  <span>24/7 priority support</span>
                </li>
              </ul>
            </div>
            <button className="px-6 py-2 bg-white text-neutral-900 rounded-md font-medium hover:bg-neutral-100 transition-colors">
              Contact Sales
            </button>
          </div>
        </div>
      </div>

      {/* Help */}
      <div className="flex justify-center">
        <button className="inline-flex items-center gap-2 px-4 py-2 text-neutral-600 hover:text-neutral-900 transition-colors">
          <HelpCircle className="w-4 h-4" />
          Need help? Contact Support
        </button>
      </div>
    </div>
  );
}
