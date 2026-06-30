import React, { useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import { useToast } from '../components/Toast';

const getLocalDateString = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().split('T')[0];
};

export default function AdminDashboard() {
  const { show } = useToast();
  const [stats, setStats] = useState(null);
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
  const [items, setItems] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');

  const loadStats = () => {
    api
      .get('/admin/dashboard')
      .then((res) => setStats(res.data))
      .catch((err) =>
        show(err.response?.data?.message || 'Failed to load dashboard', 'error')
      );
  };

  const loadAttendance = async (date) => {
    try {
      const from = new Date(`${date}T00:00:00`);
      const to = new Date(`${date}T23:59:59.999`);
      const res = await api.get('/admin/attendance', {
        params: { from: from.toISOString(), to: to.toISOString() }
      });
      setItems(res.data.items || []);
      setSelectedEmployeeId('');
    } catch (err) {
      show(err.response?.data?.message || 'Failed to load attendance', 'error');
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    loadAttendance(selectedDate);
  }, [selectedDate]);

  const groupedEmployees = useMemo(() => {
    return items.reduce((acc, item) => {
      if (!item.userId?._id) return acc;
      const id = item.userId._id;
      if (!acc[id]) {
        acc[id] = { user: item.userId, punches: [] };
      }
      acc[id].punches.push(item);
      return acc;
    }, {});
  }, [items]);

  const employeeList = useMemo(() => {
    return Object.values(groupedEmployees).sort((a, b) =>
      (a.user?.name || '').localeCompare(b.user?.name || '')
    );
  }, [groupedEmployees]);

  const selectedEmployee = employeeList.find(
    (entry) => entry.user?._id === selectedEmployeeId
  );

  const selectedPunches = selectedEmployee
    ? [...selectedEmployee.punches].sort(
        (a, b) => new Date(a.serverTime) - new Date(b.serverTime)
      )
    : [];

  return (
    <div className="section">
      <div className="card space-y-4">
        <div className="section-header">
          <div>
            <h1 className="section-title">Admin Overview</h1>
            <p className="section-subtitle">
              Track daily attendance and drill into employee punches.
            </p>
          </div>
          <div className="w-full md:w-auto">
            <label className="label">Select Date</label>
            <input
              className="input"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <div className="card">
            <div className="text-sm text-slate-500">Total Punches</div>
            <div className="text-2xl font-semibold">{stats.totalPunches}</div>
          </div>
          <div className="card">
            <div className="text-sm text-slate-500">Approved</div>
            <div className="text-2xl font-semibold">{stats.approved}</div>
          </div>
          <div className="card">
            <div className="text-sm text-slate-500">Flagged</div>
            <div className="text-2xl font-semibold">{stats.flagged}</div>
          </div>
          <div className="card">
            <div className="text-sm text-slate-500">Rejected</div>
            <div className="text-2xl font-semibold">{stats.rejected}</div>
          </div>
        </div>
      )}

      <div className="card space-y-3">
        <div className="section-header">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Employees on {selectedDate}
            </h2>
            <p className="section-subtitle">
              Click an employee to view full punch details.
            </p>
          </div>
        </div>

        {employeeList.length === 0 ? (
          <p className="text-sm text-slate-500">No punches for this date.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {employeeList.map((entry) => (
              <button
                key={entry.user._id}
                type="button"
                onClick={() => setSelectedEmployeeId(entry.user._id)}
                className={`card text-left transition hover:border-teal-500/40 ${
                  selectedEmployeeId === entry.user._id
                    ? 'border-teal-500/60 ring-2 ring-teal-500/20'
                    : 'border-black/5'
                }`}
              >
                <div className="text-xs text-slate-500">
                  {entry.user.employeeCode || 'No code'}
                </div>
                <div className="text-lg font-semibold text-slate-900">
                  {entry.user.name}
                </div>
                <div className="text-sm text-slate-600">
                  {entry.user.email}
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  {entry.punches.length} punches
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedEmployee && (
        <div className="card space-y-3">
          <div className="section-header">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Punch Details
              </h2>
              <p className="section-subtitle">
                {selectedEmployee.user.name} • {selectedDate}
              </p>
            </div>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Distance</th>
                  <th>Office</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {selectedPunches.map((punch) => (
                  <tr key={punch._id}>
                    <td>{new Date(punch.serverTime).toLocaleString()}</td>
                    <td>{punch.type}</td>
                    <td>{punch.status}</td>
                    <td>{punch.distanceMeters} m</td>
                    <td>{punch.officeId?.name || 'N/A'}</td>
                    <td>{punch.reason || '-'}</td>
                  </tr>
                ))}
                {!selectedPunches.length && (
                  <tr>
                    <td colSpan="6" className="py-6 text-center text-slate-500">
                      No punches for this employee.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
