import { useEffect, useState } from 'react';
import { api } from '../api';

function parseSeatIds(input) {
  return input
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => Number(s));
}

export function BookingPage({ authUser }) {
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
        setError(err.response?.data?.error || err.message);
      }
    };
    loadEvents();
  }, [eventId]);

  const ensureLoggedIn = () => {
    if (!authUser) {
      setError('Please login before booking.');
      return false;
    }
    return true;
  };

  const handleLockSeats = async () => {
    if (!ensureLoggedIn()) return;
    setLoading(true);
    setError(null);
    setBookingResult(null);
    try {
      const res = await api.post('/lock-seats', {
        eventId: Number(eventId),
        seatIds
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
    if (!ensureLoggedIn()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/pricing/quote', {
        eventId: Number(eventId),
        seatIds,
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
    if (!ensureLoggedIn()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/bookings/confirm', {
        eventId: Number(eventId),
        seatIds,
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

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-4xl bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-700">
        <h1 className="text-2xl font-semibold text-white mb-4">
          IPL Ticket Booking
        </h1>

        {authUser ? (
          <p className="text-xs text-slate-300 mb-3">
            Logged in as <span className="font-semibold">{authUser.name}</span> ({authUser.role})
          </p>
        ) : (
          <p className="text-xs text-red-400 mb-3">
            You are not logged in. Please login before booking.
          </p>
        )}

        {error && (
          <p className="text-xs text-red-400 mb-3">
            {error}
          </p>
        )}

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-1">
                Select Event
              </label>
              <select
                className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-50"
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
                className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-50"
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
                className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-50"
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
              className="w-full rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60"
            >
              Lock Seats (5 min)
            </button>
            <button
              type="button"
              onClick={handlePricing}
              disabled={loading}
              className="w-full rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60"
            >
              Get Pricing Quote
            </button>
            <button
              type="button"
              onClick={handleConfirmBooking}
              disabled={loading}
              className="w-full rounded-md bg-indigo-500 px-4 py-2 text-sm font-semibold text-slate-50 disabled:opacity-60"
            >
              Confirm Booking
            </button>
            {loading && (
              <p className="text-xs text-slate-300 mt-2">
                Working on your request...
              </p>
            )}
          </div>
        </div>

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

