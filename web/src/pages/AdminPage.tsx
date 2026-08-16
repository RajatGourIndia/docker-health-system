import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { adminApi, ApiError } from '../api/client';
import type { AdminSettings, SystemInfo } from '../api/types';

function formatUptime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}h ${minutes}m ${seconds}s`;
}

function ChangePasswordPanel() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match');
      return;
    }

    setSubmitting(true);
    try {
      await adminApi.changePassword(currentPassword, newPassword, confirmPassword);
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to change password');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="panel">
      <h2>Change password</h2>
      <form onSubmit={handleSubmit}>
        {error && <p className="form-error">{error}</p>}
        {success && <p className="form-success">Password updated.</p>}
        <div className="field">
          <label htmlFor="current-password">Current password</label>
          <input
            id="current-password"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="new-password">New password</label>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="confirm-new-password">Confirm new password</label>
          <input
            id="confirm-new-password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        <button className="btn btn--primary" type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : 'Update password'}
        </button>
      </form>
    </div>
  );
}

function SettingsPanel() {
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [pollIntervalSeconds, setPollIntervalSeconds] = useState('');
  const [idleTimeoutMinutes, setIdleTimeoutMinutes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    adminApi.getSettings().then((s) => {
      setSettings(s);
      setPollIntervalSeconds(String(s.pollIntervalSeconds));
      setIdleTimeoutMinutes(String(s.idleTimeoutMinutes));
    });
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSubmitting(true);
    try {
      const updated = await adminApi.updateSettings({
        pollIntervalSeconds: Number(pollIntervalSeconds),
        idleTimeoutMinutes: Number(idleTimeoutMinutes),
      });
      setSettings(updated);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to update settings');
    } finally {
      setSubmitting(false);
    }
  }

  if (!settings) {
    return (
      <div className="panel">
        <h2>Settings</h2>
        <p className="cell-sub">Loading…</p>
      </div>
    );
  }

  return (
    <div className="panel">
      <h2>Settings</h2>
      <form onSubmit={handleSubmit}>
        {error && <p className="form-error">{error}</p>}
        {success && <p className="form-success">Settings saved.</p>}
        <div className="field">
          <label htmlFor="poll-interval">Live-list refresh interval (seconds)</label>
          <input
            id="poll-interval"
            type="number"
            min={3}
            max={300}
            value={pollIntervalSeconds}
            onChange={(e) => setPollIntervalSeconds(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="idle-timeout">Session idle timeout (minutes)</label>
          <input
            id="idle-timeout"
            type="number"
            min={1}
            max={1440}
            value={idleTimeoutMinutes}
            onChange={(e) => setIdleTimeoutMinutes(e.target.value)}
          />
        </div>
        <button className="btn btn--primary" type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save settings'}
        </button>
      </form>
    </div>
  );
}

function SystemInfoPanel() {
  const [info, setInfo] = useState<SystemInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminApi
      .systemInfo()
      .then(setInfo)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : 'Failed to load system info')
      );
  }, []);

  return (
    <div className="panel">
      <h2>System info</h2>
      {error && <p className="form-error">{error}</p>}
      {!info && !error && <p className="cell-sub">Loading…</p>}
      {info && (
        <>
          <div className="panel__row">
            <span className="panel__row-label">Docker Engine version</span>
            <span className="panel__row-value">{info.dockerVersion}</span>
          </div>
          <div className="panel__row">
            <span className="panel__row-label">API version</span>
            <span className="panel__row-value">{info.apiVersion}</span>
          </div>
          <div className="panel__row">
            <span className="panel__row-label">OS / Arch</span>
            <span className="panel__row-value">
              {info.os} / {info.arch}
            </span>
          </div>
          <div className="panel__row">
            <span className="panel__row-label">Dashboard uptime</span>
            <span className="panel__row-value">{formatUptime(info.dashboardUptimeSeconds)}</span>
          </div>
        </>
      )}
    </div>
  );
}

export function AdminPage() {
  return (
    <>
      <div className="page-header" style={{ marginBottom: 'var(--space-4)' }}>
        <h1>Admin</h1>
      </div>
      <div className="admin-grid">
        <ChangePasswordPanel />
        <SettingsPanel />
        <SystemInfoPanel />
      </div>
    </>
  );
}
