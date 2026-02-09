import { useAuth } from '../context/AuthContext';
import { UserCircle, Mail, Phone, Calendar, Shield, Wallet } from 'lucide-react';
import Card from '../components/ui/Card';

const Profile = () => {
  const { user } = useAuth();

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
                Joined {new Date().toLocaleDateString()}
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
          <button className="p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-all text-left border border-slate-600">
            <Shield className="w-6 h-6 text-violet-400 mb-2" />
            <h3 className="font-semibold text-white mb-1">Change Password</h3>
            <p className="text-sm text-slate-400">Update your password</p>
          </button>

          <button className="p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-all text-left border border-slate-600">
            <Mail className="w-6 h-6 text-blue-400 mb-2" />
            <h3 className="font-semibold text-white mb-1">Update Email</h3>
            <p className="text-sm text-slate-400">Change your email address</p>
          </button>
        </div>
      </Card>
    </div>
  );
};

export default Profile;
