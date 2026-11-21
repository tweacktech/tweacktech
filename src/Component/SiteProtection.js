import React, { useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';

/**
 * Deterrents against casual content copying and source inspection.
 * These raise the effort required — a browser app can never be made truly
 * impossible to inspect, since the code must run on the visitor's device.
 */
const SiteProtection = () => {
  const [devtools, setDevtools] = useState(false);

  useEffect(() => {
    // Local development and an explicit ?dev=1 flag keep debugging possible.
    const allowed =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      new URLSearchParams(window.location.search).get('dev') === '1';
    if (allowed) return undefined;

    const isEditable = (target) =>
      target instanceof HTMLElement &&
      (target.isContentEditable ||
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

    const block = (event) => {
      if (isEditable(event.target)) return;
      event.preventDefault();
    };

    const onKeyDown = (event) => {
      const key = String(event.key || '').toLowerCase();
      const modifier = event.ctrlKey || event.metaKey;
      const blocked =
        key === 'f12' ||
        (modifier && event.shiftKey && ['i', 'j', 'c'].includes(key)) ||
        (modifier && ['u', 's', 'p', 'a'].includes(key));
      if (blocked && !isEditable(event.target)) event.preventDefault();
    };

    document.addEventListener('contextmenu', block);
    document.addEventListener('selectstart', block);
    document.addEventListener('copy', block);
    document.addEventListener('cut', block);
    document.addEventListener('paste', block);
    document.addEventListener('dragstart', block);
    document.addEventListener('keydown', onKeyDown);

    // Desktop-only heuristic: docked developer tools shrink the layout
    // viewport while the outer window stays the same size.
    const finePointer = window.matchMedia?.('(pointer: fine)').matches;
    let timer = null;
    if (finePointer) {
      timer = window.setInterval(() => {
        const widthGap = window.outerWidth - window.innerWidth;
        const heightGap = window.outerHeight - window.innerHeight;
        setDevtools(widthGap > 200 || heightGap > 200);
      }, 1200);
    }

    return () => {
      document.removeEventListener('contextmenu', block);
      document.removeEventListener('selectstart', block);
      document.removeEventListener('copy', block);
      document.removeEventListener('cut', block);
      document.removeEventListener('paste', block);
      document.removeEventListener('dragstart', block);
      document.removeEventListener('keydown', onKeyDown);
      if (timer) window.clearInterval(timer);
    };
  }, []);

  if (!devtools) return null;

  return (
    <div className="fixed inset-0 z-[9999] grid place-items-center bg-slate-950/95 p-6 text-center backdrop-blur-xl">
      <div className="max-w-md">
        <ShieldAlert className="mx-auto h-12 w-12 text-red-500" />
        <h2 className="mt-4 text-xl font-extrabold text-white">Inspecting is disabled</h2>
        <p className="mt-2 text-sm text-slate-300">
          TweackTech course content is protected. Close developer tools and reload this page to
          continue learning.
        </p>
      </div>
    </div>
  );
};

export default SiteProtection;
