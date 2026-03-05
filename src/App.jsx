import { useEffect, useState } from 'react';
import { api } from './api';
import { AdminPage } from './pages/AdminPage';
import { BookingPage } from './pages/BookingPage';

function App() {
  const [authUser, setAuthUser] = useState(() => {
    const stored = window.localStorage.getItem('auth_user');
    return stored ? JSON.parse(stored) : null;
  });
  
  const [authTab, setAuthTab] = useState('login'); // 'login' | 'register'
  const [currentView, setCurrentView] = useState('booking'); // 'booking' | 'admin'
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Set auth token in API headers if available
    const token = window.localStorage.getItem('auth_token');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  const handleAuthSuccess = (user, token) => {
    window.localStorage.setItem('auth_user', JSON.stringify(user));
    window.localStorage.setItem('auth_token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setAuthUser(user);
    setError(null);
  };

  const handleLogout = () => {
    window.localStorage.removeItem('auth_user');
    window.localStorage.removeItem('auth_token');
    delete api.defaults.headers.common['Authorization'];
    setAuthUser(null);
    setCurrentView('booking'); // Reset to booking view on logout
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const endpoint = authTab === 'login' ? '/auth/login' : '/auth/register';
      const payload = authTab === 'login'
        ? { email: authForm.email, password: authForm.password }
        : authForm;

      const res = await api.post(endpoint, payload);
      handleAuthSuccess(res.data.user, res.data.token);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = authUser?.role === 'ADMIN';

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-semibold text-white">
            IPL Ticket Booking
          </h1>
          <div className="flex items-center gap-4">
            {authUser ? (
              <>
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <span>Welcome, <span className="font-semibold text-white">{authUser.name}</span></span>
                  <span className="text-slate-500">({authUser.role})</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentView('booking')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition ${
                      currentView === 'booking'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    Booking
                  </button>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setCurrentView('admin')}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition ${
                        currentView === 'admin'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      Admin
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-3 py-1 rounded-md border border-slate-500 text-sm text-slate-300 hover:bg-slate-700 transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <span className="text-sm text-slate-400">
                Please login to continue
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {authUser ? (
          currentView === 'admin' && isAdmin ? (
            <AdminPage authUser={authUser}/>
          ) : (
            <BookingPage authUser={authUser} />
          )
        ) : (
          /* Auth Modal */
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-full max-w-md bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-700">
              <div className="flex mb-6 text-sm font-medium">
                <button
                  type="button"
                  className={`flex-1 px-3 py-2 rounded-l-lg transition ${
                    authTab === 'login'
                      ? 'bg-slate-700 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                  onClick={() => setAuthTab('login')}
                >
                  Login
                </button>
                <button
                  type="button"
                  className={`flex-1 px-3 py-2 rounded-r-lg transition ${
                    authTab === 'register'
                      ? 'bg-slate-700 text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                  onClick={() => setAuthTab('register')}
                >
                  Register
                </button>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {authTab === 'register' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={authForm.name}
                      onChange={(e) => setAuthForm((f) => ({ ...f, name: e.target.value }))}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={authForm.email}
                    onChange={(e) => setAuthForm((f) => ({ ...f, email: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={authForm.password}
                    onChange={(e) => setAuthForm((f) => ({ ...f, password: e.target.value }))}
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-400">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60 transition"
                >
                  {loading ? 'Processing...' : (authTab === 'login' ? 'Login' : 'Register')}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

