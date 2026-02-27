import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { useToast } from '../components/Toast';

export default function AdminDashboard() {
  const { show } = useToast();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api
      .get('/admin/dashboard')
      .then((res) => setStats(res.data))
      .catch((err) =>
        show(err.response?.data?.message || 'Failed to load dashboard', 'error')
      );
  }, []);

  return (
    <div className="section">
      <div className="card">
        <div className="section-header">
          <div>
            <h1 className="section-title">Today Overview</h1>
            <p className="section-subtitle">
              Live count of today punch statuses.
            </p>
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
    </div>
  );
}
