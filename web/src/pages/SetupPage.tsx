import { useState } from 'react';
import type { FormEvent } from 'react';
import { Layers } from 'lucide-react';
import { setupApi, ApiError } from '../api/client';

export function SetupPage({ onComplete }: { onComplete: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      await setupApi.create(username, password);
      onComplete();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create admin account');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-content">
        <div className="login-brand">
          <div className="login-brand__mark" aria-hidden="true">
            <Layers size={18} strokeWidth={2.2} />
          </div>
          <div>
            <div className="login-brand__name">docker-health-system</div>
            <div className="login-brand__tagline">Lightweight container monitoring</div>
          </div>
        </div>
        <form className="login-card" onSubmit={handleSubmit}>
          <h1>Create admin account</h1>
          <p className="login-card__hint">
            First time here — set up the one admin account this dashboard uses.
          </p>
          {error && <p className="form-error">{error}</p>}
          <div className="field">
            <label htmlFor="setup-username">Username</label>
            <input
              id="setup-username"
              autoFocus
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="setup-password">Password</label>
            <input
              id="setup-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="setup-confirm-password">Confirm password</label>
            <input
              id="setup-confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <button
            className="btn btn--primary"
            type="submit"
            disabled={submitting}
            style={{ width: '100%' }}
          >
            {submitting ? 'Creating…' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
}
