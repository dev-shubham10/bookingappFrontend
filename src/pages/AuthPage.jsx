import { useState } from 'react';
import { api } from '../api';

export function AuthPage({ onAuth }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      if (mode === 'register') {
        const res = await api.post('/auth/register', form);
        onAuth(res.data.user, res.data.token);
      } else {
        const res = await api.post('/auth/login', {
          email: form.email,
          password: form.password
        });
        onAuth(res.data.user, res.data.token);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-700">
        <h1 className="text-xl font-semibold text-white mb-4">
          {mode === 'register' ? 'Create your account' : 'Login'}
        </h1>

        <div className="flex mb-4 text-xs font-medium">
          <button
            type="button"
            className={`flex-1 px-2 py-1 rounded-l-md ${
              mode === 'login' ? 'bg-slate-700 text-white' : 'bg-slate-900 text-slate-400'
            }`}
            onClick={() => setMode('login')}
          >
            Login
          </button>
          <button
            type="button"
            className={`flex-1 px-2 py-1 rounded-r-md ${
              mode === 'register' ? 'bg-slate-700 text-white' : 'bg-slate-900 text-slate-400'
            }`}
            onClick={() => setMode('register')}
          >
            Register
          </button>
        </div>

        {mode === 'register' && (
          <div className="mb-3">
            <label className="block text-xs font-medium text-slate-200 mb-1">
              Full Name
            </label>
            <input
              type="text"
              className="w-full rounded-md border border-slate-600 bg-slate-900 px-2 py-1 text-xs text-slate-50"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
        )}

        <div className="mb-3">
          <label className="block text-xs font-medium text-slate-200 mb-1">
            Email Address
          </label>
          <input
            type="email"
            className="w-full rounded-md border border-slate-600 bg-slate-900 px-2 py-1 text-xs text-slate-50"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
        </div>

        <div className="mb-4">
          <label className="block text-xs font-medium text-slate-200 mb-1">
            Password
          </label>
          <input
            type="password"
            className="w-full rounded-md border border-slate-600 bg-slate-900 px-2 py-1 text-xs text-slate-50"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          />
        </div>

        {error && <p className="text-xs text-red-400 mb-2">{error}</p>}

        <button
          type="button"
          disabled={loading}
          onClick={handleSubmit}
          className="w-full inline-flex items-center justify-center rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950 disabled:opacity-60"
        >
          {mode === 'register' ? 'Register (first user becomes admin)' : 'Login'}
        </button>

        <p className="mt-3 text-[10px] text-slate-400">
          The very first registered user gets the ADMIN role automatically and can create
          events and coupons.
        </p>
      </div>
    </div>
  );
}

