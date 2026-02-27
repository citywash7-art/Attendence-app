import React, { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import api from './api/client';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { ToastProvider } from './components/Toast';
import Login from './pages/Login';
import WorkerPunch from './pages/WorkerPunch';
import WorkerHistory from './pages/WorkerHistory';
import AdminDashboard from './pages/AdminDashboard';
import AdminOffice from './pages/AdminOffice';
import AdminEmployees from './pages/AdminEmployees';
import AdminReports from './pages/AdminReports';

export default function App() {
  const [user, setUser] = useState(() => {
    const cached = localStorage.getItem('user');
    return cached ? JSON.parse(cached) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    api
      .get('/auth/me')
      .then((res) => {
        setUser(res.data.user);
        localStorage.setItem('user', JSON.stringify(res.data.user));
      })
      .catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const homeTarget = user
    ? user.role === 'admin'
      ? '/admin/dashboard'
      : '/worker/punch'
    : '/login';

  return (
    <ToastProvider>
      <Navbar user={user} onLogout={handleLogout} />
      <main className="mx-auto max-w-6xl px-4 py-6 2xl:max-w-7xl 3xl:max-w-[96rem] 5xl:max-w-[120rem]">
        <Routes>
          <Route path="/" element={<Navigate to={homeTarget} replace />} />
          <Route path="/login" element={<Login onLogin={setUser} />} />

          <Route
            path="/worker/punch"
            element={
              <ProtectedRoute user={user} loading={loading} role="worker">
                <WorkerPunch />
              </ProtectedRoute>
            }
          />
          <Route
            path="/worker/history"
            element={
              <ProtectedRoute user={user} loading={loading} role="worker">
                <WorkerHistory />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute user={user} loading={loading} role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/offices"
            element={
              <ProtectedRoute user={user} loading={loading} role="admin">
                <AdminOffice />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/employees"
            element={
              <ProtectedRoute user={user} loading={loading} role="admin">
                <AdminEmployees />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute user={user} loading={loading} role="admin">
                <AdminReports />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to={homeTarget} replace />} />
        </Routes>
      </main>
    </ToastProvider>
  );
}
