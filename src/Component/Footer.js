import React from 'react';
import { Link } from 'react-router-dom';
import {
  Github,
  GraduationCap,
  Linkedin,
  Mail,
  MapPin,
  Twitter,
} from 'lucide-react';

const columns = [
  {
    title: 'Learn',
    links: [
      { to: '/courses', label: 'Course catalog' },
      { to: '/dashboard', label: 'My dashboard' },
      { to: '/assignments', label: 'Assignments' },
      { to: '/register', label: 'Create account' },
    ],
  },
  {
    title: 'Talent',
    links: [
      { to: '/talent', label: 'Developer profiles' },
      { to: '/jobs', label: 'Job board' },
      { to: '/blog', label: 'Career articles' },
    ],
  },
  {
    title: 'Company',
    links: [
      { to: '/about', label: 'About us' },
      { to: '/contact', label: 'Contact' },
      { to: '/support', label: 'Support centre' },
      { to: '/faq', label: 'FAQ' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { to: '/privacy', label: 'Privacy policy' },
      { to: '/terms', label: 'Terms of service' },
      { to: '/cookies', label: 'Cookie policy' },
    ],
  },
];

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
      <div className="container-page py-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-red-500 to-red-700 text-white">
                <GraduationCap className="h-5 w-5" />
              </span>
              <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
                Tweack<span className="text-red-600 dark:text-red-500">Tech</span>
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              A learning management system for tech skills and a talent hub for
              programmers. Learn, get certified, and connect with companies
              hiring developers.
            </p>
            <div className="mt-5 space-y-2 text-sm text-slate-500 dark:text-slate-400">
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-red-600 dark:text-red-500" />
                <a href="mailto:tweackchech@gmail.com" className="hover:text-red-600 dark:hover:text-red-400">
                  tweackchech@gmail.com
                </a>
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-red-600 dark:text-red-500" />
                Lagos, Nigeria · Remote-first
              </p>
            </div>
            <div className="mt-5 flex gap-3">
              {[
                { href: 'https://github.com', icon: Github, label: 'GitHub' },
                { href: 'https://twitter.com', icon: Twitter, label: 'Twitter' },
                { href: 'https://linkedin.com', icon: Linkedin, label: 'LinkedIn' },
              ].map(({ href, icon: Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={label}
                  className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-red-300 dark:hover:border-red-700 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                {column.title}
              </h2>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-sm text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-200 dark:border-slate-800 pt-6 text-xs text-slate-500 dark:text-slate-400 sm:flex-row">
          <p>© {year} TweackTech LMS & Talent Hub. All rights reserved.</p>
          <p>Built with care for the tech community.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
