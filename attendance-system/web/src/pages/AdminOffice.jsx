import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { useToast } from '../components/Toast';

export default function AdminOffice() {
  const { show } = useToast();
  const [offices, setOffices] = useState([]);
  const [form, setForm] = useState({
    name: '',
    lat: '',
    lng: '',
    radiusMeters: '100'
  });
  const [editingId, setEditingId] = useState(null);

  const load = () => {
    api
      .get('/admin/offices')
      .then((res) => setOffices(res.data.offices || []))
      .catch((err) =>
        show(err.response?.data?.message || 'Failed to load offices', 'error')
      );
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setForm({ name: '', lat: '', lng: '', radiusMeters: '100' });
    setEditingId(null);
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      show('Geolocation not supported', 'error');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6)
        }));
      },
      (err) => show(err.message || 'Failed to get location', 'error'),
      { enableHighAccuracy: true }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      lat: Number(form.lat),
      lng: Number(form.lng),
      radiusMeters: Number(form.radiusMeters)
    };

    try {
      if (editingId) {
        await api.patch(`/admin/offices/${editingId}`, payload);
        show('Office updated', 'success');
      } else {
        await api.post('/admin/offices', payload);
        show('Office created', 'success');
      }
      resetForm();
      load();
    } catch (err) {
      show(err.response?.data?.message || 'Save failed', 'error');
    }
  };

  return (
    <div className="section">
      <div className="card space-y-4">
        <div className="section-header">
          <div>
            <h1 className="section-title">Offices</h1>
            <p className="section-subtitle">Manage office geofence locations.</p>
          </div>
          <button className="btn-ghost" type="button" onClick={useCurrentLocation}>
            Use my current location
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-4">
          <div>
            <label className="label">Name</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">Latitude</label>
            <input
              className="input"
              value={form.lat}
              onChange={(e) => setForm({ ...form, lat: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">Longitude</label>
            <input
              className="input"
              value={form.lng}
              onChange={(e) => setForm({ ...form, lng: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">Radius (m)</label>
            <input
              className="input"
              value={form.radiusMeters}
              onChange={(e) => setForm({ ...form, radiusMeters: e.target.value })}
            />
          </div>
          <div className="form-actions md:col-span-4">
            <button className="btn-primary" type="submit">
              {editingId ? 'Update Office' : 'Create Office'}
            </button>
            <button className="btn-ghost" type="button" onClick={resetForm}>
              Clear
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Lat</th>
              <th>Lng</th>
              <th>Radius</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {offices.map((office) => (
              <tr key={office._id}>
                <td data-label="Name">{office.name}</td>
                <td data-label="Lat">{office.lat}</td>
                <td data-label="Lng">{office.lng}</td>
                <td data-label="Radius">{office.radiusMeters} m</td>
                <td data-label="Actions">
                  <button
                    className="btn-ghost"
                    onClick={() => {
                      setEditingId(office._id);
                      setForm({
                        name: office.name,
                        lat: office.lat,
                        lng: office.lng,
                        radiusMeters: office.radiusMeters
                      });
                    }}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
            {!offices.length && (
              <tr>
                <td colSpan="5" className="py-6 text-center text-slate-500">
                  No offices found.
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
