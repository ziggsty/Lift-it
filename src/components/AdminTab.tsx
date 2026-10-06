import React, { useState, useEffect } from 'react';
import { Shield, Users, Bell, Database, AlertOctagon, Flag, Check, Trash2, Plus, RefreshCw, Cpu, Activity, AlertTriangle } from 'lucide-react';
import { UserRole, Announcement, FoodItem } from '../types';
import { api } from '../services/api';

interface AdminTabProps {
  currentRole: UserRole;
  onSwitchToAdmin: () => void;
  onRefreshAnnouncements: () => void;
}

export const AdminTab: React.FC<AdminTabProps> = ({
  currentRole,
  onSwitchToAdmin,
  onRefreshAnnouncements,
}) => {
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<'users' | 'broadcast' | 'food' | 'stats'>('users');

  // Announcement Form
  const [ancTitle, setAncTitle] = useState('');
  const [ancMessage, setAncMessage] = useState('');
  const [ancPriority, setAncPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');

  // New Food Item Form
  const [foodName, setFoodName] = useState('');
  const [foodCategory, setFoodCategory] = useState<'protein' | 'carbs' | 'fats' | 'dairy' | 'vegetable' | 'fruit' | 'beverage' | 'snack'>('protein');
  const [servingSize, setServingSize] = useState('100g');
  const [calories, setCalories] = useState(150);
  const [protein, setProtein] = useState(25);
  const [carbs, setCarbs] = useState(0);
  const [fats, setFats] = useState(4);
  const [fiber, setFiber] = useState(0);
  const [publicNotes, setPublicNotes] = useState('');

  const [notificationMsg, setNotificationMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchAdminData = async () => {
    setLoading(true);
    setNotificationMsg(null);

    // Fetch Users
    const usersRes = await api.request('GET', '/api/admin/users');
    if (usersRes.status === 200 && usersRes.response.success) {
      setUsers(usersRes.response.data || []);
    } else {
      setUsers([]);
    }

    // Fetch Stats
    const statsRes = await api.request('GET', '/api/admin/stats');
    if (statsRes.status === 200 && statsRes.response.success) {
      setStats(statsRes.response.data || null);
    }

    // Fetch Announcements
    const ancRes = await api.request('GET', '/api/notifications');
    if (ancRes.status === 200 && ancRes.response.success) {
      setAnnouncements(ancRes.response.data || []);
    }

    // Fetch Global Food Items
    const foodRes = await api.request('GET', '/api/food');
    if (foodRes.status === 200 && foodRes.response.success) {
      setFoodItems(foodRes.response.data || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (currentRole === 'admin') {
      fetchAdminData();
    }
  }, [currentRole]);

  // Handle Flag/Unflag user
  const handleToggleFlag = async (userId: string, currentStatus: boolean) => {
    const reason = !currentStatus ? prompt('Enter reason for suspension/flagging:', 'Terms of service violation') : '';
    if (!currentStatus && reason === null) return;

    const { response, status } = await api.request('PATCH', `/api/admin/users/${userId}/flag`, {
      isFlagged: !currentStatus,
      reason: reason || 'Flagged by administrator',
    });

    if (status === 200 && response.success) {
      setNotificationMsg({ text: response.message || 'User status updated successfully.', type: 'success' });
      fetchAdminData();
    } else {
      setNotificationMsg({ text: response.error || 'Failed to update user flag status', type: 'error' });
    }
  };

  // Handle Change Role
  const handleChangeRole = async (userId: string, newRole: UserRole) => {
    const { response, status } = await api.request('PATCH', `/api/admin/users/${userId}/role`, {
      role: newRole,
    });

    if (status === 200 && response.success) {
      setNotificationMsg({ text: `Updated user role to "${newRole}".`, type: 'success' });
      fetchAdminData();
    } else {
      setNotificationMsg({ text: response.error || 'Failed to change user role', type: 'error' });
    }
  };

  // Handle Delete User
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to permanently delete this user account and all their logs?')) return;

    const { response, status } = await api.request('DELETE', `/api/admin/users/${userId}`);
    if (status === 200 && response.success) {
      setNotificationMsg({ text: response.message || 'User account removed.', type: 'success' });
      fetchAdminData();
    } else {
      setNotificationMsg({ text: response.error || 'Failed to delete user', type: 'error' });
    }
  };

  // Handle Broadcast Announcement
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    const { response, status } = await api.request('POST', '/api/admin/announcements', {
      title: ancTitle,
      message: ancMessage,
      priority: ancPriority,
    });

    if (status === 201 && response.success) {
      setNotificationMsg({ text: 'Announcement broadcasted to all users successfully!', type: 'success' });
      setAncTitle('');
      setAncMessage('');
      fetchAdminData();
      onRefreshAnnouncements();
    } else {
      setNotificationMsg({ text: response.error || 'Failed to create announcement', type: 'error' });
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    const { response, status } = await api.request('DELETE', `/api/admin/announcements/${id}`);
    if (status === 200 && response.success) {
      setNotificationMsg({ text: 'Announcement removed from broadcast stream', type: 'success' });
      fetchAdminData();
      onRefreshAnnouncements();
    }
  };

  // Handle Add Food Item
  const handleAddFoodItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: foodName,
      category: foodCategory,
      servingSize,
      calories: Number(calories),
      proteinGrams: Number(protein),
      carbsGrams: Number(carbs),
      fatsGrams: Number(fats),
      fiberGrams: Number(fiber),
      publicNotes,
    };

    const { response, status } = await api.request('POST', '/api/admin/food', payload);
    if (status === 201 && response.success) {
      setNotificationMsg({ text: `Food item "${foodName}" added to global database!`, type: 'success' });
      setFoodName('');
      setPublicNotes('');
      fetchAdminData();
    } else {
      setNotificationMsg({ text: response.error || 'Failed to add food item', type: 'error' });
    }
  };

  const handleDeleteFood = async (id: string) => {
    const { response, status } = await api.request('DELETE', `/api/admin/food/${id}`);
    if (status === 200 && response.success) {
      setNotificationMsg({ text: 'Food item deleted from database', type: 'success' });
      fetchAdminData();
    }
  };

  // FORBIDDEN DEMONSTRATION SCREEN IF NOT ADMIN
  if (currentRole !== 'admin') {
    return (
      <div className="p-8 sm:p-12 rounded-3xl bg-zinc-900 border border-zinc-800 text-center max-w-2xl mx-auto shadow-2xl animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8" />
        </div>

        <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded bg-rose-500/20 text-rose-400 border border-rose-500/40">
          HTTP 403 FORBIDDEN • RBAC ACCESS RESTRICTED
        </span>

        <h2 className="text-2xl font-black text-white mt-4">
          Admin Privilege Required
        </h2>

        <p className="text-xs text-zinc-400 mt-2 leading-relaxed max-w-lg mx-auto">
          The <code className="text-orange-400 bg-zinc-950 px-1.5 py-0.5 rounded">/api/admin/*</code> routes are protected by the <code className="text-zinc-200">verifyAdmin</code> middleware. Your current identity has the <strong className="text-white uppercase">[{currentRole}]</strong> role.
        </p>

        <div className="mt-8 p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-left text-xs font-mono text-zinc-300">
          <div className="text-zinc-500 mb-1">// Real Express RBAC Middleware Execution</div>
          <div className="text-rose-400">403 Forbidden: Admin privilege required to perform this action.</div>
          <div className="text-zinc-500 text-[11px] mt-1">code: "INSUFFICIENT_PERMISSIONS", currentRole: "{currentRole}"</div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onSwitchToAdmin}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-orange-600 text-white font-bold text-xs shadow-lg shadow-rose-600/25 hover:opacity-95 transition"
          >
            Authenticate as Admin (Marcus Vance)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Admin Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30 mb-2">
            <Shield className="w-3.5 h-3.5" />
            ADMINISTRATIVE CONTROL PANEL • ROLE: ADMIN
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            System Administration &amp; Governance
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            RBAC User management, global push broadcasting, and master food database controls.
          </p>
        </div>

        <button
          onClick={fetchAdminData}
          className="px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition flex items-center gap-2 self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Registry
        </button>
      </div>

      {notificationMsg && (
        <div
          className={`p-3 rounded-xl text-xs border ${
            notificationMsg.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
          }`}
        >
          {notificationMsg.text}
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
            <span className="text-[10px] uppercase font-bold text-zinc-500 block">Total Users</span>
            <div className="text-2xl font-black text-white mt-1">{stats.usersCount.total}</div>
            <div className="text-[10px] text-zinc-400 mt-1">
              {stats.usersCount.registered} registered • {stats.usersCount.admins} admin(s)
            </div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
            <span className="text-[10px] uppercase font-bold text-orange-400 block">Total Volume Lifted</span>
            <div className="text-2xl font-black text-orange-400 mt-1">
              {stats.telemetry.totalCumulativeVolumeKg} kg
            </div>
            <div className="text-[10px] text-zinc-400 mt-1">Across all athlete workout logs</div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
            <span className="text-[10px] uppercase font-bold text-emerald-400 block">Food DB Items</span>
            <div className="text-2xl font-black text-emerald-400 mt-1">
              {stats.telemetry.globalFoodDatabaseItems}
            </div>
            <div className="text-[10px] text-zinc-400 mt-1">Verified global nutritional items</div>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
            <span className="text-[10px] uppercase font-bold text-rose-400 block">Server Uptime</span>
            <div className="text-2xl font-black text-white mt-1">
              {stats.systemHealth.uptimeSeconds}s
            </div>
            <div className="text-[10px] text-zinc-400 mt-1">
              Memory: {stats.systemHealth.memoryUsageMb} MB • Node {stats.systemHealth.nodeVersion}
            </div>
          </div>
        </div>
      )}

      {/* Sub-tabs for Admin */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
        <button
          onClick={() => setActiveSection('users')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
            activeSection === 'users'
              ? 'bg-rose-500 text-white shadow'
              : 'text-zinc-400 hover:text-white bg-zinc-900'
          }`}
        >
          User Accounts Management ({users.length})
        </button>
        <button
          onClick={() => setActiveSection('broadcast')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
            activeSection === 'broadcast'
              ? 'bg-rose-500 text-white shadow'
              : 'text-zinc-400 hover:text-white bg-zinc-900'
          }`}
        >
          Push Broadcasts &amp; Alerts ({announcements.length})
        </button>
        <button
          onClick={() => setActiveSection('food')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
            activeSection === 'food'
              ? 'bg-rose-500 text-white shadow'
              : 'text-zinc-400 hover:text-white bg-zinc-900'
          }`}
        >
          Master Food Database ({foodItems.length})
        </button>
      </div>

      {/* SECTION 1: USER ACCOUNTS */}
      {activeSection === 'users' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-rose-400" />
                User Account Governance
              </h3>
              <p className="text-xs text-zinc-400">View registered athletes, suspend/flag accounts, or assign roles</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[11px] text-zinc-400 uppercase bg-zinc-950 border-b border-zinc-800">
                <tr>
                  <th className="py-2.5 px-3">User</th>
                  <th className="py-2.5 px-3">Email</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Workouts</th>
                  <th className="py-2.5 px-3">Total Vol.</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-800/30">
                    <td className="py-3 px-3 font-semibold text-white">
                      {u.name}
                      <span className="block text-[10px] text-zinc-500 font-mono">ID: {u.id}</span>
                    </td>
                    <td className="py-3 px-3 text-zinc-300">{u.email}</td>
                    <td className="py-3 px-3">
                      <select
                        value={u.role}
                        onChange={(e) => handleChangeRole(u.id, e.target.value as UserRole)}
                        className={`text-[11px] font-bold px-2 py-1 rounded bg-zinc-950 border ${
                          u.role === 'admin'
                            ? 'text-rose-400 border-rose-500/40'
                            : 'text-emerald-400 border-emerald-500/40'
                        }`}
                      >
                        <option value="registered">registered</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td className="py-3 px-3">
                      {u.isFlagged ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/40">
                          <Flag className="w-3 h-3" /> Flagged / Suspended
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-zinc-300">{u.stats?.workoutsLogged || 0}</td>
                    <td className="py-3 px-3 font-bold text-orange-400">
                      {u.stats?.totalVolumeKg || 0} kg
                    </td>
                    <td className="py-3 px-3 text-right space-x-2">
                      <button
                        onClick={() => handleToggleFlag(u.id, u.isFlagged)}
                        className={`px-2 py-1 rounded text-[11px] font-semibold border transition ${
                          u.isFlagged
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800 hover:bg-emerald-900'
                            : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:text-rose-300 hover:border-rose-700'
                        }`}
                      >
                        {u.isFlagged ? 'Unflag Account' : 'Flag / Suspend'}
                      </button>

                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="p-1 rounded text-zinc-500 hover:text-rose-400 transition"
                        title="Delete User"
                      >
                        <Trash2 className="w-3.5 h-3.5 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 2: BROADCAST SYSTEM UPDATES */}
      {activeSection === 'broadcast' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Creator Form */}
          <div className="lg:col-span-5 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Bell className="w-4 h-4 text-orange-400" />
              Broadcast System Update
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              Pushes live alerts to the notifications drawer for all connected athletes
            </p>

            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Announcement Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Server Maintenance or New Challenge Mode"
                  value={ancTitle}
                  onChange={(e) => setAncTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">Priority Classification</label>
                <select
                  value={ancPriority}
                  onChange={(e: any) => setAncPriority(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="low">Low (General FYI)</option>
                  <option value="normal">Normal (Product update)</option>
                  <option value="high">High (Feature release)</option>
                  <option value="urgent">Urgent (Platform advisory)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">Message Body</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Type broadcast message details..."
                  value={ancMessage}
                  onChange={(e) => setAncMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-rose-500 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-orange-600 text-white font-bold text-sm shadow-lg shadow-rose-600/25 transition"
              >
                Broadcast to Registered Users
              </button>
            </form>
          </div>

          {/* Active Broadcasts Stream */}
          <div className="lg:col-span-7 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-base font-bold text-white mb-4">Active Broadcast Stream</h3>
            <div className="space-y-3">
              {announcements.map((anc) => (
                <div
                  key={anc._id || anc.id}
                  className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-start justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-white">{anc.title}</span>
                      <span
                        className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          anc.priority === 'urgent'
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-orange-500/20 text-orange-400'
                        }`}
                      >
                        {anc.priority}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed">{anc.message}</p>
                    <div className="mt-2 text-[10px] text-zinc-500">
                      Dispatched by {anc.createdByEmail} • {new Date(anc.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteAnnouncement(anc.id || anc._id)}
                    className="p-1.5 rounded text-zinc-500 hover:text-rose-400 transition"
                    title="Delete announcement"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: MASTER FOOD DATABASE MANAGEMENT */}
      {activeSection === 'food' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Add Food Form */}
          <div className="lg:col-span-5 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-400" />
              Register Global Food Item
            </h3>
            <p className="text-xs text-zinc-400 mb-4">
              Add verified nutritional items available to all users across the platform
            </p>

            <form onSubmit={handleAddFoodItem} className="space-y-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Food Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grass-Fed Whey Concentrate 80%"
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Category</label>
                  <select
                    value={foodCategory}
                    onChange={(e: any) => setFoodCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="protein">Protein</option>
                    <option value="carbs">Carbs</option>
                    <option value="fats">Fats</option>
                    <option value="dairy">Dairy</option>
                    <option value="vegetable">Vegetable</option>
                    <option value="fruit">Fruit</option>
                    <option value="snack">Snack</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Serving Size</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 100g or 1 scoop"
                    value={servingSize}
                    onChange={(e) => setServingSize(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Calories (kcal)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={calories}
                    onChange={(e) => setCalories(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-emerald-400 mb-1">Protein (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    value={protein}
                    onChange={(e) => setProtein(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-amber-400 mb-1">Carbs (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={carbs}
                    onChange={(e) => setCarbs(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-indigo-400 mb-1">Fats (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={fats}
                    onChange={(e) => setFats(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-cyan-400 mb-1">Fiber (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={fiber}
                    onChange={(e) => setFiber(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">Public Notes / Label</label>
                <input
                  type="text"
                  placeholder="e.g. High bioavailable protein source"
                  value={publicNotes}
                  onChange={(e) => setPublicNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 transition"
              >
                Add Food Item to Global Database
              </button>
            </form>
          </div>

          {/* Database Items Table */}
          <div className="lg:col-span-7 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-base font-bold text-white mb-4">Existing Food Items in Database</h3>
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] text-zinc-400 uppercase bg-zinc-950 border-b border-zinc-800 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">Item</th>
                    <th className="py-2.5 px-3">Calories</th>
                    <th className="py-2.5 px-3">P / C / F</th>
                    <th className="py-2.5 px-3 text-right">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {foodItems.map((food) => (
                    <tr key={food.id || food._id} className="hover:bg-zinc-800/30">
                      <td className="py-2.5 px-3 font-semibold text-white">
                        {food.name}
                        <span className="block text-[10px] text-zinc-500">{food.servingSize}</span>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-orange-400">{food.calories} kcal</td>
                      <td className="py-2.5 px-3 text-zinc-300">
                        {food.proteinGrams}g / {food.carbsGrams}g / {food.fatsGrams}g
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleDeleteFood(food.id || food._id)}
                          className="p-1 rounded text-zinc-500 hover:text-rose-400 transition"
                          title="Delete food item"
                        >
                          <Trash2 className="w-3.5 h-3.5 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
