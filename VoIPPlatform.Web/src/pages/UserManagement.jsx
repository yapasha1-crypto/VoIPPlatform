import { useState, useEffect } from 'react';
import { usersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Users, UserPlus, Search, Mail, Phone, Calendar, DollarSign, Activity } from 'lucide-react';
import Card from '../components/ui/Card';
import AddUserModal from '../components/modals/AddUserModal';
import toast from 'react-hot-toast';

const UserManagement = () => {
  const { user } = useAuth();
  const [subUsers, setSubUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchSubUsers();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = subUsers.filter(
        (subUser) =>
          subUser.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          subUser.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          subUser.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(subUsers);
    }
  }, [searchTerm, subUsers]);

  const fetchSubUsers = async () => {
    try {
      const response = await usersAPI.getAll();
      // Handle 204 No Content (empty response)
      if (response.status === 204 || !response.data) {
        setSubUsers([]);
        setFilteredUsers([]);
        setLoading(false);
        return;
      }
      if (response.data.success) {
        // Filter users who belong to this company (parentUserId = current user's ID)
        const companySubUsers = response.data.data.filter(
          (u) => u.parentUserId === user?.id || u.role === 'User'
        );
        setSubUsers(companySubUsers);
        setFilteredUsers(companySubUsers);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch sub-users:', error);
      toast.error('Failed to load users');
      setLoading(false);
    }
  };

  const getStatusColor = (isActive) => {
    return isActive
      ? 'bg-green-500/20 text-green-400 border-green-500/50'
      : 'bg-red-500/20 text-red-400 border-red-500/50';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
          <p className="text-slate-400">
            Managing {subUsers.length} {subUsers.length === 1 ? 'user' : 'users'} in your organization
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-700 text-white rounded-lg hover:from-violet-700 hover:to-purple-800 transition-all shadow-lg shadow-violet-900/50"
        >
          <UserPlus className="w-5 h-5" />
          <span>Add User</span>
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="hover:scale-105 transition-transform duration-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-slate-400 mb-1">Total Users</p>
              <p className="text-3xl font-bold text-white mb-1">{subUsers.length}</p>
              <p className="text-xs text-slate-500">Sub-users</p>
            </div>
            <div className="p-3 bg-blue-900/20 rounded-lg">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="hover:scale-105 transition-transform duration-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-slate-400 mb-1">Active Users</p>
              <p className="text-3xl font-bold text-white mb-1">
                {subUsers.filter((u) => u.isActive).length}
              </p>
              <p className="text-xs text-slate-500">Currently active</p>
            </div>
            <div className="p-3 bg-green-900/20 rounded-lg">
              <Activity className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </Card>

        <Card className="hover:scale-105 transition-transform duration-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-slate-400 mb-1">Total Balance</p>
              <p className="text-3xl font-bold text-white mb-1">
                ${subUsers.reduce((sum, u) => sum + (u.accountBalance || 0), 0).toFixed(2)}
              </p>
              <p className="text-xs text-slate-500">Combined</p>
            </div>
            <div className="p-3 bg-emerald-900/20 rounded-lg">
              <DollarSign className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
        </Card>

        <Card className="hover:scale-105 transition-transform duration-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-slate-400 mb-1">Verified</p>
              <p className="text-3xl font-bold text-white mb-1">
                {subUsers.filter((u) => u.isEmailVerified).length}
              </p>
              <p className="text-xs text-slate-500">Email verified</p>
            </div>
            <div className="p-3 bg-violet-900/20 rounded-lg">
              <Mail className="w-6 h-6 text-violet-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search Bar */}
      <Card>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search users by name, email, or username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          />
        </div>
      </Card>

      {/* Users Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-4 px-4 text-sm font-semibold text-slate-300">User</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-slate-300">Contact</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-slate-300">Status</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-slate-300">Balance</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-slate-300">Joined</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12">
                    <Users className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                    <p className="text-slate-400">
                      {searchTerm ? 'No users found matching your search' : 'No users yet'}
                    </p>
                    <p className="text-xs text-slate-500 mt-2">
                      Click "Add User" to create your first sub-user
                    </p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((subUser) => (
                  <tr key={subUser.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                    {/* User Info */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {subUser.firstName?.[0] || subUser.username?.[0]?.toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {subUser.fullName || subUser.username}
                          </p>
                          <p className="text-xs text-slate-400">@{subUser.username}</p>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span className="text-slate-300">{subUser.email}</span>
                          {subUser.isEmailVerified && (
                            <span className="text-xs text-green-400">✓</span>
                          )}
                        </div>
                        {subUser.phoneNumber && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span className="text-slate-400">{subUser.phoneNumber}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                          subUser.isActive
                        )}`}
                      >
                        {subUser.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* Balance */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-400" />
                        <span className="text-white font-medium">
                          ${(subUser.accountBalance || 0).toFixed(2)}
                        </span>
                      </div>
                    </td>

                    {/* Joined Date */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {formatDate(subUser.createdAt)}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <button className="text-violet-400 hover:text-violet-300 text-sm font-medium transition-colors">
                          Edit
                        </button>
                        <span className="text-slate-600">|</span>
                        <button className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors">
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add User Modal */}
      <AddUserModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchSubUsers}
      />
    </div>
  );
};

export default UserManagement;
