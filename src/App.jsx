import { useEffect, useState } from 'react';
import { api } from './api';

function parseSeatIds(input) {
  return input
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => Number(s));
}

function App() {
  const [authUser, setAuthUser] = useState(() => {
    const stored = window.localStorage.getItem('auth_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [authTab, setAuthTab] = useState('login'); // 'login' | 'register'

  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState('');
  const [seatIdsInput, setSeatIdsInput] = useState('1,2,3');
  const [couponCode, setCouponCode] = useState('');

  const [lockResult, setLockResult] = useState(null);
  const [pricingResult, setPricingResult] = useState(null);
  const [bookingResult, setBookingResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const seatIds = parseSeatIds(seatIdsInput);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const res = await api.get('/events');
        setEvents(res.data);
        if (res.data.length > 0 && !eventId) {
          setEventId(String(res.data[0].id));
        }
      } catch (err) {
        // ignore for now, error will surface when trying to book
      }
    };
    loadEvents();
  }, [eventId]);

  const handleAuthSuccess = (user, token) => {
    window.localStorage.setItem('auth_user', JSON.stringify(user));
    window.localStorage.setItem('auth_token', token);
    setAuthUser(user);
  };

  const handleLogout = () => {
    window.localStorage.removeItem('auth_user');
    window.localStorage.removeItem('auth_token');
    setAuthUser(null);
  };

  const handleLockSeats = async () => {
    if (!authUser) {
      setError('Please login before locking seats.');
      return;
    }
    setLoading(true);
    setError(null);
    setBookingResult(null);
    try {
      const res = await api.post('/lock-seats', {
        eventId: Number(eventId),
        seatIds,
        userId: authUser?.id || 'guest'
      });
      setLockResult(res.data);
    } catch (err) {
      setLockResult(null);
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePricing = async () => {
    if (!authUser) {
      setError('Please login before getting a pricing quote.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/pricing/quote', {
        eventId: Number(eventId),
        seatIds,
        userId: authUser?.id || 'guest',
        couponCode: couponCode || undefined
      });
      setPricingResult(res.data);
    } catch (err) {
      setPricingResult(null);
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmBooking = async () => {
    if (!authUser) {
      setError('Please login before confirming a booking.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/bookings/confirm', {
        eventId: Number(eventId),
        seatIds,
        userId: authUser?.id || 'guest',
        couponCode: couponCode || undefined,
        paymentReference: 'PAYMENT-DEMO-123'
      });
      setBookingResult(res.data);
    } catch (err) {
      setBookingResult(null);
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSubmit = async (mode, form) => {
    setLoading(true);
    setError(null);
    try {
      if (mode === 'register') {
        const res = await api.post('/auth/register', form);
        handleAuthSuccess(res.data.user, res.data.token);
      } else {
        const res = await api.post('/auth/login', {
          email: form.email,
          password: form.password
        });
        handleAuthSuccess(res.data.user, res.data.token);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const [authForm, setAuthForm] = useState({
    name: '',
    email: '',
    password: ''
  });

  const isAdmin = authUser?.role === 'ADMIN';

  // Initial event form state
  const initialEventForm = {
    eventName: '',
    eventDateTime: '',
    venueName: '',
    venueState: ''
  };
  const [adminFormEvent, setAdminFormEvent] = useState(initialEventForm);

  const handleCreateEvent = async () => {
    setLoading(true);
    setError(null);

    try {
      await api.post('/admin/events', adminFormEvent);

      const res = await api.get('/events');
      setEvents(res.data);

      //Clear form here
      setAdminFormEvent(initialEventForm);

    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const initialCouponForm = {
    code: '',
    description: '',
    discountType: 'PERCENT',
    discountValue: 10,
    maxDiscountAmount: 100,
    minOrderValue: 300,
    expiryAt: '',
    globalUsageLimit: 1000,
    perUserLimit: 2,
    applicableEventIds: ''
  };
  const [adminFormCoupon, setAdminFormCoupon] = useState(initialCouponForm);

  const handleCreateCoupon = async () => {
    setLoading(true);
    setError(null);

    try {
      const eventIds = parseSeatIds(adminFormCoupon.applicableEventIds);

      await api.post('/admin/coupons', {
        ...adminFormCoupon,
        applicableEventIds: eventIds
      });

      // ✅ Clear form after success
      setAdminFormCoupon(initialCouponForm);

    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-3xl bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-white">
            IPL Ticket Booking Demo
          </h1>
          <div className="flex items-center gap-3 text-xs text-slate-200">
            {authUser ? (
              <>
                <span>
                  Logged in as <span className="font-semibold">{authUser.name}</span>{' '}
                  ({authUser.role})
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-md border border-slate-500 px-2 py-1 hover:bg-slate-700"
                >
                  Logout
                </button>
              </>
            ) : (
              <span className="text-slate-400">
                Not logged in (bookings will use a temporary user id)
              </span>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {!authUser &&
            <div className="md:col-span-1 bg-slate-900/60 border border-slate-700 rounded-lg p-4">
              <div className="flex mb-3 text-xs font-medium">
                <button
                  type="button"
                  className={`flex-1 px-2 py-1 rounded-l-md ${authTab === 'login' ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  onClick={() => setAuthTab('login')}
                >
                  Login
                </button>
                <button
                  type="button"
                  className={`flex-1 px-2 py-1 rounded-r-md ${authTab === 'register' ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  onClick={() => setAuthTab('register')}
                >
                  Register
                </button>
              </div>

              <div className="space-y-3">
                {authTab === 'register' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-200 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-md border border-slate-600 bg-slate-900 px-2 py-1 text-xs text-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      value={authForm.name}
                      onChange={(e) => setAuthForm((f) => ({ ...f, name: e.target.value }))}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-200 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full rounded-md border border-slate-600 bg-slate-900 px-2 py-1 text-xs text-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={authForm.email}
                    onChange={(e) => setAuthForm((f) => ({ ...f, email: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-200 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    className="w-full rounded-md border border-slate-600 bg-slate-900 px-2 py-1 text-xs text-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={authForm.password}
                    onChange={(e) => setAuthForm((f) => ({ ...f, password: e.target.value }))}
                  />
                </div>

                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handleAuthSubmit(authTab, authForm)}
                  className="w-full inline-flex items-center justify-center rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-950 shadow-sm hover:bg-emerald-400 disabled:opacity-60"
                >
                  {authTab === 'register' ? 'Register (first user becomes admin)' : 'Login'}
                </button>

                <p className="text-[10px] text-slate-400 mt-2">
                  The very first registered user gets the ADMIN role automatically and can
                  create events and coupons.
                </p>
              </div>
            </div>
          }

          <div className="md:col-span-2 space-y-4">
            <div className="bg-slate-900/60 border border-slate-700 rounded-lg p-4">
              <h2 className="font-semibold text-slate-100 mb-3 text-sm">
                Booking Details
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-1">
                      Event
                    </label>
                    <select
                      className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      value={eventId}
                      onChange={(e) => setEventId(e.target.value)}
                    >
                      {events.map((ev) => (
                        <option key={ev.id} value={ev.id}>
                          {ev.name} @ {ev.venueName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-1">
                      Seat IDs (comma separated)
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      value={seatIdsInput}
                      onChange={(e) => setSeatIdsInput(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-1">
                      Coupon Code (optional)
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleLockSeats}
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm hover:bg-emerald-400 disabled:opacity-60"
                  >
                    Lock Seats (5 min)
                  </button>

                  <button
                    type="button"
                    onClick={handlePricing}
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm hover:bg-sky-400 disabled:opacity-60"
                  >
                    Get Pricing Quote
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmBooking}
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center rounded-md bg-indigo-500 px-4 py-2 text-sm font-semibold text-slate-50 shadow-sm hover:bg-indigo-400 disabled:opacity-60"
                  >
                    Confirm Booking (simulate payment success)
                  </button>

                  {loading && (
                    <p className="text-xs text-slate-300 mt-2">
                      Working on your request...
                    </p>
                  )}
                </div>
              </div>
            </div>

            {isAdmin && (
              <div className="bg-slate-900/60 border border-emerald-700 rounded-lg p-4">
                <h2 className="font-semibold text-emerald-300 mb-3 text-sm">
                  Admin Panel (create events & coupons)
                </h2>
                <div className="grid md:grid-cols-2 gap-4 text-xs">
                  {/* New Event */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-slate-100 text-xs">
                      New Event
                    </h3>

                    <div>
                      <label className="block text-xs font-medium text-slate-200 mb-1">
                        Event Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. IPL Match: RCB vs CSK"
                        className="w-full rounded-md border border-slate-600 bg-slate-900 px-2 py-1 text-xs text-slate-50"
                        value={adminFormEvent.eventName}
                        onChange={(e) =>
                          setAdminFormEvent((f) => ({ ...f, eventName: e.target.value }))
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-200 mb-1">
                        Match Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        className="w-full rounded-md border border-slate-600 bg-slate-900 px-2 py-1 text-xs text-slate-50"
                        value={adminFormEvent.eventDateTime}
                        onChange={(e) =>
                          setAdminFormEvent((f) => ({ ...f, eventDateTime: e.target.value }))
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-200 mb-1">
                        Venue Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Chinnaswamy Stadium"
                        className="w-full rounded-md border border-slate-600 bg-slate-900 px-2 py-1 text-xs text-slate-50"
                        value={adminFormEvent.venueName}
                        onChange={(e) =>
                          setAdminFormEvent((f) => ({ ...f, venueName: e.target.value }))
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-200 mb-1">
                        Venue State Code
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. KA"
                        className="w-full rounded-md border border-slate-600 bg-slate-900 px-2 py-1 text-xs text-slate-50"
                        value={adminFormEvent.venueState}
                        onChange={(e) =>
                          setAdminFormEvent((f) => ({ ...f, venueState: e.target.value }))
                        }
                      />
                    </div>

                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleCreateEvent}
                      className="mt-1 inline-flex items-center justify-center rounded-md bg-emerald-500 px-3 py-1 text-xs font-semibold text-slate-950 disabled:opacity-60"
                    >
                      Create Event
                    </button>
                  </div>

                  {/* New Coupon */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-slate-100 text-xs">
                      New Coupon
                    </h3>

                    <div>
                      <label className="block text-xs font-medium text-slate-200 mb-1">
                        Coupon Code
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. IPLFUN"
                        className="w-full rounded-md border border-slate-600 bg-slate-900 px-2 py-1 text-xs text-slate-50"
                        value={adminFormCoupon.code}
                        onChange={(e) =>
                          setAdminFormCoupon((f) => ({ ...f, code: e.target.value.toUpperCase() }))
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-200 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        placeholder="Short description"
                        className="w-full rounded-md border border-slate-600 bg-slate-900 px-2 py-1 text-xs text-slate-50"
                        value={adminFormCoupon.description}
                        onChange={(e) =>
                          setAdminFormCoupon((f) => ({ ...f, description: e.target.value }))
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-200 mb-1">
                        Discount Type
                      </label>
                      <select
                        className="w-full rounded-md border border-slate-600 bg-slate-900 px-2 py-1 text-xs text-slate-50"
                        value={adminFormCoupon.discountType}
                        onChange={(e) =>
                          setAdminFormCoupon((f) => ({ ...f, discountType: e.target.value }))
                        }
                      >
                        <option value="PERCENT">Percent (%)</option>
                        <option value="FLAT">Flat (₹)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-200 mb-1">
                        Discount Value
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 10"
                        className="w-full rounded-md border border-slate-600 bg-slate-900 px-2 py-1 text-xs text-slate-50"
                        value={adminFormCoupon.discountValue}
                        onChange={(e) =>
                          setAdminFormCoupon((f) => ({
                            ...f,
                            discountValue: Number(e.target.value)
                          }))
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-200 mb-1">
                        Max Discount Amount
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 300"
                        className="w-full rounded-md border border-slate-600 bg-slate-900 px-2 py-1 text-xs text-slate-50"
                        value={adminFormCoupon.maxDiscountAmount}
                        onChange={(e) =>
                          setAdminFormCoupon((f) => ({
                            ...f,
                            maxDiscountAmount: Number(e.target.value)
                          }))
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-200 mb-1">
                        Minimum Order Value
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 1000"
                        className="w-full rounded-md border border-slate-600 bg-slate-900 px-2 py-1 text-xs text-slate-50"
                        value={adminFormCoupon.minOrderValue}
                        onChange={(e) =>
                          setAdminFormCoupon((f) => ({
                            ...f,
                            minOrderValue: Number(e.target.value)
                          }))
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-200 mb-1">
                        Expiry Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        className="w-full rounded-md border border-slate-600 bg-slate-900 px-2 py-1 text-xs text-slate-50"
                        value={adminFormCoupon.expiryAt}
                        onChange={(e) =>
                          setAdminFormCoupon((f) => ({ ...f, expiryAt: e.target.value }))
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-200 mb-1">
                        Global Usage Limit
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 5000"
                        className="w-full rounded-md border border-slate-600 bg-slate-900 px-2 py-1 text-xs text-slate-50"
                        value={adminFormCoupon.globalUsageLimit}
                        onChange={(e) =>
                          setAdminFormCoupon((f) => ({
                            ...f,
                            globalUsageLimit: Number(e.target.value)
                          }))
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-200 mb-1">
                        Per User Usage Limit
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 2"
                        className="w-full rounded-md border border-slate-600 bg-slate-900 px-2 py-1 text-xs text-slate-50"
                        value={adminFormCoupon.perUserLimit}
                        onChange={(e) =>
                          setAdminFormCoupon((f) => ({
                            ...f,
                            perUserLimit: Number(e.target.value)
                          }))
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-200 mb-1">
                        Applicable Event IDs
                      </label>
                      <input
                        type="text"
                        placeholder="Comma separated IDs, e.g. 1,2,3"
                        className="w-full rounded-md border border-slate-600 bg-slate-900 px-2 py-1 text-xs text-slate-50"
                        value={adminFormCoupon.applicableEventIds}
                        onChange={(e) =>
                          setAdminFormCoupon((f) => ({ ...f, applicableEventIds: e.target.value }))
                        }
                      />
                    </div>

                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleCreateCoupon}
                      className="mt-1 inline-flex items-center justify-center rounded-md bg-emerald-500 px-3 py-1 text-xs font-semibold text-slate-950 disabled:opacity-60"
                    >
                      Create Coupon
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-400 mb-4">
            {error}
          </p>
        )}
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div className="bg-slate-900/70 rounded-lg p-4 border border-slate-700">
            <h2 className="font-semibold text-slate-100 mb-2 text-sm">
              Seat Lock
            </h2>
            {lockResult ? (
              <pre className="text-xs text-slate-300 whitespace-pre-wrap break-words">
                {JSON.stringify(lockResult, null, 2)}
              </pre>
            ) : (
              <p className="text-xs text-slate-400">
                Lock seats to reserve them for 5 minutes.
              </p>
            )}
          </div>

          <div className="bg-slate-900/70 rounded-lg p-4 border border-slate-700">
            <h2 className="font-semibold text-slate-100 mb-2 text-sm">
              Pricing Quote
            </h2>
            {pricingResult ? (
              <pre className="text-xs text-slate-300 whitespace-pre-wrap break-words">
                {JSON.stringify(pricingResult.breakdown, null, 2)}
              </pre>
            ) : (
              <p className="text-xs text-slate-400">
                Get a quote with booking fee, coupon, and GST.
              </p>
            )}
          </div>

          <div className="bg-slate-900/70 rounded-lg p-4 border border-slate-700">
            <h2 className="font-semibold text-slate-100 mb-2 text-sm">
              Booking Result
            </h2>
            {bookingResult ? (
              <pre className="text-xs text-slate-300 whitespace-pre-wrap break-words">
                {JSON.stringify(bookingResult, null, 2)}
              </pre>
            ) : (
              <p className="text-xs text-slate-400">
                Confirm to create a booking and persist to MySQL.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

