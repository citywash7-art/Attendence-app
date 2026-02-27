import React, { useCallback, useEffect, useRef, useState } from 'react';

export default function CameraCapture({ onCapture }) {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [fallback, setFallback] = useState(false);
  const [error, setError] = useState('');

  const stopStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
    return () => stopStream();
  }, [stream, stopStream]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const startCamera = async () => {
    setError('');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }
      });
      setStream(mediaStream);
      setFallback(false);
    } catch (err) {
      setFallback(true);
      setError('Camera unavailable, please upload a selfie instead.');
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `selfie-${Date.now()}.jpg`, {
          type: 'image/jpeg'
        });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        onCapture(file);
      },
      'image/jpeg',
      0.9
    );

    stopStream();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    onCapture(file);
  };

  const reset = () => {
    setPreviewUrl('');
    onCapture(null);
  };

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Selfie Capture</h3>
        {previewUrl && (
          <button className="btn-ghost" type="button" onClick={reset}>
            Retake
          </button>
        )}
      </div>

      {!previewUrl && !fallback && (
        <div className="space-y-3">
          <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg bg-black/5" />
          <div className="flex gap-2">
            <button className="btn-primary" type="button" onClick={startCamera}>
              Start
            </button>
            <button
              className="btn-ghost"
              type="button"
              onClick={capturePhoto}
              disabled={!stream}
            >
              Capture
            </button>
          </div>
        </div>
      )}

      {!previewUrl && fallback && (
        <div className="space-y-2">
          <input
            type="file"
            accept="image/*"
            capture="user"
            onChange={handleFileChange}
            className="input"
          />
        </div>
      )}

      {previewUrl && (
        <img src={previewUrl} alt="Selfie preview" className="w-full rounded-lg" />
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      <p className="text-xs text-slate-500">Camera works on HTTPS or localhost.</p>
    </div>
  );
}
