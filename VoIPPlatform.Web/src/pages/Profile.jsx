import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { UserCircle, Mail, Phone, Calendar, Shield, Wallet, X, Lock } from 'lucide-react';
import Card from '../components/ui/Card';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user } = useAuth();
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showUpdateEmailModal, setShowUpdateEmailModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  const profileFields = [
    {
      label: 'Username',
      value: user?.username,
      icon: UserCircle,
    },
    {
      label: 'Email',
      value: user?.email,
      icon: Mail,
    },
    {
      label: 'Phone Number',
      value: user?.phoneNumber || 'Not provided',
      icon: Phone,
    },
    {
      label: 'Role',
      value: user?.role,
      icon: Shield,
    },
    {
      label: 'Account Balance',
      value: `$${(user?.balance || 0).toFixed(2)}`,
      icon: Wallet,
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Profile</h1>
        <p className="text-slate-400">Manage your account information</p>
      </div>

      {/* Profile Card */}
      <Card>
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="w-24 h-24 bg-gradient-to-br from-violet-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-900/50">
            <span className="text-4xl font-bold text-white">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>

          {/* User Info */}
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-1">
              {user?.firstName} {user?.lastName}
            </h2>
            <p className="text-slate-400 mb-4">@{user?.username}</p>

            <div className="flex items-center gap-4">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  user?.role === 'Admin'
                    ? 'bg-violet-900/30 text-violet-300'
                    : 'bg-blue-900/30 text-blue-300'
                }`}
              >
                {user?.role}
              </span>
              <span className="text-sm text-slate-400 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Joined {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Profile Details */}
      <Card title="Account Details">
        <div className="space-y-4">
          {profileFields.map((field, index) => (
            <div
              key={index}
              className="flex items-center gap-4 p-4 bg-slate-900 rounded-lg border border-slate-700"
            >
              <div className="w-10 h-10 bg-violet-900/30 rounded-lg flex items-center justify-center">
                <field.icon className="w-5 h-5 text-violet-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-400">{field.label}</p>
                <p className="text-base font-medium text-white">{field.value}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Quick Actions */}
      <Card title="Quick Actions">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setShowChangePasswordModal(true)}
            className="p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-all text-left border border-slate-600"
          >
            <Shield className="w-6 h-6 text-violet-400 mb-2" />
            <h3 className="font-semibold text-white mb-1">Change Password</h3>
            <p className="text-sm text-slate-400">Update your password</p>
          </button>

          <button
            onClick={() => setShowUpdateEmailModal(true)}
            className="p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-all text-left border border-slate-600"
          >
            <Mail className="w-6 h-6 text-blue-400 mb-2" />
            <h3 className="font-semibold text-white mb-1">Update Email</h3>
            <p className="text-sm text-slate-400">Change your email address</p>
          </button>
        </div>
      </Card>

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl shadow-2xl border border-slate-700 w-full max-w-md">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-violet-900/30 rounded-lg flex items-center justify-center">
                  <Lock className="w-5 h-5 text-violet-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Change Password</h3>
              </div>
              <button
                onClick={() => {
                  setShowChangePasswordModal(false);
                  setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
                }}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordForm.oldPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="Enter new password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-700">
              <button
                onClick={() => {
                  setShowChangePasswordModal(false);
                  setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
                }}
                className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
                    toast.error('New passwords do not match');
                    return;
                  }
                  if (passwordForm.newPassword.length < 4) {
                    toast.error('Password must be at least 4 characters');
                    return;
                  }

                  setLoading(true);
                  try {
                    await authAPI.changePassword({
                      oldPassword: passwordForm.oldPassword,
                      newPassword: passwordForm.newPassword,
                    });
                    toast.success('Password changed successfully');
                    setShowChangePasswordModal(false);
                    setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
                  } catch (error) {
                    toast.error(error.response?.data?.message || 'Failed to change password');
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading || !passwordForm.oldPassword || !passwordForm.newPassword}
                className="px-6 py-2 bg-gradient-to-r from-violet-600 to-purple-700 text-white rounded-lg hover:from-violet-700 hover:to-purple-800 transition-all shadow-lg shadow-violet-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Email Modal (Coming Soon) */}
      {showUpdateEmailModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl shadow-2xl border border-slate-700 w-full max-w-md">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Update Email</h3>
              </div>
              <button
                onClick={() => setShowUpdateEmailModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-blue-400" />
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">Coming Soon</h4>
              <p className="text-slate-400 mb-4">
                Email update functionality will be available in Phase 9.
              </p>
              <p className="text-sm text-slate-500">
                Current email: <span className="text-slate-300">{user?.email}</span>
              </p>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-700">
              <button
                onClick={() => setShowUpdateEmailModal(false)}
                className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
