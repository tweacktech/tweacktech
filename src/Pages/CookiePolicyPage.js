import React from 'react';
import { Link } from 'react-router-dom';
import { Cookie } from 'lucide-react';
import Navbar from '../Component/Navbar';
import Footer from '../Component/Footer';

const sections = [
  {
    title: 'What are cookies?',
    body: [
      'Cookies are small text files stored on your device when you visit a website. They help a site remember your preferences and understand how it is being used.',
      'We also use similar technologies such as local storage to keep you signed in and to remember your theme choice.',
    ],
  },
  {
    title: 'Cookies we use',
    body: [
      'Essential cookies keep you signed in and protect your account. Without them, parts of the platform cannot work.',
      'Preference storage remembers settings such as light or dark mode. This is stored in your browser and is not shared with advertisers.',
      'Analytics cookies, where enabled, help us understand which pages are useful so we can improve the product. These are aggregated and do not identify you personally.',
      'Advertising cookies may be set by Google AdSense to show relevant ads. Google and its partners may use these cookies to serve ads based on your prior visits to this or other websites.',
    ],
  },
  {
    title: 'Google AdSense and third parties',
    body: [
      'We may display advertisements through Google AdSense. Google uses cookies, including the DoubleClick cookie, to serve ads based on your visits to this and other sites.',
      'You can opt out of personalised advertising by visiting Google Ads Settings. You can also opt out of third-party vendor cookies at aboutads.info.',
      'Third-party vendors and ad networks operate under their own privacy policies. We do not control the cookies they set.',
    ],
  },
  {
    title: 'Managing cookies',
    body: [
      'Most browsers let you block or delete cookies through their settings. If you disable essential cookies, you may not be able to sign in or use some features.',
      'You can also change your choice at any time using the "Cookie settings" link in the footer. Choosing "Essential only" keeps sign-in working while turning off advertising and analytics storage.',
      'Clearing your browser storage will also reset your saved theme preference and your cookie choice.',
    ],
  },
  {
    title: 'Changes to this policy',
    body: [
      'We may update this cookie policy as our platform evolves. Material changes will be reflected on this page with a new update date.',
    ],
  },
];

const CookiePolicyPage = () => (
  <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
    <Navbar />

    <div className="container-page max-w-4xl py-10">
      <Link
        to="/"
        className="text-sm font-medium text-red-600 dark:text-red-400 hover:underline"
      >
        ← Back to home
      </Link>

      <article className="card mt-6 p-6 sm:p-10">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400">
            <Cookie className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              Cookie Policy
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Last updated: November 2026
            </p>
          </div>
        </div>

        <p className="mt-6 text-slate-600 dark:text-slate-300">
          This policy explains how TweackTech LMS and Talent Hub uses cookies and similar
          technologies, including cookies associated with Google AdSense.
        </p>

        <div className="mt-8 space-y-8">
          {sections.map((section, index) => (
            <section key={section.title}>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {index + 1}. {section.title}
              </h2>
              <div className="mt-2 space-y-2">
                {section.body.map((paragraph) => (
                  <p key={paragraph} className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}

          <section>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Contact</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Questions about this policy? Email{' '}
              <a
                href="mailto:tweackchech@gmail.com"
                className="font-semibold text-red-600 dark:text-red-400"
              >
                tweackchech@gmail.com
              </a>{' '}
              or visit our{' '}
              <Link to="/contact" className="font-semibold text-red-600 dark:text-red-400">
                contact page
              </Link>
              .
            </p>
          </section>
        </div>

        <div className="mt-8 flex flex-wrap gap-4 border-t border-slate-200 dark:border-slate-800 pt-6 text-sm">
          <Link to="/privacy" className="font-semibold text-red-600 dark:text-red-400">
            Privacy Policy
          </Link>
          <Link to="/terms" className="font-semibold text-red-600 dark:text-red-400">
            Terms of Service
          </Link>
        </div>
      </article>
    </div>

    <Footer />
  </div>
);

export default CookiePolicyPage;
