import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { useToast } from '../components/Toast';

export default function WorkerHistory() {
  const { show } = useToast();
  const [items, setItems] = useState([]);
  const [filters, setFilters] = useState({
    from: '',
    to: '',
    status: '',
    type: ''
  });

  const load = async () => {
    try {
      const res = await api.get('/attendance/me', { params: filters });
      setItems(res.data.items || []);
    } catch (err) {
      show(err.response?.data?.message || 'Failed to load history', 'error');
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="section">
      <div className="card space-y-4">
        <div className="section-header">
          <div>
            <h1 className="section-title">My History</h1>
            <p className="section-subtitle">Review your recent punches.</p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          <div>
            <label className="label">From</label>
            <input
              className="input"
              type="date"
              value={filters.from}
              onChange={(e) => setFilters({ ...filters, from: e.target.value })}
            />
          </div>
          <div>
            <label className="label">To</label>
            <input
              className="input"
              type="date"
              value={filters.to}
              onChange={(e) => setFilters({ ...filters, to: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Status</label>
            <select
              className="input"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All</option>
              <option value="approved">Approved</option>
              <option value="flagged">Flagged</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label className="label">Type</label>
            <select
              className="input"
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            >
              <option value="">All</option>
              <option value="IN">IN</option>
              <option value="OUT">OUT</option>
            </select>
          </div>
        </div>
        <button className="btn-primary w-full md:w-auto" onClick={load}>
          Apply Filters
        </button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Type</th>
              <th>Status</th>
              <th>Distance</th>
              <th>Office</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item._id}>
                <td>{new Date(item.serverTime).toLocaleString()}</td>
                <td>{item.type}</td>
                <td>{item.status}</td>
                <td>{item.distanceMeters} m</td>
                <td>{item.officeId?.name || 'N/A'}</td>
              </tr>
            ))}
            {!items.length && (
              <tr>
                <td colSpan="5" className="py-6 text-center text-slate-500">
                  No records found.
                </td>
              </tr>
            )}
          </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
