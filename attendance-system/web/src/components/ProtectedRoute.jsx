import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ user, role, loading, children }) {
  const token = localStorage.getItem('token');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-500">
        Loading...
      </div>
    );
  }

  if (!token) return <Navigate to="/login" replace />;
  if (role) {
    const userRole = (user?.role || '').toLowerCase();
    if (role === 'admin' && userRole !== 'admin') return <Navigate to="/login" replace />;
    if (role === 'worker' && userRole === 'admin') return <Navigate to="/login" replace />;
    if (role !== 'admin' && role !== 'worker' && userRole !== role) {
      return <Navigate to="/login" replace />;
    }
  }

  return children;
}
