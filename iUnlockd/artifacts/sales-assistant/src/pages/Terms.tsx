import { Link } from "react-router-dom";
import Logo from "@/components/Logo";

export default function Terms() {
  return (
    <div className="min-h-screen bg-white">
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <Link to="/"><Logo size="sm" /></Link>
        <Link to="/login" className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-700 font-medium hover:bg-gray-50">
          Sign In
        </Link>
      </header>

      <div className="max-w-3xl mx-auto px-5 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Terms of Service</h1>
        <p className="text-xs text-gray-400 mb-8">Last updated: June 2025</p>

        <div className="prose prose-sm max-w-none text-gray-700 space-y-6">

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">1. Acceptance of Terms</h2>
            <p className="text-sm leading-relaxed">
              By accessing or using iUnlockd ("the Service", "we", "us"), you agree to be bound by these Terms of Service. If you do not agree, please do not use our platform. We reserve the right to update these terms at any time. Continued use of the Service after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">2. Service Description</h2>
            <p className="text-sm leading-relaxed">
              iUnlockd provides phone unlocking, IMEI services, and server-based mobile services to resellers and end users. Services include but are not limited to: IMEI unlock, network unlock, FRP removal, iCloud removal, carrier check, and related tools. All services are delivered digitally.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">3. Eligibility & Account</h2>
            <p className="text-sm leading-relaxed">
              You must be at least 18 years old to use iUnlockd. You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate information during registration. We reserve the right to suspend or terminate accounts that violate these terms.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">4. Payments & Wallet</h2>
            <p className="text-sm leading-relaxed">
              iUnlockd operates on a prepaid credit system. Funds added to your wallet are non-refundable unless a service fails to deliver. We accept payments via USDT (opBNB, Plasma) and other supported methods. Deposited funds do not earn interest. Fraudulent payment attempts will result in permanent account termination.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">5. Order Processing & Refunds</h2>
            <p className="text-sm leading-relaxed">
              Once an order is placed and payment is deducted, it is submitted to our upstream provider and cannot be cancelled. Refunds are only issued if the service explicitly fails (e.g., unsupported IMEI, wrong network). Processing times vary by service. iUnlockd is not responsible for delays caused by the device manufacturer or carrier.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">6. Prohibited Use</h2>
            <p className="text-sm leading-relaxed">
              You agree not to use iUnlockd to unlock stolen, blacklisted, or lost devices. You must be the rightful owner or have explicit permission from the owner of the device. Misuse of our services for illegal purposes is strictly prohibited and may be reported to law enforcement.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">7. Limitation of Liability</h2>
            <p className="text-sm leading-relaxed">
              iUnlockd is not liable for any indirect, incidental, or consequential damages arising from the use of our services. Our maximum liability is limited to the amount you paid for the specific service in question. We do not guarantee that all devices or models will be successfully unlocked.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">8. Intellectual Property</h2>
            <p className="text-sm leading-relaxed">
              All content on iUnlockd including logos, text, and design is the property of iUnlockd and may not be copied, reproduced, or distributed without written permission.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">9. Governing Law</h2>
            <p className="text-sm leading-relaxed">
              These Terms shall be governed by applicable laws. Any disputes shall be resolved through binding arbitration or the courts of the jurisdiction in which iUnlockd operates.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">10. Contact</h2>
            <p className="text-sm leading-relaxed">
              For questions regarding these Terms, contact us at{" "}
              <a href="mailto:contact.iunlockd@gmail.com" className="text-blue-600 hover:underline">contact.iunlockd@gmail.com</a>.
            </p>
          </section>

        </div>

        <div className="mt-10 pt-6 border-t border-gray-100 flex gap-4 text-xs text-gray-400">
          <Link to="/privacy" className="hover:text-gray-600">Privacy Policy</Link>
          <Link to="/" className="hover:text-gray-600">Home</Link>
        </div>
      </div>
    </div>
  );
}
