import { Link } from "react-router-dom";
import Logo from "@/components/Logo";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-white">
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <Link to="/"><Logo size="sm" /></Link>
        <Link to="/login" className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-700 font-medium hover:bg-gray-50">
          Sign In
        </Link>
      </header>

      <div className="max-w-3xl mx-auto px-5 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Privacy Policy</h1>
        <p className="text-xs text-gray-400 mb-8">Last updated: June 2025</p>

        <div className="prose prose-sm max-w-none text-gray-700 space-y-6">

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">1. Introduction</h2>
            <p className="text-sm leading-relaxed">
              iUnlockd ("we", "us", "our") is committed to protecting your personal information. This Privacy Policy explains what data we collect, how we use it, and your rights regarding your information.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">2. Information We Collect</h2>
            <ul className="text-sm leading-relaxed list-disc pl-5 space-y-1">
              <li><strong>Account info:</strong> Name, email address, phone number, country.</li>
              <li><strong>Order info:</strong> IMEI numbers, device models, service orders placed.</li>
              <li><strong>Payment info:</strong> Wallet balance, transaction history, deposit records. We do not store full crypto wallet private keys.</li>
              <li><strong>Usage data:</strong> IP address, browser type, pages visited, login timestamps.</li>
              <li><strong>Communications:</strong> Support messages or emails you send us.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">3. How We Use Your Information</h2>
            <ul className="text-sm leading-relaxed list-disc pl-5 space-y-1">
              <li>To create and manage your account.</li>
              <li>To process orders and deliver services.</li>
              <li>To send transactional emails (OTP, order updates, receipts).</li>
              <li>To detect and prevent fraud or abuse.</li>
              <li>To improve our platform and services.</li>
              <li>To comply with legal obligations.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">4. IMEI & Device Data</h2>
            <p className="text-sm leading-relaxed">
              IMEI numbers submitted for unlocking services are shared with our upstream service providers solely for the purpose of processing your request. We do not sell or misuse device identifiers. IMEI data is retained for order records and dispute resolution.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">5. Data Sharing</h2>
            <p className="text-sm leading-relaxed">
              We do not sell your personal data. We share information only with:
            </p>
            <ul className="text-sm leading-relaxed list-disc pl-5 space-y-1 mt-2">
              <li>Service providers (unlock API partners) to fulfil orders.</li>
              <li>Email providers (SMTP) for transactional communication.</li>
              <li>Law enforcement, when legally required.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">6. Cookies & Tracking</h2>
            <p className="text-sm leading-relaxed">
              We use session cookies to keep you logged in. We use Cloudflare Turnstile for bot protection on login and registration forms. Cloudflare may process request metadata per their own privacy policy. We do not use advertising trackers or third-party analytics.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">7. Data Retention</h2>
            <p className="text-sm leading-relaxed">
              Account data is retained as long as your account is active. Order records are kept for a minimum of 2 years for legal and dispute purposes. You may request deletion of your account by contacting support, subject to legal retention requirements.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">8. Security</h2>
            <p className="text-sm leading-relaxed">
              We use industry-standard security including bcrypt password hashing, JWT tokens, HTTPS/TLS encryption, and two-factor authentication (TOTP). Despite our efforts, no system is 100% secure. Please use a strong, unique password and enable 2FA.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">9. Your Rights</h2>
            <p className="text-sm leading-relaxed">
              Depending on your jurisdiction, you may have the right to access, correct, or delete your personal data. To exercise these rights, email us at{" "}
              <a href="mailto:contact.iunlockd@gmail.com" className="text-blue-600 hover:underline">contact.iunlockd@gmail.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">10. Changes to This Policy</h2>
            <p className="text-sm leading-relaxed">
              We may update this policy from time to time. We will notify registered users via email for significant changes. Continued use of the Service after updates constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">11. Contact</h2>
            <p className="text-sm leading-relaxed">
              For privacy concerns, contact us at{" "}
              <a href="mailto:contact.iunlockd@gmail.com" className="text-blue-600 hover:underline">contact.iunlockd@gmail.com</a>.
            </p>
          </section>

        </div>

        <div className="mt-10 pt-6 border-t border-gray-100 flex gap-4 text-xs text-gray-400">
          <Link to="/terms" className="hover:text-gray-600">Terms of Service</Link>
          <Link to="/" className="hover:text-gray-600">Home</Link>
        </div>
      </div>
    </div>
  );
}
