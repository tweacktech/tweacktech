import React, { useCallback, useEffect, useRef } from 'react';

const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

/** Google Identity Services button. Hidden until a client ID is configured. */
const GoogleSignIn = ({ onSuccess, text = 'signin_with' }) => {
  const buttonRef = useRef(null);
  const handleCredential = useCallback(
    (response) => {
      if (response?.credential) onSuccess?.(response.credential);
    },
    [onSuccess],
  );

  useEffect(() => {
    if (!CLIENT_ID || !buttonRef.current) return undefined;

    const render = () => {
      if (!window.google?.accounts?.id || !buttonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: handleCredential,
      });
      buttonRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        width: '100%',
        text,
        shape: 'pill',
      });
    };

    if (window.google?.accounts?.id) {
      render();
      return undefined;
    }

    let script = document.querySelector('script[data-google-gis="true"]');
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.dataset.googleGis = 'true';
      document.head.appendChild(script);
    }
    script.addEventListener('load', render);
    return () => script.removeEventListener('load', render);
  }, [handleCredential, text]);

  if (!CLIENT_ID) return null;

  return (
    <div className="mt-4">
      <div className="relative flex items-center gap-3">
        <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">or</span>
        <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
      </div>
      <div ref={buttonRef} className="mt-3 flex w-full justify-center" />
    </div>
  );
};

export default GoogleSignIn;
