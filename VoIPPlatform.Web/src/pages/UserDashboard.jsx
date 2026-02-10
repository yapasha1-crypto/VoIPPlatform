import { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';
import { Users, UserCheck, Phone, DollarSign, TrendingUp, Wallet, Clock } from 'lucide-react';
import Card from '../components/ui/Card';
import toast from 'react-hot-toast';

const UserDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await dashboardAPI.getStats();
      if (response.data.success) {
        setStats(response.data.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      toast.error('Failed to load dashboard statistics');
      setLoading(false);
    }
  };

  // Format duration from seconds to HH:MM:SS or MM:SS
  const formatDuration = (seconds) => {
    if (!seconds) return '00:00';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const statCards = [
    {
      title: 'Account Balance',
      value: `$${(stats?.balance || 0).toFixed(2)}`,
      icon: Wallet,
      color: 'from-violet-600 to-violet-700',
      bgColor: 'bg-violet-900/20',
    },
    {
      title: 'Total Calls',
      value: stats?.totalCalls || 0,
      icon: Phone,
      color: 'from-blue-600 to-blue-700',
      bgColor: 'bg-blue-900/20',
    },
    {
      title: 'Total Cost',
      value: `$${(stats?.totalCost || 0).toFixed(2)}`,
      icon: DollarSign,
      color: 'from-red-600 to-red-700',
      bgColor: 'bg-red-900/20',
    },
    {
      title: 'Total Duration',
      value: formatDuration(stats?.totalDuration || 0),
      icon: Clock,
      color: 'from-emerald-600 to-emerald-700',
      bgColor: 'bg-emerald-900/20',
    },
    {
      title: 'Active Services',
      value: stats?.activeServices || 0,
      icon: UserCheck,
      color: 'from-green-600 to-green-700',
      bgColor: 'bg-green-900/20',
    },
  ];

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
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-slate-400">Welcome back! Here's an overview of your VoIP platform.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index} className="hover:scale-105 transition-transform duration-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-slate-400 mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-white mb-2">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent Activity Section */}
      <Card title="Quick Actions" className="mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-all text-left border border-slate-600">
            <Phone className="w-8 h-8 text-violet-400 mb-2" />
            <h3 className="font-semibold text-white mb-1">Make Call</h3>
            <p className="text-sm text-slate-400">Start a new VoIP call</p>
          </button>

          <button className="p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-all text-left border border-slate-600">
            <Users className="w-8 h-8 text-blue-400 mb-2" />
            <h3 className="font-semibold text-white mb-1">Manage Users</h3>
            <p className="text-sm text-slate-400">View and edit users</p>
          </button>

          <button className="p-4 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-all text-left border border-slate-600">
            <DollarSign className="w-8 h-8 text-green-400 mb-2" />
            <h3 className="font-semibold text-white mb-1">View Reports</h3>
            <p className="text-sm text-slate-400">Check financial reports</p>
          </button>
        </div>
      </Card>
    </div>
  );
};

export default UserDashboard;
