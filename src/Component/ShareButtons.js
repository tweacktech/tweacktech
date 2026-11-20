import React, { useMemo, useState } from 'react';
import {
  Check,
  Copy,
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  Send,
  Share2,
  Twitter,
} from 'lucide-react';

const absoluteUrl = (url) => {
  if (!url) return window.location.href;
  try {
    return new URL(url, window.location.origin).toString();
  } catch {
    return window.location.href;
  }
};

/**
 * Reusable share row for course/job/talent/blog detail pages.
 * Instagram has no web share endpoint, so it copies the link and tells the
 * user to paste it into their bio/story/DM.
 */
const ShareButtons = ({ url, title, description = '', className = '' }) => {
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState('');
  const link = useMemo(() => absoluteUrl(url), [url]);
  const text = useMemo(
    () => [title, description].filter(Boolean).join(' — '),
    [description, title],
  );

  const copy = async (message = 'Link copied — paste it anywhere you want to share.') => {
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = link;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setNotice(message);
    window.setTimeout(() => setCopied(false), 2200);
    window.setTimeout(() => setNotice(''), 4200);
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: description, url: link });
        return;
      } catch {
        // user cancelled or unsupported — fall through to copy
      }
    }
    await copy();
  };

  const links = [
    {
      label: 'Facebook',
      icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`,
    },
    {
      label: 'X',
      icon: Twitter,
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(
        link,
      )}&text=${encodeURIComponent(text)}`,
    },
    {
      label: 'WhatsApp',
      icon: Send,
      href: `https://wa.me/?text=${encodeURIComponent(`${text}\n${link}`)}`,
    },
    {
      label: 'LinkedIn',
      icon: Linkedin,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`,
    },
    {
      label: 'Telegram',
      icon: Send,
      href: `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(
        text,
      )}`,
    },
    {
      label: 'Email',
      icon: Mail,
      href: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(
        `${text}\n\n${link}`,
      )}`,
    },
  ];

  return (
    <div className={`relative flex flex-wrap items-center gap-2 ${className}`}>
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400">
        <Share2 className="h-3.5 w-3.5" /> Share
      </span>

      <button
        type="button"
        onClick={() => copy()}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-red-300 hover:text-red-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
        title="Copy link"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? 'Copied' : 'Copy'}
      </button>

      {links.map(({ label, icon: Icon, href }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-red-300 hover:text-red-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          title={`Share on ${label}`}
          aria-label={`Share on ${label}`}
        >
          <Icon className="h-3.5 w-3.5" />
        </a>
      ))}

      <button
        type="button"
        onClick={() =>
          copy('Link copied — paste it into your Instagram bio, story or DM.')
        }
        className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-pink-300 hover:text-pink-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
        title="Copy for Instagram"
        aria-label="Copy link for Instagram"
      >
        <Instagram className="h-3.5 w-3.5" />
      </button>

      {typeof navigator !== 'undefined' && navigator.share && (
        <button
          type="button"
          onClick={nativeShare}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-red-300 hover:text-red-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
        >
          <Share2 className="h-3.5 w-3.5" /> More
        </button>
      )}

      {notice && (
        <span className="w-full rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
          {notice}
        </span>
      )}
    </div>
  );
};

export default ShareButtons;
