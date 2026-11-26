/**
 * Consent preferences for cookies and advertising.
 *
 * We keep the record in localStorage (no cookies are set before a choice) and
 * broadcast changes so ad/analytics code can react without prop drilling.
 *
 * Note: Google requires a certified CMP for personalised ads in the EEA/UK.
 * This banner records and exposes consent; configure AdSense's own messaging
 * (Privacy & messaging → GDPR) as the certified layer for those regions.
 */
export const CONSENT_KEY = 'tweack-consent-v1';
export const CONSENT_EVENT = 'tweack-consent-change';
export const OPEN_CONSENT_EVENT = 'tweack-open-consent';

export const readConsent = () => {
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== 1) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const saveConsent = ({ analytics = false, ads = false } = {}) => {
  const value = {
    version: 1,
    necessary: true,
    analytics: Boolean(analytics),
    ads: Boolean(ads),
    decidedAt: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(CONSENT_KEY, JSON.stringify(value));
  } catch {
    // Storage can be blocked; the session still behaves as "essential only".
  }
  try {
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }));
  } catch {
    // CustomEvent is unavailable in very old browsers; ignore.
  }
  return value;
};

export const hasConsent = (type) => {
  if (type === 'necessary') return true;
  const consent = readConsent();
  return Boolean(consent && consent[type]);
};

export const openConsentSettings = () => {
  try {
    window.dispatchEvent(new Event(OPEN_CONSENT_EVENT));
  } catch {
    // ignore
  }
};
