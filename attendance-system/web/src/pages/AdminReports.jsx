import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { useToast } from '../components/Toast';

export default function AdminReports() {
  const { show } = useToast();
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [offices, setOffices] = useState([]);
  const [filters, setFilters] = useState({
    from: '',
    to: '',
    userId: '',
    officeId: '',
    status: '',
    type: ''
  });

  const loadFilters = async () => {
    try {
      const [usersRes, officesRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/offices')
      ]);
      setUsers(usersRes.data.users || []);
      setOffices(officesRes.data.offices || []);
    } catch (err) {
      show('Failed to load filters', 'error');
    }
  };

  const load = async () => {
    try {
      const res = await api.get('/admin/attendance', { params: filters });
      setItems(res.data.items || []);
    } catch (err) {
      show(err.response?.data?.message || 'Failed to load attendance', 'error');
    }
  };

  useEffect(() => {
    loadFilters();
    load();
  }, []);

  const exportCsv = () => {
    if (!items.length) {
      show('No data to export', 'error');
      return;
    }

    const rows = items.map((item) => ({
      name: item.userId?.name || '',
      email: item.userId?.email || '',
      employeeCode: item.userId?.employeeCode || '',
      office: item.officeId?.name || '',
      type: item.type,
      workMode: item.workMode || 'OFFICE',
      serverTime: new Date(item.serverTime).toISOString(),
      distanceMeters: item.distanceMeters ?? '',
      status: item.status,
      reason: item.reason || '',
      photoPath: item.photoPath
    }));

    const header = Object.keys(rows[0]).join(',');
    const csv = [
      header,
      ...rows.map((row) =>
        Object.values(row)
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(',')
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="section">
      <div className="card space-y-4">
        <div className="section-header">
          <div>
            <h1 className="section-title">Reports</h1>
            <p className="section-subtitle">
              Filter attendance data and export it as CSV.
            </p>
          </div>
          <div className="form-actions">
            <button className="btn-primary" onClick={load}>
              Apply Filters
            </button>
            <button className="btn-ghost" onClick={exportCsv}>
              Export CSV
            </button>
          </div>
        </div>

        <div className="form-grid">
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
            <label className="label">Employee</label>
            <select
              className="input"
              value={filters.userId}
              onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
            >
              <option value="">All</option>
              {users.map((user) => (
                <option key={user._id} value={user._id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Office</label>
            <select
              className="input"
              value={filters.officeId}
              onChange={(e) =>
                setFilters({ ...filters, officeId: e.target.value })
              }
            >
              <option value="">All</option>
              {offices.map((office) => (
                <option key={office._id} value={office._id}>
                  {office.name}
                </option>
              ))}
            </select>
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
      </div>

      <div className="card space-y-3">
        <div className="section-header">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Attendance Results
            </h2>
            <p className="section-subtitle">
              Review punches and open stored photos.
            </p>
          </div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Type</th>
                <th>Time</th>
                <th>Mode</th>
                <th>Distance</th>
                <th>Status</th>
                <th>Photo</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id}>
                  <td data-label="User">
                    {item.userId?.name}
                    <div className="text-xs text-slate-500">
                      {item.userId?.employeeCode}
                    </div>
                  </td>
                  <td data-label="Type">{item.type}</td>
                  <td data-label="Time">
                    {new Date(item.serverTime).toLocaleString()}
                  </td>
                  <td data-label="Mode">
                    {item.workMode === 'WFH' ? 'WFH' : 'Office'}
                  </td>
                  <td data-label="Distance">
                    {item.workMode === 'WFH' || item.distanceMeters == null
                      ? 'N/A'
                      : `${item.distanceMeters} m`}
                  </td>
                  <td data-label="Status">{item.status}</td>
                  <td data-label="Photo">
                    <a
                      className="text-teal-700 underline"
                      href={item.photoPath}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View
                    </a>
                  </td>
                </tr>
              ))}
              {!items.length && (
                <tr>
                  <td colSpan="7" className="py-6 text-center text-slate-500">
                    No results.
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
