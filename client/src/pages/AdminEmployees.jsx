import { useEffect, useState } from 'react';
import api from '../api/axios';

const emptyForm = { name: '', email: '', password: '', department: '', jobTitle: '' };

export default function AdminEmployees() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [empRes, deptRes] = await Promise.all([api.get('/employees'), api.get('/departments')]);
      setEmployees(empRes.data.employees);
      setDepartments(deptRes.data.departments);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function updateField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/employees', form);
      setForm(emptyForm);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create employee');
    }
  }

  async function handleDeactivate(id) {
    if (!window.confirm('Deactivate this employee? They will no longer be able to log in.')) return;
    try {
      await api.delete(`/employees/${id}`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not deactivate employee');
    }
  }

  return (
    <div className="page">
      <h1>Employees</h1>

      <form className="card inline-form" onSubmit={handleCreate}>
        <h2>Add employee</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <div className="form-row">
          <input
            placeholder="Full name"
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => updateField('email', e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Temporary password"
            value={form.password}
            onChange={(e) => updateField('password', e.target.value)}
            required
          />
        </div>
        <div className="form-row">
          <select value={form.department} onChange={(e) => updateField('department', e.target.value)}>
            <option value="">No department</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </select>
          <input
            placeholder="Job title (optional)"
            value={form.jobTitle}
            onChange={(e) => updateField('jobTitle', e.target.value)}
          />
          <button type="submit">Add employee</button>
        </div>
      </form>

      <div className="card">
        {loading ? (
          <p>Loading...</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Role</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={emp._id}>
                  <td>{emp.name}</td>
                  <td>{emp.email}</td>
                  <td>{emp.department?.name || '—'}</td>
                  <td>{emp.role}</td>
                  <td>
                    <span className={`badge ${emp.isActive ? 'badge-present' : 'badge-absent'}`}>
                      {emp.isActive ? 'active' : 'inactive'}
                    </span>
                  </td>
                  <td>
                    {emp.isActive && (
                      <button className="btn-danger" onClick={() => handleDeactivate(emp._id)}>
                        Deactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {employees.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty-cell">
                    No employees yet.
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
