import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ADSENSE_CLIENT, ADSENSE_SCRIPT_ID, shouldShowAds } from '../lib/adsense';

/**
 * Loads the AdSense library only on content pages.
 *
 * The script is never removed once loaded: AdSense keeps its own state and
 * re-injecting it would double-count page views. Route changes simply decide
 * whether it is allowed to start for this visit.
 */
const AdSenseLoader = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    if (!shouldShowAds(pathname)) return;
    if (document.getElementById(ADSENSE_SCRIPT_ID)) return;
    if (document.querySelector('script[src*="adsbygoogle.js"]')) return;

    const script = document.createElement('script');
    script.id = ADSENSE_SCRIPT_ID;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
    document.head.appendChild(script);
  }, [pathname]);

  return null;
};

export default AdSenseLoader;
