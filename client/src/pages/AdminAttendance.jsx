import { useEffect, useState } from 'react';
import api from '../api/axios';

const emptyFilters = { employee: '', department: '', from: '', to: '', status: '' };

export default function AdminAttendance() {
  const [filters, setFilters] = useState(emptyFilters);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    Promise.all([api.get('/employees'), api.get('/departments')]).then(([empRes, deptRes]) => {
      setEmployees(empRes.data.employees);
      setDepartments(deptRes.data.departments);
    });
  }, []);

  async function loadRecords() {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
      const res = await api.get('/attendance', { params });
      setRecords(res.data.attendance);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateFilter(field, value) {
    setFilters((f) => ({ ...f, [field]: value }));
  }

  async function handleExport() {
    setExporting(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
      const res = await api.get('/attendance/export', { params, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance-export-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="page">
      <h1>Attendance report</h1>

      <div className="card">
        <div className="form-row">
          <select value={filters.employee} onChange={(e) => updateFilter('employee', e.target.value)}>
            <option value="">All employees</option>
            {employees.map((e) => (
              <option key={e._id} value={e._id}>
                {e.name}
              </option>
            ))}
          </select>
          <select value={filters.department} onChange={(e) => updateFilter('department', e.target.value)}>
            <option value="">All departments</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </select>
          <select value={filters.status} onChange={(e) => updateFilter('status', e.target.value)}>
            <option value="">Any status</option>
            <option value="present">Present</option>
            <option value="late">Late</option>
            <option value="absent">Absent</option>
            <option value="half-day">Half day</option>
            <option value="on-leave">On leave</option>
          </select>
        </div>
        <div className="form-row">
          <label>
            From
            <input type="date" value={filters.from} onChange={(e) => updateFilter('from', e.target.value)} />
          </label>
          <label>
            To
            <input type="date" value={filters.to} onChange={(e) => updateFilter('to', e.target.value)} />
          </label>
          <button onClick={loadRecords}>Apply filters</button>
          <button onClick={handleExport} disabled={exporting}>
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <p>Loading...</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Employee</th>
                <th>Department</th>
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
                  <td>{r.employee?.name || 'Unknown'}</td>
                  <td>{r.employee?.department?.name || '—'}</td>
                  <td>{r.checkIn ? new Date(r.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                  <td>{r.checkOut ? new Date(r.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                  <td>{r.workHours ?? '—'}</td>
                  <td>
                    <span className={`badge badge-${r.status}`}>{r.status}</span>
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan={7} className="empty-cell">
                    No records match these filters.
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
