import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

function formatTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  async function loadHistory() {
    setLoading(true);
    try {
      const res = await api.get('/attendance/me');
      setRecords(res.data.attendance);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  const todayIso = new Date().toISOString().slice(0, 10);
  const today = records.find((r) => r.date.slice(0, 10) === todayIso);

  async function handleCheckIn() {
    setActionError('');
    setActionLoading(true);
    try {
      await api.post('/attendance/check-in');
      await loadHistory();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Could not check in');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCheckOut() {
    setActionError('');
    setActionLoading(true);
    try {
      await api.post('/attendance/check-out');
      await loadHistory();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Could not check out');
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="page">
      <h1>Welcome, {user.name}</h1>

      <div className="card checkin-card">
        <h2>Today</h2>
        {actionError && <div className="alert alert-error">{actionError}</div>}
        <div className="checkin-row">
          <div>
            <span className="label">Check-in</span>
            <span className="value">{formatTime(today?.checkIn)}</span>
          </div>
          <div>
            <span className="label">Check-out</span>
            <span className="value">{formatTime(today?.checkOut)}</span>
          </div>
          <div>
            <span className="label">Status</span>
            <span className={`badge badge-${today?.status || 'none'}`}>{today?.status || 'not checked in'}</span>
          </div>
        </div>
        <div className="checkin-actions">
          <button onClick={handleCheckIn} disabled={actionLoading || !!today?.checkIn}>
            Check In
          </button>
          <button onClick={handleCheckOut} disabled={actionLoading || !today?.checkIn || !!today?.checkOut}>
            Check Out
          </button>
        </div>
      </div>

      <div className="card">
        <h2>My attendance history</h2>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Hours</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r._id}>
                  <td>{r.date.slice(0, 10)}</td>
                  <td>{formatTime(r.checkIn)}</td>
                  <td>{formatTime(r.checkOut)}</td>
                  <td>{r.workHours ?? '—'}</td>
                  <td>
                    <span className={`badge badge-${r.status}`}>{r.status}</span>
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty-cell">
                    No attendance recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
