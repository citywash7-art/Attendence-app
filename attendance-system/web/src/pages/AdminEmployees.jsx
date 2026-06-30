import React, { useEffect, useMemo, useState } from 'react';
import api from '../api/client';
import { useToast } from '../components/Toast';

export default function AdminEmployees() {
  const { show } = useToast();
  const [users, setUsers] = useState([]);
  const [offices, setOffices] = useState([]);
  const [roles, setRoles] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    employeeCode: '',
    password: '',
    role: 'worker',
    officeId: '',
    active: true
  });

  const [roleForm, setRoleForm] = useState({ name: '' });

  const load = () => {
    api
      .get('/admin/users')
      .then((res) => setUsers(res.data.users || []))
      .catch((err) =>
        show(err.response?.data?.message || 'Failed to load users', 'error')
      );

    api
      .get('/admin/offices')
      .then((res) => setOffices(res.data.offices || []))
      .catch(() => {});

    api
      .get('/admin/roles')
      .then((res) => setRoles(res.data.roles || []))
      .catch(() => setRoles([]));
  };

  useEffect(() => {
    load();
  }, []);

  const rolesForSelect = useMemo(() => {
    const activeRoles = roles
      .filter((role) => role.active !== false)
      .map((role) => role.name);

    const list = activeRoles.length ? [...activeRoles] : ['admin', 'worker'];

    if (form.role && !list.includes(form.role)) {
      list.push(form.role);
    }

    return list;
  }, [roles, form.role]);

  const resetForm = () => {
    setForm({
      name: '',
      email: '',
      employeeCode: '',
      password: '',
      role: 'worker',
      officeId: '',
      active: true
    });
    setEditingId(null);
    setShowPassword(false);
  };

  const resetRoleForm = () => {
    setRoleForm({ name: '' });
    setEditingRoleId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingId) {
        const payload = {
          name: form.name,
          email: form.email,
          employeeCode: form.employeeCode,
          role: form.role,
          officeId: form.officeId || null,
          active: form.active
        };
        if (form.password) payload.password = form.password;
        await api.patch(`/admin/users/${editingId}`, payload);
        show('User updated', 'success');
      } else {
        const payload = {
          name: form.name,
          email: form.email,
          employeeCode: form.employeeCode,
          password: form.password,
          role: form.role,
          officeId: form.officeId || null,
          active: form.active
        };
        await api.post('/admin/users', payload);
        show('User created', 'success');
      }
      resetForm();
      load();
    } catch (err) {
      show(err.response?.data?.message || 'Save failed', 'error');
    }
  };

  const handleRoleSubmit = async (e) => {
    e.preventDefault();
    const name = roleForm.name.trim().toLowerCase();
    if (!name) {
      show('Role name is required', 'error');
      return;
    }

    try {
      if (editingRoleId) {
        await api.patch(`/admin/roles/${editingRoleId}`, { name });
        show('Role updated', 'success');
      } else {
        await api.post('/admin/roles', { name });
        show('Role added', 'success');
      }
      resetRoleForm();
      load();
    } catch (err) {
      show(err.response?.data?.message || 'Role save failed', 'error');
    }
  };

  const handleRoleDelete = async (roleId) => {
    try {
      await api.delete(`/admin/roles/${roleId}`);
      show('Role deleted', 'success');
      load();
    } catch (err) {
      show(err.response?.data?.message || 'Role delete failed', 'error');
    }
  };

  return (
    <div className="section">
      <div className="card space-y-4">
        <div className="section-header">
          <div>
            <h1 className="section-title">Employees</h1>
            <p className="section-subtitle">
              Create employee profiles, assign offices, and control access.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="form-grid">
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
            <label className="label">Email</label>
            <input
              className="input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">Employee Code</label>
            <input
              className="input"
              value={form.employeeCode}
              onChange={(e) => setForm({ ...form, employeeCode: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">Password</label>
            <div className="relative">
              <input
                className="input pr-16"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required={!editingId}
                placeholder={editingId ? 'Leave blank to keep current' : ''}
              />
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-600 hover:bg-black/5"
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
                    <circle cx="12" cy="12" r="3" />
                    <path d="M4 4l16 16" />
                  </svg>
                ) : (
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {editingId && (
              <p className="mt-1 text-xs text-slate-500">
                Leave blank to keep the existing password.
              </p>
            )}
          </div>
          <div>
            <label className="label">Role</label>
            <select
              className="input"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              {rolesForSelect.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            <a
              href="#role-management"
              className="btn-ghost mt-2 w-full text-center"
            >
              Manage Roles
            </a>
            <p className="mt-1 text-xs text-slate-500">
              Admin has full access. All other roles are treated as worker access.
            </p>
          </div>
          <div>
            <label className="label">Office</label>
            <select
              className="input"
              value={form.officeId}
              onChange={(e) => setForm({ ...form, officeId: e.target.value })}
            >
              <option value="">None</option>
              {offices.map((office) => (
                <option key={office._id} value={office._id}>
                  {office.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Active</label>
            <select
              className="input"
              value={form.active ? 'true' : 'false'}
              onChange={(e) =>
                setForm({ ...form, active: e.target.value === 'true' })
              }
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          <div className="form-actions md:col-span-3">
            <button className="btn-primary" type="submit">
              {editingId ? 'Update User' : 'Create User'}
            </button>
            <button className="btn-ghost" type="button" onClick={resetForm}>
              Clear
            </button>
          </div>
        </form>
      </div>

      <div className="card space-y-4" id="role-management">
        <div className="section-header">
          <div>
            <h2 className="section-title">Role Management</h2>
            <p className="section-subtitle">
              Add, edit, or remove roles used in the employee dropdown.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleRoleSubmit}
          className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]"
        >
          <input
            className="input"
            placeholder="Enter role name"
            value={roleForm.name}
            onChange={(e) => setRoleForm({ name: e.target.value })}
          />
          <div className="form-actions">
            <button className="btn-primary" type="submit">
              {editingRoleId ? 'Update Role' : 'Add Role'}
            </button>
            {editingRoleId && (
              <button className="btn-ghost" type="button" onClick={resetRoleForm}>
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => (
                <tr key={role._id}>
                  <td data-label="Role">{role.name}</td>
                  <td data-label="Status">
                    {role.active === false ? 'Inactive' : 'Active'}
                  </td>
                  <td className="space-x-2" data-label="Actions">
                    <button
                      className="btn-ghost"
                      onClick={() => {
                        setEditingRoleId(role._id);
                        setRoleForm({ name: role.name });
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-ghost"
                      onClick={() => handleRoleDelete(role._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {!roles.length && (
                <tr>
                  <td colSpan="3" className="py-6 text-center text-slate-500">
                    No roles found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card space-y-3">
        <div className="section-header">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Employee List</h2>
            <p className="section-subtitle">Edit existing users and assignments.</p>
          </div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Code</th>
                <th>Role</th>
                <th>Office</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id}>
                  <td data-label="Name">{user.name}</td>
                  <td data-label="Email">{user.email}</td>
                  <td data-label="Code">{user.employeeCode}</td>
                  <td data-label="Role">{user.role}</td>
                  <td data-label="Office">{user.officeId?.name || 'N/A'}</td>
                  <td data-label="Active">{user.active ? 'Yes' : 'No'}</td>
                  <td data-label="Actions">
                    <button
                      className="btn-ghost"
                      onClick={() => {
                        setEditingId(user._id);
                        setShowPassword(false);
                        setForm({
                          name: user.name,
                          email: user.email,
                          employeeCode: user.employeeCode,
                          password: '',
                          role: user.role,
                          officeId: user.officeId?._id || '',
                          active: user.active
                        });
                      }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
              {!users.length && (
                <tr>
                  <td colSpan="7" className="py-6 text-center text-slate-500">
                    No employees found.
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
