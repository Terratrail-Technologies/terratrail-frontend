export function PrivacyPage() {
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
          <h1 className="text-[28px] font-bold text-neutral-900 mb-2">Privacy Policy</h1>
          <p className="text-[13px] text-neutral-400">Last updated: May 2025</p>
        </div>

        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-8 space-y-6 text-[14px] text-neutral-700 leading-relaxed">
          <section>
            <h2 className="text-[17px] font-bold text-neutral-900 mb-3">1. Information We Collect</h2>
            <p className="mb-2">We collect information you provide when creating an account or using the platform, including:</p>
            <ul className="list-disc list-inside space-y-1 text-neutral-600">
              <li>Name, email address, and phone number</li>
              <li>Business / company name and workspace details</li>
              <li>Payment and transaction data you record in the platform</li>
              <li>Customer and property data you enter</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[17px] font-bold text-neutral-900 mb-3">2. How We Use Your Information</h2>
            <p className="mb-2">We use the information we collect to:</p>
            <ul className="list-disc list-inside space-y-1 text-neutral-600">
              <li>Provide, operate, and maintain the Terratrail platform</li>
              <li>Send transactional emails and in-platform notifications</li>
              <li>Improve the platform based on usage patterns</li>
              <li>Respond to support requests and inquiries</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[17px] font-bold text-neutral-900 mb-3">3. Data Storage and Security</h2>
            <p className="mb-2">Your data is stored on secure servers. We implement industry-standard security measures including:</p>
            <ul className="list-disc list-inside space-y-1 text-neutral-600">
              <li>Encryption of data in transit (HTTPS/TLS)</li>
              <li>Encrypted storage for sensitive fields</li>
              <li>Regular security assessments and access controls</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[17px] font-bold text-neutral-900 mb-3">4. Data Sharing</h2>
            <p>We do not sell your personal data to third parties. We may share data with service providers who help us operate the platform (e.g., email delivery services), subject to confidentiality agreements.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-bold text-neutral-900 mb-3">5. Cookies</h2>
            <p>Terratrail uses essential cookies and local storage to maintain your session and preferences. We do not use tracking or advertising cookies.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-bold text-neutral-900 mb-3">6. Your Rights</h2>
            <p className="mb-2">You have the right to:</p>
            <ul className="list-disc list-inside space-y-1 text-neutral-600">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your account and data</li>
              <li>Export your workspace data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[17px] font-bold text-neutral-900 mb-3">7. Data Retention</h2>
            <p>We retain your data for as long as your account is active. After account deletion, data is removed within 30 days, except where retention is required by law.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-bold text-neutral-900 mb-3">8. Children's Privacy</h2>
            <p>Terratrail is not directed to children under 18. We do not knowingly collect personal data from minors.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-bold text-neutral-900 mb-3">9. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. Significant changes will be communicated via email or in-app notifications.</p>
          </section>

          <section>
            <h2 className="text-[17px] font-bold text-neutral-900 mb-3">10. Contact Us</h2>
            <p>For privacy-related questions or to exercise your rights, contact us at <a href="mailto:privacy@terratrail.io" className="text-[#0e2c72] hover:underline">privacy@terratrail.io</a>.</p>
          </section>
        </div>

        <p className="text-center text-[12px] text-neutral-400 mt-6">
          © 2025 Terratrail. All rights reserved.
        </p>
      </div>
    </div>
  );
}
