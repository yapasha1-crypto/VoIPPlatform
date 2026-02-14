import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI } from '../services/api';
import { Building2, Users, Activity, DollarSign, Wallet, TrendingUp, Gauge } from 'lucide-react';
import Card from '../components/ui/Card';
import toast from 'react-hot-toast';

const ResellerDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    // Polling: Refresh stats every 10 seconds
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await dashboardAPI.getResellerStats();
      if (response.data.success) {
        setStats(response.data.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch reseller stats:', error);
      if (loading) {
        toast.error('Failed to load reseller statistics');
      }
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Companies',
      value: stats?.totalCompanies || 0,
      icon: Building2,
      color: 'from-violet-600 to-purple-700',
      bgColor: 'bg-violet-900/20',
      description: 'Active companies under management',
    },
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'from-blue-600 to-blue-700',
      bgColor: 'bg-blue-900/20',
      description: 'Across all companies',
    },
    {
      title: 'Channel Capacity',
      value: stats?.totalChannelCapacity || 0,
      icon: Gauge,
      color: 'from-emerald-600 to-emerald-700',
      bgColor: 'bg-emerald-900/20',
      description: 'Total concurrent call capacity',
    },
    {
      title: 'Active Channels',
      value: stats?.totalActiveChannels || 0,
      icon: Activity,
      color: 'from-orange-600 to-orange-700',
      bgColor: 'bg-orange-900/20',
      description: 'Currently in use',
    },
    {
      title: 'Channel Utilization',
      value: `${(stats?.channelUtilizationPercentage || 0).toFixed(1)}%`,
      icon: TrendingUp,
      color: 'from-pink-600 to-pink-700',
      bgColor: 'bg-pink-900/20',
      description: 'Network efficiency',
    },
    {
      title: 'Revenue Today',
      value: `$${(stats?.totalRevenueToday || 0).toFixed(2)}`,
      icon: DollarSign,
      color: 'from-green-600 to-green-700',
      bgColor: 'bg-green-900/20',
      description: `${stats?.totalCallsToday || 0} calls`,
    },
    {
      title: 'Total Balance',
      value: `$${(stats?.totalBalance || 0).toFixed(2)}`,
      icon: Wallet,
      color: 'from-indigo-600 to-indigo-700',
      bgColor: 'bg-indigo-900/20',
      description: 'Across all accounts',
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Reseller Dashboard</h1>
          <p className="text-slate-400">
            Managing {stats?.totalCompanies || 0} companies with {stats?.totalUsers || 0} total users
          </p>
        </div>
        <div className="hidden md:flex items-center space-x-2 px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-slate-300">Live Updates</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index} className="hover:scale-105 transition-transform duration-200">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-slate-400 mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.description}</p>
              </div>
              <div className={`p-3 ${stat.bgColor} rounded-lg`}>
                <stat.icon className={`w-6 h-6 text-white bg-gradient-to-r ${stat.color} rounded`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Channel Utilization Bar */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">Network Channel Utilization</h3>
              <p className="text-sm text-slate-400">
                {stats?.totalActiveChannels || 0} / {stats?.totalChannelCapacity || 0} channels in use
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-violet-400">
                {(stats?.channelUtilizationPercentage || 0).toFixed(1)}%
              </p>
              <p className="text-xs text-slate-500">Utilization</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative w-full h-6 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="absolute h-full bg-gradient-to-r from-violet-600 to-purple-700 transition-all duration-500 ease-out flex items-center justify-center"
              style={{ width: `${Math.min(stats?.channelUtilizationPercentage || 0, 100)}%` }}
            >
              {stats?.channelUtilizationPercentage > 10 && (
                <span className="text-xs font-semibold text-white">
                  {stats?.totalActiveChannels} Active
                </span>
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gradient-to-r from-violet-600 to-purple-700 rounded"></div>
              <span className="text-slate-400">Active Channels</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-slate-800 rounded"></div>
              <span className="text-slate-400">Available Channels</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Company Overview Table */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Company Overview</h3>
            <button
              onClick={() => navigate('/dashboard/companies')}
              className="text-sm text-violet-400 hover:text-violet-300 transition-colors"
            >
              View All →
            </button>
          </div>

          {/* Placeholder for company list - To be implemented with actual data */}
          <div className="text-center py-8 text-slate-500">
            <Building2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Company list coming soon</p>
            <p className="text-xs text-slate-600 mt-1">
              This will display detailed information about each company
            </p>
          </div>
        </div>
      </Card>

      {/* Recent Activity */}
      <Card>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Today's Activity</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-400">{stats?.totalCallsToday || 0}</p>
              <p className="text-sm text-slate-400 mt-1">Total Calls</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-400">
                ${(stats?.totalRevenueToday || 0).toFixed(2)}
              </p>
              <p className="text-sm text-slate-400 mt-1">Revenue</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-violet-400">
                ${((stats?.totalRevenueToday || 0) / Math.max(stats?.totalCallsToday || 1, 1)).toFixed(2)}
              </p>
              <p className="text-sm text-slate-400 mt-1">Avg. Call Cost</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ResellerDashboard;
