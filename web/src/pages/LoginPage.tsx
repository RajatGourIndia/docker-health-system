import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Layers } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../api/client';

export function LoginPage() {
  const { status, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);

  if (status === 'authenticated') {
    const redirectTo = (location.state as { from?: string } | null)?.from ?? '/';
    return <Navigate to={redirectTo} replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(username, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? 'Invalid username or password' : 'Login failed');
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
            <div className="login-brand__name">Docker Dashboard</div>
            <div className="login-brand__tagline">Lightweight container monitoring</div>
          </div>
        </div>
        <form className="login-card" onSubmit={handleSubmit}>
          <h1>Sign in</h1>
          {error && <p className="form-error">{error}</p>}
          <div className="field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              autoFocus
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            className="btn btn--primary"
            type="submit"
            disabled={submitting}
            style={{ width: '100%' }}
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <button
          type="button"
          className="login-recovery-toggle"
          onClick={() => setShowRecovery((v) => !v)}
        >
          Forgot password?
        </button>

        {showRecovery && (
          <div className="login-recovery-panel">
            <p>
              There's no email-based reset for this self-hosted tool — recovery requires shell
              access to the container it's running in, since that already implies full control
              over this Docker host:
            </p>
            <code className="login-recovery-command">
              docker exec -it &lt;container-name&gt; npm run reset-admin-password
            </code>
            <p className="cell-sub">
              The <code className="login-recovery-inline-code">-it</code> flags matter — without
              them the prompt has no terminal to read your typed password from and just hangs.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
