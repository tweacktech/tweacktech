import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  LifeBuoy,
  Mail,
  MapPin,
  MessageCircle,
  Send,
} from 'lucide-react';
import Navbar from '../Component/Navbar';
import Footer from '../Component/Footer';

const initialForm = { name: '', email: '', subject: '', message: '' };

const ContactPage = () => {
  const [form, setForm] = useState(initialForm);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const update = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Please complete your name, email, and message.');
      return;
    }
    // Open the visitor's mail client with a pre-filled message. This avoids
    // silently dropping messages when no transactional email service is set up.
    const subject = encodeURIComponent(form.subject || `Website enquiry from ${form.name}`);
    const body = encodeURIComponent(
      `Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`
    );
    window.location.href = `mailto:tweackchech@gmail.com?subject=${subject}&body=${body}`;
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      <Navbar />

      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="container-page py-12">
          <span className="section-eyebrow">
            <MessageCircle className="h-3.5 w-3.5" /> Contact us
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-4xl">
            We would love to hear from you
          </h1>
          <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-400">
            Questions about courses, hiring, partnerships, or your account? Send us a
            message and we will get back to you.
          </p>
        </div>
      </header>

      <main className="container-page grid gap-8 py-12 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-2">
          <div className="card p-6">
            <h2 className="font-bold text-slate-900 dark:text-white">Get in touch</h2>
            <div className="mt-4 space-y-4 text-sm">
              <a
                href="mailto:tweackchech@gmail.com"
                className="flex items-start gap-3 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400">
                  <Mail className="h-4 w-4" />
                </span>
                <span>
                  <span className="block font-semibold text-slate-900 dark:text-white">Email</span>
                  tweackchech@gmail.com
                </span>
              </a>

              <div className="flex items-start gap-3 text-slate-600 dark:text-slate-400">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400">
                  <MapPin className="h-4 w-4" />
                </span>
                <span>
                  <span className="block font-semibold text-slate-900 dark:text-white">Location</span>
                  Lagos, Nigeria · Remote-first
                </span>
              </div>

              <div className="flex items-start gap-3 text-slate-600 dark:text-slate-400">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400">
                  <Clock className="h-4 w-4" />
                </span>
                <span>
                  <span className="block font-semibold text-slate-900 dark:text-white">Response time</span>
                  Usually within 1–2 business days
                </span>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
              <LifeBuoy className="h-4 w-4 text-red-600 dark:text-red-400" /> Need faster help?
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Sign in and open a support ticket for account, billing, or course issues.
            </p>
            <Link to="/support" className="btn-secondary mt-3 w-full">
              Go to support centre
            </Link>
            <Link to="/faq" className="btn-ghost mt-2 w-full">
              Read the FAQ
            </Link>
          </div>

          <div className="card p-6 text-sm text-slate-600 dark:text-slate-400">
            <h2 className="font-bold text-slate-900 dark:text-white">For companies</h2>
            <p className="mt-1">
              Hiring developers or want to post a role? Mention your company and the role in
              your message and our team will follow up.
            </p>
          </div>
        </div>

        <div className="card p-6 lg:col-span-3">
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
            <MessageCircle className="h-5 w-5 text-red-600 dark:text-red-400" /> Send a message
          </h2>

          {sent && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              Your email app should open with the message ready to send. If it does not,
              email us directly at tweackchech@gmail.com.
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="contact-name" className="label">Full name</label>
                <input
                  id="contact-name"
                  value={form.name}
                  onChange={update('name')}
                  className="input-field"
                  placeholder="Your name"
                  required
                />
              </div>
              <div>
                <label htmlFor="contact-email" className="label">Email address</label>
                <input
                  id="contact-email"
                  type="email"
                  value={form.email}
                  onChange={update('email')}
                  className="input-field"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="contact-subject" className="label">Subject</label>
              <input
                id="contact-subject"
                value={form.subject}
                onChange={update('subject')}
                className="input-field"
                placeholder="How can we help?"
              />
            </div>

            <div>
              <label htmlFor="contact-message" className="label">Message</label>
              <textarea
                id="contact-message"
                rows={6}
                value={form.message}
                onChange={update('message')}
                className="input-field"
                placeholder="Tell us what you need help with…"
                required
              />
            </div>

            <button type="submit" className="btn-primary w-full !py-3">
              <Send className="h-4 w-4" /> Send message
            </button>
            <p className="text-center text-xs text-slate-400">
              We never share your contact details. Read our{' '}
              <Link to="/privacy" className="font-semibold text-red-600 dark:text-red-400">
                privacy policy
              </Link>
              .
            </p>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ContactPage;
