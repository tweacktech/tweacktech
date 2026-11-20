import React, { useState } from 'react';
import { normalizeImageUrl } from '../lib/image';
import { Link } from 'react-router-dom';
import {
  BadgeCheck,
  BookOpen,
  Check,
  Copy,
  Facebook,
  Linkedin,
  MapPin,
  MessageCircle,
  Send,
  Share2,
  Twitter,
} from 'lucide-react';
import { copyText, mentorShareLinks } from '../lib/share';

const ICONS = {
  whatsapp: MessageCircle,
  x: Twitter,
  linkedin: Linkedin,
  facebook: Facebook,
  telegram: Send,
};

const TONES = {
  whatsapp: 'hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/40',
  x: 'hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white',
  linkedin: 'hover:bg-sky-50 hover:text-sky-700 dark:hover:bg-sky-950/40',
  facebook: 'hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-950/40',
  telegram: 'hover:bg-cyan-50 hover:text-cyan-600 dark:hover:bg-cyan-950/40',
};

export const MentorShareRow = ({ mentor, compact = false, className = '' }) => {
  const [copied, setCopied] = useState(false);
  const { links, url } = mentorShareLinks(mentor);
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {links
        .filter((link) => (compact ? ['whatsapp', 'x', 'linkedin'].includes(link.id) : true))
        .map((link) => {
          const Icon = ICONS[link.id];
          return (
            <a
              key={link.id}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              title={`Share on ${link.label}`}
              aria-label={`Share ${mentor?.user?.firstName || 'mentor'} on ${link.label}`}
              className={`grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition-colors dark:border-slate-700 dark:text-slate-400 ${TONES[link.id]}`}
            >
              <Icon className="h-4 w-4" />
            </a>
          );
        })}
      <button
        type="button"
        onClick={async () => {
          const ok = await copyText(url);
          if (ok) {
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
          }
        }}
        title="Copy profile link"
        aria-label="Copy mentor profile link"
        className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-red-950/40"
      >
        {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
};

const initials = (user) =>
  `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || 'TT';

const MentorCard = ({ mentor, featured = false }) => {
  const user = mentor.user || {};
  return (
    <article
      className={`card group relative flex flex-col overflow-hidden transition-transform duration-300 hover:-translate-y-1 ${
        featured ? 'ring-2 ring-red-500/20' : ''
      }`}
    >
      <div className="relative h-24 bg-gradient-to-r from-red-600 via-red-700 to-slate-900">
        <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_20%_20%,white,transparent_45%),radial-gradient(circle_at_80%_0%,white,transparent_35%)]" />
        {mentor.isFeatured && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur">
            <BadgeCheck className="h-3 w-3" /> Featured mentor
          </span>
        )}
      </div>
      <div className="relative flex flex-1 flex-col px-5 pb-5">
        <div className="-mt-9 flex items-end justify-between gap-3">
          {user.avatar ? (
            <img loading="lazy" decoding="async"
              src={normalizeImageUrl(user.avatar)}
              alt={`${user.firstName} ${user.lastName}`}
              className="h-16 w-16 rounded-2xl border-4 border-white object-cover shadow-md dark:border-slate-900"
            />
          ) : (
            <span className="grid h-16 w-16 place-items-center rounded-2xl border-4 border-white bg-red-100 text-lg font-extrabold text-red-700 shadow-md dark:border-slate-900 dark:bg-red-950/60 dark:text-red-300">
              {initials(user)}
            </span>
          )}
          <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <BookOpen className="h-3 w-3" />
            {mentor.courseCount || 0} course{(mentor.courseCount || 0) === 1 ? '' : 's'}
          </span>
        </div>

        <h3 className="mt-3 text-lg font-bold leading-tight text-slate-900 dark:text-white">
          {user.firstName} {user.lastName}
        </h3>
        <p className="mt-1 text-sm font-medium text-red-600 dark:text-red-400">{mentor.headline}</p>

        {mentor.qualifications?.length > 0 && (
          <ul className="mt-3 space-y-1">
            {mentor.qualifications.slice(0, 2).map((qualification) => (
              <li
                key={qualification}
                className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-300"
              >
                <BadgeCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                <span className="line-clamp-2">{qualification}</span>
              </li>
            ))}
          </ul>
        )}

        {mentor.skills?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {mentor.skills.slice(0, 3).map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              >
                {skill}
              </span>
            ))}
            {mentor.skills.length > 3 && (
              <span className="text-[11px] font-semibold text-slate-400">
                +{mentor.skills.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
          {mentor.yearsExperience ? <span>{mentor.yearsExperience}+ yrs experience</span> : null}
          {(user.location || mentor.location) && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {user.location || mentor.location}
            </span>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
          <MentorShareRow mentor={mentor} compact />
          <Link
            to={`/mentors/${mentor.userId}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 dark:text-red-400"
          >
            <Share2 className="h-3.5 w-3.5" /> View profile
          </Link>
        </div>
      </div>
    </article>
  );
};

export default MentorCard;
