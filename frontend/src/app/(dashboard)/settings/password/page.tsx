'use client';

import React, { useState } from 'react';
import { soundEngine } from '@/components/SoundEngine';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function PasswordPage() {
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPass !== confirmPass) {
      setFeedback({
        message: '❌ Passwords do not match!',
        type: 'error',
      });
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/settings/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_password: oldPass,
          new_password: newPass
        })
      });
      if (res.ok) {
        soundEngine.playChime([523.25], 0.15);
        setFeedback({
          message: '✓ Password updated successfully!',
          type: 'success',
        });
        setOldPass('');
        setNewPass('');
        setConfirmPass('');
      } else {
        const data = await res.json();
        setFeedback({
          message: `❌ ${data.detail || 'Failed to update password'}`,
          type: 'error',
        });
      }
    } catch (err) {
      console.error('Error changing password:', err);
      setFeedback({
        message: '❌ Connection error',
        type: 'error',
      });
    }

    setTimeout(() => {
      setFeedback(null);
    }, 3000);
  };

  return (
    <section className="dashboard-view active-view" id="view-settings-password">
      <div className="card-glass panel-setting max-w-md">
        <h3 className="panel-title">Change Password</h3>
        <p className="panel-desc">Update your client portal access security parameters.</p>

        <form className="settings-form" id="password-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="old-pass">Current Password</label>
            <input
              type="password"
              id="old-pass"
              value={oldPass}
              onChange={(e) => setOldPass(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="new-pass">New Password</label>
            <input
              type="password"
              id="new-pass"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirm-pass">Confirm New Password</label>
            <input
              type="password"
              id="confirm-pass"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-submit">
            Change Password
          </button>
          {feedback && (
            <div
              id="pass-success"
              className="alert-success-inline"
              style={{
                display: 'block',
                color: feedback.type === 'error' ? 'var(--color-orange)' : 'var(--color-success)',
                marginTop: '12px',
              }}
            >
              {feedback.message}
            </div>
          )}
        </form>
      </div>
    </section>
  );
}
