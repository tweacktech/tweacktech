import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, HelpCircle, Mail, MessageCircle } from 'lucide-react';
import Navbar from '../Component/Navbar';
import Footer from '../Component/Footer';

const groups = [
  {
    title: 'Getting started',
    items: [
      {
        q: 'What is TweackTech?',
        a: 'TweackTech is a learning management system for technology skills and a talent hub for programmers. You can take expert-led courses, complete assignments, earn certificates, and connect with companies hiring developers.',
      },
      {
        q: 'Do I need an account?',
        a: 'You can browse courses, jobs, and the blog without an account. You need a free account to enrol, submit assignments, download certificates, and apply for jobs.',
      },
      {
        q: 'How do I create an account?',
        a: 'Click “Get started”, enter your name, email, and a password, then accept the Terms of Service and Privacy Policy. Public signups are always student accounts; instructor and staff accounts are created by an administrator after review.',
      },
    ],
  },
  {
    title: 'Courses and learning',
    items: [
      {
        q: 'Are the courses free?',
        a: 'Some courses are completely free. Others are paid, and some offer partial payment or scholarship options. Each course page shows the type and price clearly before you enrol.',
      },
      {
        q: 'What kinds of lessons are included?',
        a: 'Lessons can include video, YouTube links, slides, documents, and PDFs. Some courses also include live sessions with instructors.',
      },
      {
        q: 'How do assignments work?',
        a: 'Open “My assignments” from the navigation. Each assignment shows its due date, instructions, and maximum score. Submit text, a link, or a file URL, and your instructor will grade it and leave feedback.',
      },
      {
        q: 'Do I get a certificate?',
        a: 'Yes. When you complete a course you can download a certificate with a unique verification code. Certificates appear in your dashboard.',
      },
    ],
  },
  {
    title: 'Payments and billing',
    items: [
      {
        q: 'Which payment methods are supported?',
        a: 'Paid courses are processed securely through our payment partners. We never store your full card details on our servers.',
      },
      {
        q: 'Can I get a refund?',
        a: 'If a course is not what you expected, contact support within the refund window shown at checkout and we will review your request.',
      },
    ],
  },
  {
    title: 'Talent hub and jobs',
    items: [
      {
        q: 'How do I apply for a job?',
        a: 'Open any role on the job board and click “Apply now”. Add a cover letter, résumé link, and portfolio, then send your application. You can track its status from your dashboard.',
      },
      {
        q: 'Can companies post jobs?',
        a: 'Yes. Approved partners can post roles to the job board. Contact us with your company details and the role you want to advertise.',
      },
    ],
  },
  {
    title: 'Account and privacy',
    items: [
      {
        q: 'How do I reset my password?',
        a: 'Use the “Forgot password?” link on the sign-in page. We will email you a secure link to set a new password.',
      },
      {
        q: 'How is my data used?',
        a: 'We use your data to deliver courses, track progress, issue certificates, and connect you with employers. We never sell your personal information. Read the Privacy Policy for full details.',
      },
      {
        q: 'Does the site show ads?',
        a: 'We may use Google AdSense to keep free content available. You can learn more about the cookies used for advertising in our Cookie Policy.',
      },
    ],
  },
];

const FAQItem = ({ item, open, onToggle }) => (
  <div className="border-b border-slate-200 dark:border-slate-800 last:border-0">
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between gap-4 py-4 text-left"
      aria-expanded={open}
    >
      <span className="font-semibold text-slate-900 dark:text-white">{item.q}</span>
      <ChevronDown
        className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${
          open ? 'rotate-180' : ''
        }`}
      />
    </button>
    {open && (
      <p className="pb-4 pr-8 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        {item.a}
      </p>
    )}
  </div>
);

const FAQPage = () => {
  const [openKey, setOpenKey] = useState('0-0');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      <Navbar />

      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="container-page py-12">
          <span className="section-eyebrow">
            <HelpCircle className="h-3.5 w-3.5" /> Help centre
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-4xl">
            Frequently asked questions
          </h1>
          <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-400">
            Answers about courses, assignments, certificates, payments, jobs, and privacy.
          </p>
        </div>
      </header>

      <main className="container-page grid gap-8 py-12 lg:grid-cols-4">
        <aside className="lg:col-span-1">
          <div className="card p-6 lg:sticky lg:top-24">
            <h2 className="font-bold text-slate-900 dark:text-white">Still need help?</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Our team is happy to help with anything not covered here.
            </p>
            <Link to="/support" className="btn-primary mt-4 w-full">
              <MessageCircle className="h-4 w-4" /> Open a ticket
            </Link>
            <a href="mailto:tweackchech@gmail.com" className="btn-secondary mt-2 w-full">
              <Mail className="h-4 w-4" /> Email us
            </a>
          </div>
        </aside>

        <div className="space-y-6 lg:col-span-3">
          {groups.map((group, groupIndex) => (
            <section key={group.title} className="card p-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {group.title}
              </h2>
              <div className="mt-2">
                {group.items.map((item, itemIndex) => {
                  const key = `${groupIndex}-${itemIndex}`;
                  return (
                    <FAQItem
                      key={key}
                      item={item}
                      open={openKey === key}
                      onToggle={() => setOpenKey(openKey === key ? null : key)}
                    />
                  );
                })}
              </div>
            </section>
          ))}

          <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-gradient-to-br from-red-50 to-white dark:from-red-950/30 dark:to-slate-900 p-6">
            <h2 className="font-bold text-slate-900 dark:text-white">
              Ready to start learning?
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Create a free account and explore the course catalog today.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link to="/register" className="btn-primary">Create free account</Link>
              <Link to="/courses" className="btn-secondary">Browse courses</Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FAQPage;
