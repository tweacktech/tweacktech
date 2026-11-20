import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../Component/Navbar';
import Footer from '../Component/Footer';

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <nav className="mb-8">
          <Link to="/" className="text-red-600 dark:text-red-400 hover:text-red-500">
            ← Back to home
          </Link>
        </nav>

        <article className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Terms of Service</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Last updated: November 12, 2026
          </p>

          <div className="prose prose-lg dark:prose-invert text-gray-600 dark:text-gray-300 space-y-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">1. Acceptance of Terms</h2>
            <p>
              By accessing and using TweackTech LMS, you agree to be bound by these Terms of Service. If you do not agree, you may not use our platform.
            </p>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white">2. Eligibility</h2>
            <p>
              You must be at least 13 years old to use our platform. By creating an account, you represent that you meet this requirement.
            </p>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white">3. Account Responsibility</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
            </p>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white">4. Payments</h2>
            <p>
              All course payments are processed securely through our payment partners. We do not store your credit card information on our servers.
            </p>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white">5. Content Ownership</h2>
            <p>
              All course content, videos, slides, and materials on TweackTech LMS are owned by TweackTech or its instructors. You may not reproduce or distribute this content without permission.
            </p>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white">6. Termination</h2>
            <p>
              We may suspend or terminate accounts that violate our terms or engage in fraudulent activity.
            </p>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white">7. Contact</h2>
            <p>
              For questions about these Terms, contact us at <strong>tweackchech@gmail.com</strong>.
            </p>
          </div>
        </article>
      </div>

      <Footer />
    </div>
  );
};

export default TermsPage;
