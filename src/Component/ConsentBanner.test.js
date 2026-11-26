import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import ConsentBanner from './ConsentBanner';
import { CONSENT_KEY, readConsent } from '../lib/consent';

// react-router-dom v7 is ESM-first and does not resolve under CRA's Jest
// config. The banner only needs a plain anchor, so stub the Link component.
jest.mock(
  'react-router-dom',
  () => {
    const ReactLib = require('react');
    return {
      Link: ({ to, children, ...rest }) =>
        ReactLib.createElement('a', { href: to, ...rest }, children),
    };
  },
  { virtual: true },
);

const renderBanner = () => render(<ConsentBanner />);

describe('ConsentBanner', () => {
  beforeEach(() => localStorage.clear());

  it('asks for a choice on a first visit', () => {
    renderBanner();
    expect(screen.getByText(/your privacy, your choice/i)).toBeInTheDocument();
  });

  it('records a full acceptance', () => {
    renderBanner();
    fireEvent.click(screen.getByRole('button', { name: /accept all/i }));
    expect(readConsent()).toMatchObject({ ads: true, analytics: true });
    expect(screen.queryByText(/your privacy, your choice/i)).not.toBeInTheDocument();
  });

  it('records essential-only and stays hidden afterwards', () => {
    renderBanner();
    fireEvent.click(screen.getByRole('button', { name: /essential only/i }));
    expect(readConsent()).toMatchObject({ ads: false, analytics: false });
    expect(localStorage.getItem(CONSENT_KEY)).toBeTruthy();
    expect(screen.queryByText(/your privacy, your choice/i)).not.toBeInTheDocument();
  });

  it('does not appear once a choice is already stored', () => {
    localStorage.setItem(
      CONSENT_KEY,
      JSON.stringify({ version: 1, necessary: true, ads: true, analytics: true }),
    );
    renderBanner();
    expect(screen.queryByText(/your privacy, your choice/i)).not.toBeInTheDocument();
  });

  it('re-opens from the footer settings event', () => {
    localStorage.setItem(
      CONSENT_KEY,
      JSON.stringify({ version: 1, necessary: true, ads: true, analytics: true }),
    );
    renderBanner();
    fireEvent(window, new Event('tweack-open-consent'));
    expect(screen.getByText(/your privacy, your choice/i)).toBeInTheDocument();
  });
});
