import { useState, useEffect } from 'react';
import { usersAPI } from '../services/api';
import { UserPlus, Mail, Phone, Calendar, CheckCircle, XCircle } from 'lucide-react';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import AddUserModal from '../components/modals/AddUserModal';
import toast from 'react-hot-toast';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addUserOpen, setAddUserOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await usersAPI.getAll();
      if (response.data.success) {
        setUsers(response.data.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
      setLoading(false);
    }
  };

  const columns = [
    {
      key: 'id',
      label: 'ID',
      render: (value) => (
        <span className="font-mono text-violet-400">#{value}</span>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      render: (value) => (
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-slate-500" />
          <span>{value}</span>
        </div>
      ),
    },
    {
      key: 'firstName',
      label: 'Name',
      render: (value, row) => (
        <span className="font-medium">
          {row.firstName} {row.lastName}
        </span>
      ),
    },
    {
      key: 'phoneNumber',
      label: 'Phone',
      render: (value) => (
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-slate-500" />
          <span>{value || '-'}</span>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      render: (value) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            value === 'Admin'
              ? 'bg-violet-900/30 text-violet-300'
              : 'bg-blue-900/30 text-blue-300'
          }`}
        >
          {value}
        </span>
      ),
    },
    {
      key: 'accountBalance',
      label: 'Balance',
      render: (value) => (
        <span className="font-semibold text-green-400">
          ${(value || 0).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (value) => (
        <div className="flex items-center gap-2">
          {value ? (
            <>
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-green-400">Active</span>
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4 text-red-400" />
              <span className="text-red-400">Inactive</span>
            </>
          )}
        </div>
      ),
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (value) => (
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span className="text-sm">
            {new Date(value).toLocaleDateString()}
          </span>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Users Management</h1>
          <p className="text-slate-400">
            Manage all users in your VoIP platform
          </p>
        </div>
        <Button variant="primary" onClick={() => setAddUserOpen(true)}>
          <UserPlus className="w-5 h-5" />
          Add User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1">Total Users</p>
              <p className="text-2xl font-bold text-white">{users.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-900/30 rounded-lg flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1">Active Users</p>
              <p className="text-2xl font-bold text-white">
                {users.filter((u) => u.isActive).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-900/30 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1">Admins</p>
              <p className="text-2xl font-bold text-white">
                {users.filter((u) => u.role === 'Admin').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-violet-900/30 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-violet-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Users Table */}
      <Card title="All Users" subtitle={`${users.length} users found`}>
        <Table columns={columns} data={users} loading={loading} />
      </Card>

      <AddUserModal
        isOpen={addUserOpen}
        onClose={() => setAddUserOpen(false)}
        onSuccess={fetchUsers}
      />
    </div>
  );
};

export default Users;
