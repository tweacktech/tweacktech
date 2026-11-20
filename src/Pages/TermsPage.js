import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../Component/Navbar';
import Footer from '../Component/Footer';

const TermsPage = () => {
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Terms of Service</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Last updated: November 22, 2026
          </p>

          <div className="prose prose-lg dark:prose-invert text-gray-600 dark:text-gray-300 space-y-6">
            <p>
              These Terms of Service govern your use of TweackTech, a learning management system
              and talent hub operated at <a href="https://tweacktech.vercel.app">tweacktech.vercel.app</a>.
              Please read them carefully before creating an account or using our services.
            </p>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white">1. Acceptance of Terms</h2>
            <p>
              By accessing or using TweackTech, you agree to be bound by these Terms and by our{' '}
              <Link to="/privacy" className="text-red-600 dark:text-red-400">Privacy Policy</Link> and{' '}
              <Link to="/cookies" className="text-red-600 dark:text-red-400">Cookie Policy</Link>. If
              you do not agree, you may not use our platform.
            </p>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white">2. Eligibility</h2>
            <p>
              You must be at least 13 years old to use TweackTech. If you are under 18, you should
              use the platform with the involvement of a parent or guardian. By creating an account
              you represent that you meet these requirements and that the information you provide
              is accurate.
            </p>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white">3. Your Account</h2>
            <p>
              You are responsible for maintaining the confidentiality of your credentials and for
              all activity that occurs under your account. Notify us immediately if you suspect
              unauthorised access. We may suspend or disable accounts that are inactive, fraudulent
              or used in violation of these Terms.
            </p>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white">4. Acceptable Use</h2>
            <p>
              You agree not to use the platform to harass or harm others, submit unlawful or
              infringing content, attempt to gain unauthorised access to systems or other accounts,
              scrape or copy course material, interfere with the service, or publish false or
              misleading information in profiles, job applications or assignments.
            </p>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white">5. Courses, Enrolment and Payments</h2>
            <p>
              Course availability and enrolment rules are shown on each course page. Some courses
              are free and others are paid; enrolment may be opened or closed by the course team.
              Payments are handled by our payment partners, and we do not store full card details on
              our servers. Access to a paid course is granted after a payment is verified.
            </p>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white">6. Refunds</h2>
            <p>
              If you experience a problem with a purchase, contact us at{' '}
              <strong>tweackchech@gmail.com</strong> with your payment reference. We review refund
              requests case by case, taking into account how much of the course you have accessed.
            </p>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white">7. Intellectual Property</h2>
            <p>
              All course materials, lessons, quizzes, text, graphics and branding on TweackTech are
              owned by TweackTech or our instructors and are protected by copyright and other
              intellectual property laws. You may view them for personal learning only. You may not
              reproduce, distribute, sell or publicly display them without written permission.
            </p>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white">8. User Content</h2>
            <p>
              You retain ownership of content you submit, such as assignments, profile details and
              support messages. By submitting it you grant us a licence to store and use it to
              provide our services. Do not submit content you do not have the right to share.
            </p>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white">9. Certificates</h2>
            <p>
              Certificates are issued when you complete the required lessons and meet the assessment
              criteria for a course. Certificates can be verified publicly using their certificate
              code. We may revoke a certificate if it was obtained through cheating or fraud.
            </p>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white">10. Third-Party Services</h2>
            <p>
              Our platform integrates with third-party services for hosting, payments, email,
              video, analytics and advertising (including Google AdSense). These services have their
              own terms and privacy policies, and we are not responsible for their content or
              practices.
            </p>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white">11. Disclaimers and Limitation of Liability</h2>
            <p>
              We provide TweackTech &ldquo;as is&rdquo; and do not guarantee uninterrupted or
              error-free operation. We are not liable for indirect or consequential losses, lost
              profits, or loss of data arising from your use of the platform. Nothing in these Terms
              excludes liability that cannot lawfully be excluded.
            </p>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white">12. Changes to These Terms</h2>
            <p>
              We may update these Terms as our services evolve. The updated date at the top of this
              page will reflect changes, and continued use of the platform after an update means you
              accept the revised Terms.
            </p>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white">13. Contact</h2>
            <p>
              For questions about these Terms, contact us at <strong>tweackchech@gmail.com</strong>{' '}
              or through our <Link to="/contact" className="text-red-600 dark:text-red-400">contact page</Link>.
            </p>
          </div>
        </article>
      </div>

      <Footer />
    </div>
  );
};

export default TermsPage;
