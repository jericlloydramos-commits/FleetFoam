'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Profile, UserRole } from '@/lib/types';
import { mockDb, supabase, isMockMode } from '@/lib/supabase';
import {
  X,
  Users,
  UserCheck,
  UserX,
  Trash2,
  AlertTriangle,
  UserPlus,
  Shield,
  Truck,
  Calendar,
  CheckCircle2,
  Phone,
  Mail,
  Search,
  RefreshCw,
  Database,
} from 'lucide-react';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUsersChanged: () => void;
}

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
  onUsersChanged,
}) => {
  const [profiles, setProfiles] = useState<Profile[]>(mockDb.getProfiles());
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'CREW' | 'CUSTOMER' | 'OPERATIONS'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // New user form state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('CREW');

  // Deletion Dialog State
  const [deletingUser, setDeletingUser] = useState<Profile | null>(null);
  const [reassignTargetId, setReassignTargetId] = useState<string>('');
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const refreshList = useCallback(async () => {
    setIsLoading(true);
    try {
      // Sync live with Supabase cloud database
      const syncedProfiles = await mockDb.syncFromSupabase();
      setProfiles(syncedProfiles);
    } catch (err) {
      console.warn('Sync failed, falling back to local store:', err);
      setProfiles(mockDb.getProfiles());
    } finally {
      setIsLoading(false);
      onUsersChanged();
    }
  }, [onUsersChanged]);

  // Sync on modal open
  useEffect(() => {
    if (isOpen) {
      refreshList();
    }
  }, [isOpen, refreshList]);

  if (!isOpen) return null;

  const handleToggleStatus = (profileId: string) => {
    mockDb.toggleUserStatus(profileId);
    setProfiles(mockDb.getProfiles());
    onUsersChanged();
    showToast('User status updated successfully.');
  };

  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    setIsDeleting(true);

    try {
      const result = await mockDb.deleteProfileAsync(deletingUser.id, reassignTargetId || undefined);
      if (result.success) {
        showToast(
          `Deleted ${deletingUser.name} successfully from Supabase & roster.`
        );
        setDeletingUser(null);
        setReassignTargetId('');
        await refreshList();
      } else {
        showToast('Could not delete user. Please try again.');
      }
    } catch (err: any) {
      console.error('Deletion error:', err);
      showToast(`Delete failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    try {
      setIsLoading(true);
      const res = await mockDb.createProfileAsync({
        name: newName.trim(),
        email: newEmail.trim().toLowerCase(),
        phone: newPhone.trim() || '+63 917 000 0000',
        role: newRole,
        status: 'ACTIVE',
      });

      setNewName('');
      setNewEmail('');
      setNewPhone('');
      setShowAddForm(false);
      await refreshList();

      if (res.error) {
        showToast(`User saved locally (Supabase note: ${res.error})`);
      } else {
        showToast(`Added ${newName.trim()} (${newRole}) to Supabase & system.`);
      }
    } catch (err: any) {
      console.error('Create user error:', err);
      showToast(`Creation error: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setActionSuccessMessage(msg);
    setTimeout(() => setActionSuccessMessage(null), 3500);
  };

  const filteredProfiles = profiles.filter((p) => {
    const matchesRole = roleFilter === 'ALL' || p.role === roleFilter;
    const query = searchQuery.toLowerCase();
    const matchesQuery =
      !query ||
      p.name.toLowerCase().includes(query) ||
      p.email.toLowerCase().includes(query) ||
      (p.phone && p.phone.includes(query));
    return matchesRole && matchesQuery;
  });

  const activeCrews = profiles.filter(
    (p) => p.role === 'CREW' && p.id !== deletingUser?.id && p.status !== 'INACTIVE'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
              <Users size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900">
                  Fleet Roster &amp; User Control
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-900 text-white">
                  AUTH-04
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Supabase Live
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Manage accounts, enforce role boundaries, deactivate personnel, or delete crew/customers directly in Supabase.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={refreshList}
              disabled={isLoading}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors disabled:opacity-50"
              title="Sync from Supabase"
            >
              <RefreshCw size={15} className={isLoading ? 'animate-spin text-sky-600' : ''} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Toast Notification */}
        {actionSuccessMessage && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 flex items-center gap-2 text-xs font-bold text-emerald-800 animate-in slide-in-from-top">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>{actionSuccessMessage}</span>
          </div>
        )}

        {/* Filter & Action Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search name, email, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium focus:outline-none focus:border-sky-400"
              />
            </div>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              {(['ALL', 'CREW', 'CUSTOMER', 'OPERATIONS'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRoleFilter(r)}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    roleFilter === r
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {r === 'ALL' ? 'All' : r === 'CREW' ? 'Crew' : r === 'CUSTOMER' ? 'Customers' : 'Admins'}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <UserPlus size={15} />
            <span>{showAddForm ? 'Cancel Form' : 'Add New Member'}</span>
          </button>
        </div>

        {/* Quick Add Form Dropdown */}
        {showAddForm && (
          <form
            onSubmit={handleAddUser}
            className="p-4 bg-sky-50/50 border-b border-sky-100 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs"
          >
            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Juan Dela Cruz"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="e.g. juan@fleetfoam.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                Role &amp; Clearance
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-xs"
              >
                <option value="CREW">CREW (Field Technician)</option>
                <option value="CUSTOMER">CUSTOMER (Client)</option>
                <option value="OPERATIONS">OPERATIONS (Admin)</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">
                  PH Mobile Phone
                </label>
                <input
                  type="text"
                  placeholder="+63 917 000 0000"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-xs"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs h-[38px] shadow-sm"
              >
                Save
              </button>
            </div>
          </form>
        )}

        {/* User Roster Table / Cards */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {filteredProfiles.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Users size={36} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm font-bold">No users match the active filter</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredProfiles.map((p) => {
                const isInactive = p.status === 'INACTIVE';
                const roleBadge =
                  p.role === 'CREW'
                    ? { label: 'Crew', bg: 'bg-amber-100 text-amber-900 border-amber-200', icon: <Truck size={12} /> }
                    : p.role === 'OPERATIONS'
                    ? { label: 'Admin', bg: 'bg-slate-900 text-white border-slate-800', icon: <Shield size={12} /> }
                    : { label: 'Customer', bg: 'bg-sky-100 text-sky-900 border-sky-200', icon: <Calendar size={12} /> };

                return (
                  <div
                    key={p.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                      isInactive
                        ? 'bg-slate-50 border-slate-200 opacity-60'
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                    }`}
                  >
                    {/* User Info */}
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-10 h-10 rounded-2xl font-black text-xs flex items-center justify-center shrink-0 ${
                          p.role === 'CREW'
                            ? 'bg-amber-500 text-slate-950'
                            : p.role === 'OPERATIONS'
                            ? 'bg-slate-900 text-white'
                            : 'bg-sky-600 text-white'
                        }`}
                      >
                        {p.name
                          .split(' ')
                          .map((w) => w[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-extrabold text-slate-900">{p.name}</h4>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black border ${roleBadge.bg}`}
                          >
                            {roleBadge.icon} {roleBadge.label}
                          </span>
                          {isInactive && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                              Inactive
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500 font-medium mt-0.5">
                          <span className="flex items-center gap-1">
                            <Mail size={12} /> {p.email}
                          </span>
                          {p.phone && (
                            <span className="flex items-center gap-1">
                              <Phone size={12} /> {p.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Stats & Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {p.role === 'CREW' && (
                        <div className="px-3 py-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700">
                          {p.active_jobs_count || 0} active job(s)
                        </div>
                      )}

                      {/* Deactivate / Activate Button */}
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(p.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors border ${
                          isInactive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {isInactive ? 'Reactivate' : 'Deactivate'}
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => setDeletingUser(p)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all"
                        title="Delete User"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal Layer */}
        {deletingUser && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in zoom-in-95">
            <div className="bg-white rounded-3xl border-2 border-rose-300 shadow-2xl p-6 sm:p-8 max-w-md w-full space-y-5">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
                <AlertTriangle size={24} />
              </div>

              <div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                  Confirm Deletion &bull; {deletingUser.role}
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1.5">
                  Delete {deletingUser.name}?
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {deletingUser.role === 'CREW' ? (
                    <>
                      This crew member currently has{' '}
                      <strong>{deletingUser.active_jobs_count || 0} active/assigned jobs</strong>.
                      To protect operations SLA, select another crew member to take over their route, or set them as Unassigned.
                    </>
                  ) : (
                    'Deleting this customer will remove their credentials. Booking records and vehicle service history will be safely preserved in the database (ON DELETE SET NULL).'
                  )}
                </p>
              </div>

              {/* Reassignment Selector for Crew Deletion */}
              {deletingUser.role === 'CREW' && (deletingUser.active_jobs_count || 0) > 0 && (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Reassign Active Jobs To:
                  </label>
                  <select
                    value={reassignTargetId}
                    onChange={(e) => setReassignTargetId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-xs"
                  >
                    <option value="">Leave Unassigned (Dispatcher Queue)</option>
                    {activeCrews.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.active_jobs_count || 0} jobs)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setDeletingUser(null)}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Deleting from Supabase...
                    </>
                  ) : (
                    <>
                      <Trash2 size={14} /> Confirm Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>{profiles.length} total users registered in system</span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
