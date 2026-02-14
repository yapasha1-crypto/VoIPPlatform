import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardAPI, callRecordsAPI } from '../services/api';
import { Users, Activity, DollarSign, Gauge, Phone, TrendingUp, AlertCircle } from 'lucide-react';
import Card from '../components/ui/Card';
import toast from 'react-hot-toast';

const CompanyDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [channelInfo, setChannelInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
    // Polling: Refresh every 5 seconds for live channel monitoring
    const interval = setInterval(fetchAllData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchAllData = async () => {
    try {
      const [statsResponse, channelResponse] = await Promise.all([
        dashboardAPI.getCompanyStats(),
        callRecordsAPI.getChannelInfo(),
      ]);

      if (statsResponse.data.success) {
        setStats(statsResponse.data.data);
      }

      if (channelResponse.data.success) {
        setChannelInfo(channelResponse.data.data);
      }

      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch company stats:', error);
      if (loading) {
        toast.error('Failed to load company statistics');
      }
      setLoading(false);
    }
  };

  // Determine channel status color
  const getUtilizationColor = (percentage) => {
    if (percentage >= 90) return 'from-red-600 to-red-700';
    if (percentage >= 70) return 'from-orange-600 to-orange-700';
    if (percentage >= 50) return 'from-yellow-600 to-yellow-700';
    return 'from-green-600 to-green-700';
  };

  const getUtilizationTextColor = (percentage) => {
    if (percentage >= 90) return 'text-red-400';
    if (percentage >= 70) return 'text-orange-400';
    if (percentage >= 50) return 'text-yellow-400';
    return 'text-green-400';
  };

  const statCards = [
    {
      title: 'Active Calls',
      value: stats?.activeCalls || 0,
      icon: Activity,
      color: 'from-violet-600 to-purple-700',
      bgColor: 'bg-violet-900/20',
      description: `${stats?.availableChannels || 0} channels available`,
    },
    {
      title: 'Total Sub-Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'from-blue-600 to-blue-700',
      bgColor: 'bg-blue-900/20',
      description: 'Agents under company',
    },
    {
      title: 'Calls Today',
      value: stats?.totalCallsToday || 0,
      icon: Phone,
      color: 'from-emerald-600 to-emerald-700',
      bgColor: 'bg-emerald-900/20',
      description: 'Total calls made',
    },
    {
      title: 'Cost Today',
      value: `$${(stats?.totalCostToday || 0).toFixed(2)}`,
      icon: DollarSign,
      color: 'from-red-600 to-red-700',
      bgColor: 'bg-red-900/20',
      description: 'Usage cost',
    },
    {
      title: 'Company Balance',
      value: `$${(stats?.companyBalance || 0).toFixed(2)}`,
      icon: TrendingUp,
      color: 'from-green-600 to-green-700',
      bgColor: 'bg-green-900/20',
      description: 'Available funds',
    },
    {
      title: 'Monthly Rate',
      value: `$${(stats?.channelRate || 0).toFixed(2)}`,
      icon: Gauge,
      color: 'from-indigo-600 to-indigo-700',
      bgColor: 'bg-indigo-900/20',
      description: `${stats?.billingType || 'N/A'} billing`,
    },
  ];

  const utilizationPercentage = stats?.channelUtilizationPercentage || 0;
  const isNearCapacity = utilizationPercentage >= 90;

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
          <h1 className="text-3xl font-bold text-white mb-2">Company Dashboard</h1>
          <p className="text-slate-400">
            {stats?.companyName || 'Your Company'} - SIP Trunk Management
          </p>
        </div>
        <div className="hidden md:flex items-center space-x-2 px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-slate-300">Live Monitor (5s refresh)</span>
        </div>
      </div>

      {/* CRITICAL: Live Channel Monitor */}
      <Card className="border-2 border-violet-600/50">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Activity className="w-7 h-7 text-violet-400 animate-pulse" />
                Live Channel Monitor
              </h2>
              <p className="text-sm text-slate-400 mt-1">Real-time concurrent call capacity</p>
            </div>
            {isNearCapacity && (
              <div className="flex items-center gap-2 px-3 py-2 bg-red-900/30 rounded-lg border border-red-500/50">
                <AlertCircle className="w-5 h-5 text-red-400 animate-pulse" />
                <span className="text-sm font-semibold text-red-400">Near Capacity</span>
              </div>
            )}
          </div>

          {/* Main Channel Display */}
          <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-6xl font-bold text-white">
                  {stats?.activeCalls || 0}
                  <span className="text-3xl text-slate-500"> / {stats?.maxConcurrentCalls || 0}</span>
                </p>
                <p className="text-sm text-slate-400 mt-2">Active Channels / Max Capacity</p>
              </div>
              <div className="text-right">
                <p className={`text-5xl font-bold ${getUtilizationTextColor(utilizationPercentage)}`}>
                  {utilizationPercentage.toFixed(1)}%
                </p>
                <p className="text-sm text-slate-400 mt-2">Utilization</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="relative w-full h-10 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div
                className={`absolute h-full bg-gradient-to-r ${getUtilizationColor(utilizationPercentage)} transition-all duration-300 ease-out flex items-center justify-center`}
                style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
              >
                {utilizationPercentage > 15 && (
                  <span className="text-sm font-bold text-white drop-shadow-lg">
                    {stats?.activeCalls} Active Calls
                  </span>
                )}
              </div>
              {/* Available Channels Label */}
              {utilizationPercentage < 85 && (
                <div
                  className="absolute h-full flex items-center justify-center text-sm font-semibold text-slate-400"
                  style={{
                    left: `${Math.min(utilizationPercentage, 100)}%`,
                    width: `${100 - Math.min(utilizationPercentage, 100)}%`,
                  }}
                >
                  {stats?.availableChannels} Available
                </div>
              )}
            </div>

            {/* Channel Bars Visualization */}
            <div className="mt-6 flex gap-1">
              {Array.from({ length: stats?.maxConcurrentCalls || 10 }).map((_, index) => {
                const isActive = index < (stats?.activeCalls || 0);
                return (
                  <div
                    key={index}
                    className={`flex-1 h-8 rounded transition-all duration-300 ${
                      isActive
                        ? 'bg-gradient-to-t from-violet-600 to-purple-500 shadow-lg shadow-violet-500/50'
                        : 'bg-slate-800 border border-slate-700'
                    }`}
                    title={isActive ? `Channel ${index + 1} - Active` : `Channel ${index + 1} - Available`}
                  />
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-between mt-4 text-sm">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gradient-to-r from-violet-600 to-purple-500 rounded"></div>
                  <span className="text-slate-300">Active</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-slate-800 border border-slate-700 rounded"></div>
                  <span className="text-slate-300">Available</span>
                </div>
              </div>
              <div className="text-slate-400">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>

          {/* Capacity Warning */}
          {isNearCapacity && (
            <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-400">Channel Capacity Warning</p>
                  <p className="text-xs text-red-300/80 mt-1">
                    You're using {stats?.activeCalls} out of {stats?.maxConcurrentCalls} channels.
                    Consider upgrading capacity or managing active calls.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

      {/* User Management Preview */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Sub-User Management</h3>
            <button
              onClick={() => navigate('/dashboard/manage-users')}
              className="text-sm text-violet-400 hover:text-violet-300 transition-colors"
            >
              Manage Users →
            </button>
          </div>

          {/* Placeholder for user list */}
          <div className="text-center py-8 text-slate-500">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">User list coming soon</p>
            <p className="text-xs text-slate-600 mt-1">
              Manage and monitor your {stats?.totalUsers || 0} sub-users
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CompanyDashboard;
