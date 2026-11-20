import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../Component/Navbar';
import Footer from '../Component/Footer';

const PrivacyPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <nav className="mb-8">
          <Link to="/" className="text-red-600 dark:text-red-400 hover:text-red-500">
            ← Back to home
          </Link>
        </nav>

        <article className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Privacy Policy</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Last updated: November 22, 2026
          </p>

          <div className="prose prose-lg dark:prose-invert text-gray-600 dark:text-gray-300 space-y-6">
            <p>
              TweackTech (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) operates the
              TweackTech learning management system and talent hub at{' '}
              <a href="https://tweacktech.vercel.app">tweacktech.vercel.app</a>. This policy
              explains what information we collect, how we use it, who we share it with, and the
              choices you have. By using our platform you agree to the practices described here.
            </p>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white">1. Information We Collect</h2>
            <p>
              We collect information you give us directly when you create an account, enrol in a
              course, submit an assignment, contact support, or create a talent profile. This may
              include your name, email address, profile photo, location, biography, skills, course
              progress, assignment submissions and payment references.
            </p>
            <p>
              We automatically collect technical information such as your IP address, browser type,
              device type, pages visited and timestamps. This helps us keep the platform secure,
              diagnose problems and understand which lessons are most useful.
            </p>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white">2. How We Use Your Information</h2>
            <p>
              We use your information to provide and improve our services: to deliver courses,
              track progress, grade assignments, issue certificates, process payments, respond to
              support requests, and connect learners with employers through the talent hub. We also
              use it to send service messages such as password resets and enrolment updates.
            </p>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white">3. Cookies and Similar Technologies</h2>
            <p>
              We use essential cookies and local storage to keep you signed in, remember your
              preferences and remember your reading progress. We may also use analytics cookies to
              understand how the site is used. You can control cookies through your browser
              settings; disabling them may limit some features. See our{' '}
              <Link to="/cookies" className="text-red-600 dark:text-red-400">Cookie Policy</Link>{' '}
              for details.
            </p>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white">4. Google AdSense and Advertising</h2>
            <p>
              We display advertisements through Google AdSense. Google and its partners, including
              DoubleClick, may use cookies and similar technologies to serve ads based on your
              visits to this and other websites, and to measure ad performance. These third parties
              may collect information such as your IP address and browser type.
            </p>
            <p>
              You can opt out of personalised advertising through{' '}
              <a href="https://www.google.com/settings/ads" rel="noreferrer">Google Ad Settings</a>{' '}
              or opt out of third-party vendor cookies at{' '}
              <a href="https://www.networkadvertising.org/choices/" rel="noreferrer">
                the Network Advertising Initiative
              </a>
              . You may also use your browser&rsquo;s Do Not Track setting where supported.
            </p>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white">5. Data Sharing</h2>
            <p>
              We do not sell your personal information. We share data only with trusted service
              providers who help us operate the platform &mdash; hosting, payment processing, email
              delivery, analytics and advertising &mdash; and with employers when you apply to a job
              or make your talent profile publicly visible. We may also disclose information when
              required by law or to protect the safety and rights of our users.
            </p>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white">6. Data Retention and Security</h2>
            <p>
              We keep your information for as long as your account is active and for as long as we
              need it to provide our services and comply with legal obligations. We use reasonable
              technical and organisational measures to protect your data, including encrypted
              connections and access controls. No system is completely secure, so we encourage you
              to use a strong, unique password.
            </p>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white">7. Children&rsquo;s Privacy</h2>
            <p>
              TweackTech is not directed at children under 13, and we do not knowingly collect
              personal information from them. If you believe a child has provided us with personal
              data, please contact us and we will remove it.
            </p>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white">8. Your Rights</h2>
            <p>
              You may access, correct or delete your personal data from your account settings or by
              contacting us. You can opt out of marketing communications at any time. Depending on
              where you live, you may also have rights to data portability or to object to certain
              processing.
            </p>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white">9. Changes to This Policy</h2>
            <p>
              We may update this policy as our platform evolves. The updated date at the top of
              this page will reflect any changes, and we will notify you of significant changes.
            </p>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white">10. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us at{' '}
              <strong>tweackchech@gmail.com</strong> or through our{' '}
              <Link to="/contact" className="text-red-600 dark:text-red-400">contact page</Link>.
            </p>
          </div>
        </article>
      </div>

      <Footer />
    </div>
  );
};

export default PrivacyPage;
