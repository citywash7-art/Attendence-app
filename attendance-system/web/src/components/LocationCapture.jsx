import React, { useState } from 'react';

export default function LocationCapture({
  onChange,
  location: externalLocation,
  error: externalError,
  showButton = true
}) {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState('');
  const activeLocation = externalLocation ?? location;
  const activeError = externalError ?? error;

  const getLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported by this browser.');
      return;
    }

    setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const data = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracyMeters: pos.coords.accuracy
        };
        setLocation(data);
        onChange?.(data);
      },
      (err) => {
        setError(err.message || 'Failed to get location');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Location Capture</h3>
        {showButton && (
          <button className="btn-ghost" type="button" onClick={getLocation}>
            Get Location
          </button>
        )}
      </div>

      {activeLocation ? (
        <div className="text-sm text-slate-700">
          <div>Lat: {activeLocation.lat.toFixed(6)}</div>
          <div>Lng: {activeLocation.lng.toFixed(6)}</div>
          <div>Accuracy: {Math.round(activeLocation.accuracyMeters)} m</div>
        </div>
      ) : (
        <p className="text-sm text-slate-500">Location not captured yet.</p>
      )}

      {activeError && <p className="text-sm text-red-600">{activeError}</p>}
    </div>
  );
}
