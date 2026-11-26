import {
  CONSENT_EVENT,
  hasConsent,
  readConsent,
  saveConsent,
} from './consent';

describe('consent preferences', () => {
  beforeEach(() => localStorage.clear());

  it('returns null before a choice is made', () => {
    expect(readConsent()).toBeNull();
    expect(hasConsent('ads')).toBe(false);
  });

  it('always allows essential storage', () => {
    expect(hasConsent('necessary')).toBe(true);
  });

  it('stores and reads an accept-all decision', () => {
    saveConsent({ analytics: true, ads: true });
    expect(readConsent()).toMatchObject({
      version: 1,
      necessary: true,
      analytics: true,
      ads: true,
    });
    expect(hasConsent('ads')).toBe(true);
  });

  it('keeps non-essential categories off for essential-only', () => {
    saveConsent({ analytics: false, ads: false });
    expect(hasConsent('ads')).toBe(false);
    expect(hasConsent('analytics')).toBe(false);
  });

  it('notifies listeners when the choice changes', () => {
    const listener = jest.fn();
    window.addEventListener(CONSENT_EVENT, listener);
    saveConsent({ ads: true });
    window.removeEventListener(CONSENT_EVENT, listener);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('ignores malformed stored values', () => {
    localStorage.setItem('tweack-consent-v1', '{not json');
    expect(readConsent()).toBeNull();
  });
});
