import React, { useState } from 'react';
import api from '../api/client';
import CameraCapture from '../components/CameraCapture';
import LocationCapture from '../components/LocationCapture';
import { useToast } from '../components/Toast';

export default function WorkerPunch() {
  const { show } = useToast();
  const [type, setType] = useState('IN');
  const [workMode, setWorkMode] = useState('OFFICE');
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [locating, setLocating] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const isWfh = workMode === 'WFH';

  const captureLocation = () =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const message = 'Geolocation not supported by this browser.';
        setLocationError(message);
        return reject(new Error(message));
      }

      setLocationError('');
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const data = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracyMeters: pos.coords.accuracy
          };
          setLocation(data);
          setLocating(false);
          resolve(data);
        },
        (err) => {
          const message = err.message || 'Failed to get location';
          setLocationError(message);
          setLocating(false);
          reject(new Error(message));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });

  const handleSubmit = async () => {
    if (!photoFile) {
      show('Please capture a selfie', 'error');
      return;
    }

    setSubmitting(true);
    try {
      let currentLocation = null;
      if (!isWfh) {
        currentLocation = await captureLocation();
      } else {
        setLocation(null);
        setLocationError('');
      }
      const formData = new FormData();
      formData.append('type', type);
      formData.append('workMode', workMode);
      if (currentLocation) {
        formData.append('lat', currentLocation.lat);
        formData.append('lng', currentLocation.lng);
        formData.append('accuracyMeters', currentLocation.accuracyMeters);
      }
      formData.append('photo', photoFile);

      const res = await api.post('/attendance/punch', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult(res.data.attendance);
      show(`Punch ${res.data.attendance.status}`, 'success');
    } catch (err) {
      show(err.response?.data?.message || err.message || 'Punch failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="section">
      <div className="card space-y-4">
        <div className="section-header">
          <div>
            <h1 className="section-title">Worker Punch</h1>
            <p className="section-subtitle">
              {isWfh
                ? 'Work from home punches only require a selfie.'
                : 'Punch will capture your current GPS location and selfie automatically.'}
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-[200px_260px_1fr] md:items-end">
          <div className="min-w-[180px]">
            <label className="label">Type</label>
            <select
              className="input"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="IN">IN</option>
              <option value="OUT">OUT</option>
            </select>
          </div>
          <div>
            <label className="label">Work Mode</label>
            <div className="segmented">
              <button
                className={`segmented-btn ${!isWfh ? 'is-active' : ''}`}
                type="button"
                onClick={() => {
                  setWorkMode('OFFICE');
                  setLocationError('');
                }}
              >
                Office
              </button>
              <button
                className={`segmented-btn ${isWfh ? 'is-active' : ''}`}
                type="button"
                onClick={() => {
                  setWorkMode('WFH');
                  setLocation(null);
                  setLocationError('');
                }}
              >
                Work from home
              </button>
            </div>
          </div>
          <button
            className="btn-primary"
            type="button"
            onClick={handleSubmit}
            disabled={submitting || locating}
          >
            {locating ? 'Getting Location...' : submitting ? 'Submitting...' : 'Submit Punch'}
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {isWfh ? (
          <div className="card space-y-2">
            <h3 className="text-lg font-semibold">Location</h3>
            <p className="text-sm text-slate-600">
              Work from home selected. Location capture is skipped.
            </p>
          </div>
        ) : (
          <LocationCapture location={location} error={locationError} showButton={false} />
        )}
        <CameraCapture onCapture={setPhotoFile} />
      </div>

      {result && (
        <div className="card space-y-2">
          <h3 className="text-lg font-semibold">Latest Punch Result</h3>
          <div className="text-sm text-slate-700">
            <div>
              Mode: {result.workMode === 'WFH' ? 'Work from home' : 'Office'}
            </div>
            <div>Status: {result.status}</div>
            <div>
              Distance:{' '}
              {result.workMode === 'WFH' || result.distanceMeters == null
                ? 'N/A'
                : `${result.distanceMeters} m`}
            </div>
            <div>Reason: {result.reason || 'None'}</div>
          </div>
        </div>
      )}
    </div>
  );
}
