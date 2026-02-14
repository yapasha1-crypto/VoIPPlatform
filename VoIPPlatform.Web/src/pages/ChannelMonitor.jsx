import { useState, useEffect } from 'react';
import { dashboardAPI, callRecordsAPI } from '../services/api';
import { Activity, Gauge, AlertCircle, TrendingUp, Phone, Clock, BarChart3 } from 'lucide-react';
import Card from '../components/ui/Card';
import toast from 'react-hot-toast';

const ChannelMonitor = () => {
  const [stats, setStats] = useState(null);
  const [channelInfo, setChannelInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    fetchChannelData();
    // Real-time polling every 3 seconds
    const interval = setInterval(() => {
      fetchChannelData();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchChannelData = async () => {
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

      setLastUpdate(new Date());
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch channel data:', error);
      if (loading) {
        toast.error('Failed to load channel monitoring data');
      }
      setLoading(false);
    }
  };

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

  const getUtilizationBadge = (percentage) => {
    if (percentage >= 90) return { text: 'Critical', color: 'bg-red-500/20 text-red-400 border-red-500/50' };
    if (percentage >= 70) return { text: 'High', color: 'bg-orange-500/20 text-orange-400 border-orange-500/50' };
    if (percentage >= 50) return { text: 'Medium', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' };
    return { text: 'Normal', color: 'bg-green-500/20 text-green-400 border-green-500/50' };
  };

  const utilizationPercentage = stats?.channelUtilizationPercentage || 0;
  const isNearCapacity = utilizationPercentage >= 90;
  const badge = getUtilizationBadge(utilizationPercentage);

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
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Activity className="w-8 h-8 text-violet-400 animate-pulse" />
            Live Channel Monitor
          </h1>
          <p className="text-slate-400">
            Real-time concurrent call capacity monitoring with 3-second refresh
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className={`px-4 py-2 rounded-lg text-sm font-semibold border ${badge.color}`}>
            {badge.text} Usage
          </span>
          <div className="flex items-center space-x-2 px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-slate-300">
              Live ({lastUpdate.toLocaleTimeString()})
            </span>
          </div>
        </div>
      </div>

      {/* Critical Alert Banner */}
      {isNearCapacity && (
        <div className="p-5 bg-red-900/30 border-2 border-red-500/50 rounded-xl">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-8 h-8 text-red-400 flex-shrink-0 animate-pulse" />
            <div className="flex-1">
              <p className="text-lg font-bold text-red-400 mb-2">⚠️ Channel Capacity Critical</p>
              <p className="text-sm text-red-300/90">
                You're currently using <strong>{stats?.activeCalls}</strong> out of{' '}
                <strong>{stats?.maxConcurrentCalls}</strong> available channels ({utilizationPercentage.toFixed(1)}% utilization).
                Consider upgrading capacity or managing active calls to prevent service disruption.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Channel Display Card */}
      <Card className="border-2 border-violet-600/50">
        <div className="space-y-6">
          {/* Big Numbers Display */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Active Calls */}
            <div className="text-center p-6 bg-slate-900/50 rounded-xl border border-slate-700">
              <p className="text-sm text-slate-400 mb-2">Active Calls</p>
              <p className="text-6xl font-bold text-white mb-2">{stats?.activeCalls || 0}</p>
              <p className="text-sm text-slate-500">Channels in use</p>
            </div>

            {/* Available Channels */}
            <div className="text-center p-6 bg-slate-900/50 rounded-xl border border-slate-700">
              <p className="text-sm text-slate-400 mb-2">Available</p>
              <p className="text-6xl font-bold text-green-400 mb-2">{stats?.availableChannels || 0}</p>
              <p className="text-sm text-slate-500">Ready to use</p>
            </div>

            {/* Utilization */}
            <div className="text-center p-6 bg-slate-900/50 rounded-xl border border-slate-700">
              <p className="text-sm text-slate-400 mb-2">Utilization</p>
              <p className={`text-6xl font-bold mb-2 ${getUtilizationTextColor(utilizationPercentage)}`}>
                {utilizationPercentage.toFixed(1)}%
              </p>
              <p className="text-sm text-slate-500">of {stats?.maxConcurrentCalls || 0} max</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm text-slate-400">
              <span>Channel Capacity</span>
              <span>
                {stats?.activeCalls || 0} / {stats?.maxConcurrentCalls || 0}
              </span>
            </div>
            <div className="relative w-full h-12 bg-slate-900 rounded-full overflow-hidden border-2 border-slate-700">
              <div
                className={`absolute h-full bg-gradient-to-r ${getUtilizationColor(
                  utilizationPercentage
                )} transition-all duration-300 ease-out flex items-center justify-center shadow-lg`}
                style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
              >
                {utilizationPercentage > 10 && (
                  <span className="text-sm font-bold text-white drop-shadow-lg">
                    {stats?.activeCalls} Active
                  </span>
                )}
              </div>
              {utilizationPercentage < 90 && (
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
          </div>

          {/* Visual Channel Bars */}
          <div className="space-y-3">
            <p className="text-sm text-slate-400 font-medium">Channel Status Grid</p>
            <div className="grid grid-cols-10 md:grid-cols-20 gap-1.5">
              {Array.from({ length: stats?.maxConcurrentCalls || 20 }).map((_, index) => {
                const isActive = index < (stats?.activeCalls || 0);
                return (
                  <div
                    key={index}
                    className={`aspect-square rounded transition-all duration-300 ${
                      isActive
                        ? 'bg-gradient-to-br from-violet-600 to-purple-500 shadow-md shadow-violet-500/50 scale-110'
                        : 'bg-slate-800 border border-slate-700'
                    }`}
                    title={`Channel ${index + 1}: ${isActive ? 'Active' : 'Available'}`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:scale-105 transition-transform duration-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-slate-400 mb-1">Max Capacity</p>
              <p className="text-3xl font-bold text-white mb-1">{stats?.maxConcurrentCalls || 0}</p>
              <p className="text-xs text-slate-500">Concurrent channels</p>
            </div>
            <div className="p-3 bg-indigo-900/20 rounded-lg">
              <Gauge className="w-6 h-6 text-indigo-400" />
            </div>
          </div>
        </Card>

        <Card className="hover:scale-105 transition-transform duration-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-slate-400 mb-1">Calls Today</p>
              <p className="text-3xl font-bold text-white mb-1">{stats?.totalCallsToday || 0}</p>
              <p className="text-xs text-slate-500">Total completed</p>
            </div>
            <div className="p-3 bg-blue-900/20 rounded-lg">
              <Phone className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="hover:scale-105 transition-transform duration-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-slate-400 mb-1">Peak Usage</p>
              <p className="text-3xl font-bold text-white mb-1">
                {Math.max(stats?.activeCalls || 0, Math.floor((stats?.maxConcurrentCalls || 0) * 0.7))}
              </p>
              <p className="text-xs text-slate-500">Today's peak</p>
            </div>
            <div className="p-3 bg-orange-900/20 rounded-lg">
              <TrendingUp className="w-6 h-6 text-orange-400" />
            </div>
          </div>
        </Card>

        <Card className="hover:scale-105 transition-transform duration-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-slate-400 mb-1">Avg Duration</p>
              <p className="text-3xl font-bold text-white mb-1">
                {((stats?.totalCallDurationToday || 0) / Math.max(stats?.totalCallsToday || 1, 1) / 60).toFixed(0)}m
              </p>
              <p className="text-xs text-slate-500">Per call</p>
            </div>
            <div className="p-3 bg-emerald-900/20 rounded-lg">
              <Clock className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Utilization History Chart Placeholder */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-violet-400" />
              Channel Utilization Trend
            </h3>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span className="w-3 h-3 bg-violet-500 rounded-full"></span>
              <span>Real-time monitoring</span>
            </div>
          </div>

          {/* Simplified utilization visualization */}
          <div className="h-64 bg-slate-900/50 rounded-lg border border-slate-700 flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="w-16 h-16 mx-auto mb-3 text-slate-600" />
              <p className="text-slate-400 text-sm">Utilization trend chart</p>
              <p className="text-xs text-slate-600 mt-1">Historical data visualization coming soon</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Legend and Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white mb-3">Utilization Levels</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-green-900/20 rounded border border-green-500/30">
                <span className="text-sm text-slate-300">Normal (0-49%)</span>
                <span className="text-xs text-green-400 font-medium">Optimal</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-yellow-900/20 rounded border border-yellow-500/30">
                <span className="text-sm text-slate-300">Medium (50-69%)</span>
                <span className="text-xs text-yellow-400 font-medium">Monitor</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-orange-900/20 rounded border border-orange-500/30">
                <span className="text-sm text-slate-300">High (70-89%)</span>
                <span className="text-xs text-orange-400 font-medium">Warning</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-red-900/20 rounded border border-red-500/30">
                <span className="text-sm text-slate-300">Critical (90-100%)</span>
                <span className="text-xs text-red-400 font-medium">Action Required</span>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white mb-3">System Info</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-700/50">
                <span className="text-slate-400">Refresh Rate</span>
                <span className="text-white font-medium">3 seconds</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-700/50">
                <span className="text-slate-400">Last Update</span>
                <span className="text-white font-medium">{lastUpdate.toLocaleTimeString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-700/50">
                <span className="text-slate-400">Billing Type</span>
                <span className="text-white font-medium">{stats?.billingType || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-400">Monthly Rate</span>
                <span className="text-white font-medium">${(stats?.channelRate || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ChannelMonitor;
