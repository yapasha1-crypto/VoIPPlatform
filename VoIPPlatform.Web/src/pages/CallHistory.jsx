import { useState, useEffect } from 'react';
import { callRecordsAPI } from '../services/api';
import { Phone, Clock, DollarSign, Zap } from 'lucide-react';
import Card from '../components/ui/Card';
import Table from '../components/ui/Table';
import toast from 'react-hot-toast';

const CallHistory = () => {
  const [callRecords, setCallRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    fetchCallRecords();
  }, []);

  const fetchCallRecords = async () => {
    try {
      const response = await callRecordsAPI.getMyCalls();
      if (response.data.success) {
        setCallRecords(response.data.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch call records:', error);
      toast.error('Failed to load call history');
      setLoading(false);
    }
  };

  const handleSimulateCalls = async () => {
    setSimulating(true);
    try {
      const response = await callRecordsAPI.seedCallRecords();
      if (response.data.success) {
        toast.success(`Test data generated! ${response.data.count} calls created.`);
        // Automatically refresh the data
        await fetchCallRecords();
      }
    } catch (error) {
      console.error('Failed to simulate calls:', error);
      toast.error('Failed to generate test data');
    } finally {
      setSimulating(false);
    }
  };

  // Format duration from seconds to MM:SS
  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Status badge component with color coding
  const StatusBadge = ({ status }) => {
    const statusConfig = {
      Answered: { bg: 'bg-green-900/30', text: 'text-green-300', label: 'Answered' },
      Failed: { bg: 'bg-red-900/30', text: 'text-red-300', label: 'Failed' },
      Busy: { bg: 'bg-yellow-900/30', text: 'text-yellow-300', label: 'Busy' },
      NoAnswer: { bg: 'bg-gray-900/30', text: 'text-gray-300', label: 'No Answer' }
    };

    const config = statusConfig[status] || statusConfig.NoAnswer;

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const columns = [
    {
      key: 'startTime',
      label: 'Date/Time',
      render: (value) => (
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-500" />
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {new Date(value).toLocaleDateString()}
            </span>
            <span className="text-xs text-slate-500">
              {new Date(value).toLocaleTimeString()}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'callerId',
      label: 'Source',
      render: (value) => (
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-violet-400" />
          <span className="font-mono text-sm">{value}</span>
        </div>
      ),
    },
    {
      key: 'calleeId',
      label: 'Destination',
      render: (value) => (
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-blue-400" />
          <span className="font-mono text-sm">{value}</span>
        </div>
      ),
    },
    {
      key: 'duration',
      label: 'Duration',
      render: (value) => (
        <span className="font-mono text-sm text-slate-300">
          {formatDuration(value)}
        </span>
      ),
    },
    {
      key: 'cost',
      label: 'Cost',
      render: (value) => (
        <div className="flex items-center gap-1">
          <DollarSign className="w-4 h-4 text-green-400" />
          <span className="font-semibold text-green-400">
            {value.toFixed(2)}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <StatusBadge status={value} />,
    },
  ];

  // Calculate summary statistics
  const totalCalls = callRecords.length;
  const answeredCalls = callRecords.filter(c => c.status === 'Answered').length;
  const totalCost = callRecords.reduce((sum, c) => sum + c.cost, 0);
  const totalDuration = callRecords.filter(c => c.status === 'Answered').reduce((sum, c) => sum + c.duration, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Call History</h1>
          <p className="text-slate-400">
            View your complete call detail records (CDR)
          </p>
        </div>
        <button
          onClick={handleSimulateCalls}
          disabled={simulating}
          className="flex items-center gap-2 px-4 py-2 border-2 border-violet-600 text-violet-400 rounded-lg hover:bg-violet-600/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Zap className={`w-5 h-5 ${simulating ? 'animate-pulse' : ''}`} />
          {simulating ? 'Generating...' : 'Simulate Calls'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1">Total Calls</p>
              <p className="text-2xl font-bold text-white">{totalCalls}</p>
            </div>
            <div className="w-12 h-12 bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Phone className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1">Answered</p>
              <p className="text-2xl font-bold text-white">{answeredCalls}</p>
            </div>
            <div className="w-12 h-12 bg-green-900/30 rounded-lg flex items-center justify-center">
              <Phone className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1">Total Duration</p>
              <p className="text-2xl font-bold text-white">
                {formatDuration(totalDuration)}
              </p>
            </div>
            <div className="w-12 h-12 bg-violet-900/30 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-violet-400" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1">Total Cost</p>
              <p className="text-2xl font-bold text-white">
                ${totalCost.toFixed(2)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-900/30 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Call Records Table */}
      <Card title="Call Detail Records" subtitle={`${totalCalls} records found`}>
        <Table columns={columns} data={callRecords} loading={loading} />
      </Card>
    </div>
  );
};

export default CallHistory;
