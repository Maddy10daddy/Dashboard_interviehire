'use client';

import React, { useState } from 'react';
import { soundEngine } from '@/components/SoundEngine';

export default function CookiesPage() {
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playChime([523.25], 0.15);
    setFeedback('✓ Cookie tracking profiles saved!');
    setTimeout(() => {
      setFeedback(null);
    }, 3000);
  };

  return (
    <section className="dashboard-view active-view" id="view-settings-cookies">
      <div className="card-glass panel-setting max-w-md">
        <h3 className="panel-title">Cookie Settings</h3>
        <p className="panel-desc">Configure dashboard cookie performance track levels.</p>

        <form className="settings-form" id="cookies-form" onSubmit={handleSubmit}>
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input type="checkbox" id="cookie-essential" checked disabled />
              <span className="checkmark-wrap"></span>
              <span className="lbl-wrap">
                <strong className="title">Essential Cookies</strong>
                <span className="desc">Required for admin session tokens. Cannot be turned off.</span>
              </span>
            </label>
          </div>
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                id="cookie-analytics"
                checked={analyticsEnabled}
                onChange={(e) => setAnalyticsEnabled(e.target.checked)}
              />
              <span className="checkmark-wrap"></span>
              <span className="lbl-wrap">
                <strong className="title">Analytics Tracking</strong>
                <span className="desc">Enables usage dashboard data metrics reporting.</span>
              </span>
            </label>
          </div>
          <button type="submit" className="btn-submit">
            Save Cookie Policies
          </button>
          {feedback && (
            <div
              id="cookies-success"
              className="alert-success-inline"
              style={{
                display: 'block',
                marginTop: '12px',
                color: 'var(--color-success)',
              }}
            >
              {feedback}
            </div>
          )}
        </form>
      </div>
    </section>
  );
}
