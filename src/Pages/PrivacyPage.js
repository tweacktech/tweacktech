import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../Component/Navbar';
import Footer from '../Component/Footer';

const PrivacyPage = () => {
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Privacy Policy</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Last updated: November 12, 2026
          </p>

          <div className="prose prose-lg dark:prose-invert text-gray-600 dark:text-gray-300 space-y-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">1. Information We Collect</h2>
            <p>
              TweackTech LMS ("we", "us", "our") operates the TweackTech learning management system and talent hub. We collect personal information including your name, email address, and course progress when you register and use our platform.
            </p>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white">2. How We Use Your Information</h2>
            <p>
              We use your data to provide courses, track your learning progress, issue certificates, and connect you with employers through our talent hub.
            </p>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white">3. Google AdSense</h2>
            <p>
              We use Google AdSense to display advertisements on our platform. Google may use cookies to serve personalized ads based on your browsing behavior. You can opt out of personalized ads by visiting Google's Ad Settings.
            </p>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white">4. Data Sharing</h2>
            <p>
              We do not sell your personal information to third parties. We may share data with trusted service providers who help us operate our platform (hosting, payments, email services).
            </p>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white">5. Your Rights</h2>
            <p>
              You have the right to access, correct, or delete your personal data. You can also opt out of marketing communications at any time.
            </p>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white">6. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us at <strong>tweackchech@gmail.com</strong>.
            </p>
          </div>
        </article>
      </div>

      <Footer />
    </div>
  );
};

export default PrivacyPage;
