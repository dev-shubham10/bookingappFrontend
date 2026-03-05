import { useState, useEffect } from 'react';
import { api } from '../api';

export function AdminPage({ authUser }) {
    const [activeTab, setActiveTab] = useState('events');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Events state
    const [events, setEvents] = useState([]);
    const [eventForm, setEventForm] = useState({
        eventName: '',
        eventDateTime: '',
        venueName: '',
        venueState: ''
    });

    // Seat sections state
    const [selectedEventId, setSelectedEventId] = useState('');
    const [sectionForm, setSectionForm] = useState({
        sectionName: '',
        bookingFeeType: 'FLAT',
        bookingFeeValue: 0
    });

    // Seats state
    const [selectedSectionId, setSelectedSectionId] = useState('');
    const [seatsForm, setSeatsForm] = useState({
        seats: [{ label: '', basePrice: 0 }]
    });

    // Coupons state
    const [couponForm, setCouponForm] = useState({
        code: '',
        description: '',
        discountType: 'PERCENT',
        discountValue: 0,
        maxDiscountAmount: '',
        minOrderValue: 0,
        expiryAt: '',
        globalUsageLimit: '',
        perUserLimit: '',
        applicableEventIds: []
    });

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        try {
            const res = await api.get('/events');
            setEvents(res.data);
        } catch (err) {
            setError(err.response?.data?.error || err.message);
        }
    };

    const handleEventSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const res = await api.post('/admin/events', eventForm);
            setSuccess(`Event created successfully! ID: ${res.data.id}`);
            setEventForm({
                eventName: '',
                eventDateTime: '',
                venueName: '',
                venueState: ''
            });
            loadEvents(); // Refresh events list
        } catch (err) {
            setError(err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSectionSubmit = async (e) => {
        e.preventDefault();
        if (!selectedEventId) {
            setError('Please select an event first');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const res = await api.post('/admin/seat-sections', {
                eventId: Number(selectedEventId),
                ...sectionForm
            });
            setSuccess(`Seat section created successfully! ID: ${res.data.id}`);
            setSectionForm({
                sectionName: '',
                bookingFeeType: 'FLAT',
                bookingFeeValue: 0
            });
        } catch (err) {
            setError(err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSeatsSubmit = async (e) => {
        e.preventDefault();
        if (!selectedEventId || !selectedSectionId) {
            setError('Please select an event and section first');
            return;
        }

        // Validate seats
        const validSeats = seatsForm.seats.filter(seat => seat.label && seat.basePrice > 0);
        if (validSeats.length === 0) {
            setError('Please add at least one seat with label and price');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const res = await api.post('/admin/seats/bulk', {
                eventId: Number(selectedEventId),
                sectionId: Number(selectedSectionId),
                seats: validSeats
            });
            setSuccess(`Created ${res.data.count} seats successfully!`);
            setSeatsForm({ seats: [{ label: '', basePrice: 0 }] });
        } catch (err) {
            setError(err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCouponSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const couponData = {
                ...couponForm,
                applicableEventIds: couponForm.applicableEventIds.map(id => Number(id))
            };

            // Convert empty strings to null for optional fields
            if (couponData.maxDiscountAmount === '') couponData.maxDiscountAmount = null;
            if (couponData.globalUsageLimit === '') couponData.globalUsageLimit = null;
            if (couponData.perUserLimit === '') couponData.perUserLimit = null;

            const res = await api.post('/admin/coupons', couponData);
            setSuccess(`Coupon created successfully! ID: ${res.data.id}`);
            setCouponForm({
                code: '',
                description: '',
                discountType: 'PERCENT',
                discountValue: 0,
                maxDiscountAmount: '',
                minOrderValue: 0,
                expiryAt: '',
                globalUsageLimit: '',
                perUserLimit: '',
                applicableEventIds: []
            });
        } catch (err) {
            setError(err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    };

    const addSeatRow = () => {
        setSeatsForm(prev => ({
            seats: [...prev.seats, { label: '', basePrice: 0 }]
        }));
    };

    const updateSeatRow = (index, field, value) => {
        setSeatsForm(prev => ({
            seats: prev.seats.map((seat, i) =>
                i === index ? { ...seat, [field]: value } : seat
            )
        }));
    };

    const removeSeatRow = (index) => {
        setSeatsForm(prev => ({
            seats: prev.seats.filter((_, i) => i !== index)
        }));
    };

    const toggleEventSelection = (eventId) => {
        setCouponForm(prev => ({
            ...prev,
            applicableEventIds: prev.applicableEventIds.includes(eventId)
                ? prev.applicableEventIds.filter(id => id !== eventId)
                : [...prev.applicableEventIds, eventId]
        }));
    };

    if (!authUser || authUser.role !== 'ADMIN') {
        return (
            <div className="min-h-screen flex items-center justify-center px-4">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-400 mb-4">Access Denied</h1>
                    <p className="text-slate-300">You need admin privileges to access this page.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 text-white p-4">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold mb-8 text-center">Admin Dashboard</h1>

                {/* Tab Navigation */}
                <div className="flex space-x-1 mb-6 bg-slate-800 p-1 rounded-lg">
                    {['events', 'sections', 'seats', 'coupons'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${activeTab === tab
                                ? 'bg-blue-600 text-white'
                                : 'text-slate-300 hover:text-white hover:bg-slate-700'
                                }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Status Messages */}
                {error && (
                    <div className="mb-4 p-4 bg-red-900/50 border border-red-500 rounded-lg">
                        <p className="text-red-300">{error}</p>
                    </div>
                )}

                {success && (
                    <div className="mb-4 p-4 bg-green-900/50 border border-green-500 rounded-lg">
                        <p className="text-green-300">{success}</p>
                    </div>
                )}

                {/* Events Tab */}
                {activeTab === 'events' && (
                    <div className="bg-slate-800 rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-4">Create New Event</h2>
                        <form onSubmit={handleEventSubmit} className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-200 mb-1">
                                        Event Name
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={eventForm.eventName}
                                        onChange={(e) => setEventForm(prev => ({ ...prev, eventName: e.target.value }))}
                                        className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-50"
                                        placeholder="e.g., IPL Final 2026"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-200 mb-1">
                                        Event Date & Time
                                    </label>
                                    <input
                                        type="datetime-local"
                                        required
                                        value={eventForm.eventDateTime}
                                        onChange={(e) => setEventForm(prev => ({ ...prev, eventDateTime: e.target.value }))}
                                        className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-200 mb-1">
                                        Venue Name
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={eventForm.venueName}
                                        onChange={(e) => setEventForm(prev => ({ ...prev, venueName: e.target.value }))}
                                        className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-50"
                                        placeholder="e.g., Eden Gardens"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-200 mb-1">
                                        Venue State
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={eventForm.venueState}
                                        onChange={(e) => setEventForm(prev => ({ ...prev, venueState: e.target.value.toUpperCase() }))}
                                        className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-50"
                                        placeholder="e.g., WB"
                                        maxLength="2"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 hover:bg-blue-700"
                            >
                                {loading ? 'Creating Event...' : 'Create Event'}
                            </button>
                        </form>

                        {/* Existing Events */}
                        <div className="mt-8">
                            <h3 className="text-lg font-semibold mb-4">Existing Events</h3>
                            <div className="space-y-2">
                                {events.map((event) => (
                                    <div key={event.id} className="p-3 bg-slate-700 rounded-md">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h4 className="font-medium">{event.name}</h4>
                                                <p className="text-sm text-slate-300">
                                                    {new Date(event.eventDateTime).toLocaleString()} @ {event.venueName}
                                                </p>
                                            </div>
                                            <span className="text-xs bg-slate-600 px-2 py-1 rounded">
                                                ID: {event.id}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Seat Sections Tab */}
                {activeTab === 'sections' && (
                    <div className="bg-slate-800 rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-4">Create Seat Section</h2>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-slate-200 mb-2">
                                Select Event
                            </label>
                            <select
                                value={selectedEventId}
                                onChange={(e) => setSelectedEventId(e.target.value)}
                                className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-50"
                            >
                                <option value="">Choose an event...</option>
                                {events.map((event) => (
                                    <option key={event.id} value={event.id}>
                                        {event.name} @ {event.venueName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <form onSubmit={handleSectionSubmit} className="space-y-4">
                            <div className="grid md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-200 mb-1">
                                        Section Name
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={sectionForm.sectionName}
                                        onChange={(e) => setSectionForm(prev => ({ ...prev, sectionName: e.target.value }))}
                                        className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-50"
                                        placeholder="e.g., Premium"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-200 mb-1">
                                        Fee Type
                                    </label>
                                    <select
                                        value={sectionForm.bookingFeeType}
                                        onChange={(e) => setSectionForm(prev => ({ ...prev, bookingFeeType: e.target.value }))}
                                        className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-50"
                                    >
                                        <option value="FLAT">Flat Amount</option>
                                        <option value="PERCENT">Percentage</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-200 mb-1">
                                        Fee Value
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="0.01"
                                        value={sectionForm.bookingFeeValue}
                                        onChange={(e) => setSectionForm(prev => ({ ...prev, bookingFeeValue: Number(e.target.value) }))}
                                        className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-50"
                                        placeholder={sectionForm.bookingFeeType === 'FLAT' ? 'e.g., 100' : 'e.g., 5'}
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading || !selectedEventId}
                                className="w-full rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 hover:bg-green-700"
                            >
                                {loading ? 'Creating Section...' : 'Create Seat Section'}
                            </button>
                        </form>
                    </div>
                )}

                {/* Seats Tab */}
                {activeTab === 'seats' && (
                    <div className="bg-slate-800 rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-4">Bulk Create Seats</h2>

                        <div className="grid md:grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-200 mb-2">
                                    Select Event
                                </label>
                                <select
                                    value={selectedEventId}
                                    onChange={(e) => setSelectedEventId(e.target.value)}
                                    className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-50"
                                >
                                    <option value="">Choose an event...</option>
                                    {events.map((event) => (
                                        <option key={event.id} value={event.id}>
                                            {event.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-200 mb-2">
                                    Select Section
                                </label>
                                <select
                                    value={selectedSectionId}
                                    onChange={(e) => setSelectedSectionId(e.target.value)}
                                    className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-50"
                                    disabled={!selectedEventId}
                                >
                                    <option value="">Choose a section...</option>
                                    {/* Note: In a real app, you'd fetch sections for the selected event */}
                                    <option value="1">Premium</option>
                                    <option value="2">Standard</option>
                                    <option value="3">Economy</option>
                                </select>
                            </div>
                        </div>

                        <form onSubmit={handleSeatsSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-medium">Seats to Create</h3>
                                    <button
                                        type="button"
                                        onClick={addSeatRow}
                                        className="px-3 py-1 bg-slate-700 text-slate-300 rounded text-sm hover:bg-slate-600"
                                    >
                                        + Add Seat
                                    </button>
                                </div>

                                {seatsForm.seats.map((seat, index) => (
                                    <div key={index} className="flex gap-2 items-center">
                                        <input
                                            type="text"
                                            placeholder="Seat Label (e.g., P1)"
                                            value={seat.label}
                                            onChange={(e) => updateSeatRow(index, 'label', e.target.value)}
                                            className="flex-1 rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-50"
                                        />
                                        <input
                                            type="number"
                                            placeholder="Price"
                                            min="0"
                                            step="0.01"
                                            value={seat.basePrice || ''}
                                            onChange={(e) => updateSeatRow(index, 'basePrice', Number(e.target.value))}
                                            className="w-24 rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-50"
                                        />
                                        {seatsForm.seats.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeSeatRow(index)}
                                                className="px-2 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                                            >
                                                ×
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !selectedEventId || !selectedSectionId}
                                className="w-full rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 hover:bg-purple-700"
                            >
                                {loading ? 'Creating Seats...' : 'Create Seats'}
                            </button>
                        </form>
                    </div>
                )}

                {/* Coupons Tab */}
                {activeTab === 'coupons' && (
                    <div className="bg-slate-800 rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-4">Create Coupon</h2>
                        <form onSubmit={handleCouponSubmit} className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-200 mb-1">
                                        Coupon Code
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={couponForm.code}
                                        onChange={(e) => setCouponForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                                        className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-50"
                                        placeholder="e.g., SAVE10"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-200 mb-1">
                                        Description
                                    </label>
                                    <input
                                        type="text"
                                        value={couponForm.description}
                                        onChange={(e) => setCouponForm(prev => ({ ...prev, description: e.target.value }))}
                                        className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-50"
                                        placeholder="Optional description"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-200 mb-1">
                                        Discount Type
                                    </label>
                                    <select
                                        value={couponForm.discountType}
                                        onChange={(e) => setCouponForm(prev => ({ ...prev, discountType: e.target.value }))}
                                        className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-50"
                                    >
                                        <option value="FLAT">Flat Amount</option>
                                        <option value="PERCENT">Percentage</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-200 mb-1">
                                        Discount Value
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="0.01"
                                        value={couponForm.discountValue}
                                        onChange={(e) => setCouponForm(prev => ({ ...prev, discountValue: Number(e.target.value) }))}
                                        className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-50"
                                        placeholder={couponForm.discountType === 'FLAT' ? 'e.g., 100' : 'e.g., 10'}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-200 mb-1">
                                        Max Discount Amount
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={couponForm.maxDiscountAmount}
                                        onChange={(e) => setCouponForm(prev => ({ ...prev, maxDiscountAmount: e.target.value }))}
                                        className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-50"
                                        placeholder="Optional cap"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-200 mb-1">
                                        Min Order Value
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={couponForm.minOrderValue}
                                        onChange={(e) => setCouponForm(prev => ({ ...prev, minOrderValue: Number(e.target.value) }))}
                                        className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-50"
                                        placeholder="e.g., 1000"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-200 mb-1">
                                        Expiry Date & Time
                                    </label>
                                    <input
                                        type="datetime-local"
                                        required
                                        value={couponForm.expiryAt}
                                        onChange={(e) => setCouponForm(prev => ({ ...prev, expiryAt: e.target.value }))}
                                        className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-200 mb-1">
                                        Global Usage Limit
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={couponForm.globalUsageLimit}
                                        onChange={(e) => setCouponForm(prev => ({ ...prev, globalUsageLimit: e.target.value }))}
                                        className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-50"
                                        placeholder="Optional"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-200 mb-1">
                                        Per User Limit
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={couponForm.perUserLimit}
                                        onChange={(e) => setCouponForm(prev => ({ ...prev, perUserLimit: e.target.value }))}
                                        className="w-full rounded-md border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-50"
                                        placeholder="Optional"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-200 mb-2">
                                    Applicable Events
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                                    {events.map((event) => (
                                        <label key={event.id} className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                checked={couponForm.applicableEventIds.includes(event.id)}
                                                onChange={() => toggleEventSelection(event.id)}
                                                className="rounded border-slate-600 bg-slate-900 text-blue-600"
                                            />
                                            <span className="text-sm text-slate-300">{event.name}</span>
                                        </label>
                                    ))}
                                </div>
                                <p className="text-xs text-slate-400 mt-1">
                                    Leave unchecked for all events
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 hover:bg-orange-700"
                            >
                                {loading ? 'Creating Coupon...' : 'Create Coupon'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
