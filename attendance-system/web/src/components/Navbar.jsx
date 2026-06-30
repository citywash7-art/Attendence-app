import React from 'react';
import { NavLink } from 'react-router-dom';

const linkClass = ({ isActive }) =>
  `text-sm font-semibold transition ${
    isActive ? 'text-teal-700' : 'text-slate-600 hover:text-slate-900'
  }`;

export default function Navbar({ user, onLogout }) {
  const adminLinks = [
    { to: '/admin/dashboard', label: 'Dashboard' },
    { to: '/admin/offices', label: 'Offices' },
    { to: '/admin/employees', label: 'Employees' },
    { to: '/admin/reports', label: 'Reports' }
  ];

  const workerLinks = [
    { to: '/worker/punch', label: 'Punch' },
    { to: '/worker/history', label: 'History' }
  ];

  const links = user?.role === 'admin' ? adminLinks : user ? workerLinks : [];

  return (
    <nav className="sticky top-0 z-40 border-b border-black/5 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between 2xl:max-w-7xl 3xl:max-w-[96rem] 5xl:max-w-[120rem]">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-teal-700 px-3 py-1 text-sm font-bold text-white">
            ATTEND
          </div>
          <span className="text-sm font-semibold text-slate-700">
            Lesat Action Attendence
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-4 md:gap-6">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className={linkClass}>
              {link.label}
            </NavLink>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {user ? (
            <>
              <span className="badge">
                {user.name} - {user.role}
              </span>
              <button className="btn-ghost" onClick={onLogout}>
                Logout
              </button>
            </>
          ) : (
            <NavLink to="/login" className={linkClass}>
              Login
            </NavLink>
          )}
        </div>
      </div>
    </nav>
  );
}
