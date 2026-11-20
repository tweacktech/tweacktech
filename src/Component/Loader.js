// Loader.js
import "../App.css";
import React from "react";
import { GraduationCap } from "lucide-react";

/**
 * Branded full-screen loader used while the app boots or a route chunk
 * downloads. Keeps the same API as before: it renders a fixed overlay.
 */
const Loader = ({ label = "Preparing your workspace" }) => {
  return (
    <div
      className="loader-container"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="loader-card">
        <div className="loader-mark" aria-hidden="true">
          <span className="loader-orbit loader-orbit-a" />
          <span className="loader-orbit loader-orbit-b" />
          <span className="loader-glow" />
          <span className="loader-logo">
            <GraduationCap className="loader-logo-icon" strokeWidth={2.1} />
          </span>
        </div>

        <p className="loader-brand">
          Tweack<span>Tech</span>
        </p>
        <p className="loader-label">{label}</p>

        <div className="loader-bar" aria-hidden="true">
          <span className="loader-bar-fill" />
        </div>

        <div className="loader-dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
};

export default Loader;
