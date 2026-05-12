export function TermsPage() {
  return (
    <div className="min-h-screen bg-neutral-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[#0e2c72] flex items-center justify-center">
              <img src="/logo.png" alt="Terratrail" className="w-full h-full object-cover rounded-lg"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
            </div>
            <span className="text-[16px] font-bold text-[#0e2c72]">Terratrail</span>
          </div>
          <h1 className="text-[28px] font-bold text-neutral-900 mb-2">Terms of Service</h1>
          <p className="text-[13px] text-neutral-400">Last updated: May 2025</p>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-8 space-y-6 text-[14px] text-neutral-700 leading-relaxed">
          <section>
            <h2 className="text-[17px] font-bold text-neutral-900 mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using Terratrail, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the platform.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-bold text-neutral-900 mb-3">2. Description of Service</h2>
            <p>Terratrail is a real estate management platform that enables companies to manage properties, subscriptions, payments, and field teams. The platform is provided on a subscription basis.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-bold text-neutral-900 mb-3">3. User Accounts</h2>
            <p className="mb-2">You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account.</p>
            <p>Each workspace represents a single company or business entity. You may not use the platform for activities that are unlawful or prohibited by these terms.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-bold text-neutral-900 mb-3">4. Data and Privacy</h2>
            <p>Your use of Terratrail is also governed by our Privacy Policy. By using the platform, you consent to our collection and use of data as described in the Privacy Policy.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-bold text-neutral-900 mb-3">5. Payment and Billing</h2>
            <p className="mb-2">Subscription fees are billed in advance. All fees are non-refundable except as required by applicable law.</p>
            <p>We reserve the right to change pricing with 30 days' notice. Continued use after a price change constitutes acceptance of the new pricing.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-bold text-neutral-900 mb-3">6. Intellectual Property</h2>
            <p>Terratrail and its content are protected by copyright and other intellectual property laws. You may not copy, modify, or distribute our platform or content without written permission.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-bold text-neutral-900 mb-3">7. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, Terratrail shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-bold text-neutral-900 mb-3">8. Termination</h2>
            <p>We reserve the right to suspend or terminate your account for violations of these terms or for any other reason with reasonable notice.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-bold text-neutral-900 mb-3">9. Changes to Terms</h2>
            <p>We may update these terms from time to time. We will notify users of significant changes via email or in-app notification.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-bold text-neutral-900 mb-3">10. Contact</h2>
            <p>For questions about these terms, contact us at <a href="mailto:support@terratrail.io" className="text-[#0e2c72] hover:underline">support@terratrail.io</a>.</p>
          </section>
        </div>

        <p className="text-center text-[12px] text-neutral-400 mt-6">
          © 2025 Terratrail. All rights reserved.
        </p>
      </div>
    </div>
  );
}
