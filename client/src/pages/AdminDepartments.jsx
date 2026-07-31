import { useEffect, useState } from 'react';
import api from '../api/axios';

export default function AdminDepartments() {
  const [departments, setDepartments] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get('/departments');
      setDepartments(res.data.departments);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/departments', { name, description });
      setName('');
      setDescription('');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create department');
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this department?')) return;
    try {
      await api.delete(`/departments/${id}`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete department');
    }
  }

  return (
    <div className="page">
      <h1>Departments</h1>

      <form className="card inline-form" onSubmit={handleCreate}>
        <h2>Add department</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <div className="form-row">
          <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <input
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <button type="submit">Add</button>
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
                <th>Description</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {departments.map((d) => (
                <tr key={d._id}>
                  <td>{d.name}</td>
                  <td>{d.description || '—'}</td>
                  <td>
                    <button className="btn-danger" onClick={() => handleDelete(d._id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {departments.length === 0 && (
                <tr>
                  <td colSpan={3} className="empty-cell">
                    No departments yet.
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
