import { useState, useEffect } from 'react';
import { Download, Search, DollarSign, Globe, Phone, AlertCircle } from 'lucide-react';
import Card from '../components/ui/Card';
import toast from 'react-hot-toast';
import { ratesAPI } from '../services/api';

const MyRates = () => {
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'destinationName', direction: 'asc' });

  useEffect(() => {
    fetchMyRates();
  }, []);

  const fetchMyRates = async () => {
    try {
      const response = await ratesAPI.getMyRates();

      // Handle response data (can be direct array or wrapped)
      const ratesData = Array.isArray(response.data) ? response.data : (response.data?.data || []);
      setRates(ratesData);

      if (ratesData.length === 0) {
        toast.info('No tariff plan assigned. Contact your administrator to get rates.', { duration: 4000 });
      }

      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch rates:', error);

      if (error.response?.status === 404) {
        toast.error('No tariff plan assigned to your account');
      } else {
        toast.error('Failed to load your rates. Please try again.');
      }

      setRates([]);
      setLoading(false);
    }
  };

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const handleExport = () => {
    if (rates.length === 0) {
      toast.error('No rates to export');
      return;
    }

    // Create CSV content
    const csvHeaders = 'Destination,Code,Rate per Minute\n';
    const csvContent = rates.map(rate =>
      `"${rate.destinationName}",${rate.code},${rate.sellPrice.toFixed(5)}`
    ).join('\n');

    const blob = new Blob([csvHeaders + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `my_rates_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Rates exported successfully!');
  };

  // Filter rates based on search
  const filteredRates = rates.filter(rate =>
    rate.destinationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rate.code.includes(searchQuery)
  );

  // Sort rates
  const sortedRates = [...filteredRates].sort((a, b) => {
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (typeof aValue === 'string') {
      return sortConfig.direction === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
  });

  // Calculate statistics
  const avgRate = rates.length > 0
    ? rates.reduce((sum, rate) => sum + rate.sellPrice, 0) / rates.length
    : 0;
  const minRate = rates.length > 0
    ? Math.min(...rates.map(r => r.sellPrice))
    : 0;
  const maxRate = rates.length > 0
    ? Math.max(...rates.map(r => r.sellPrice))
    : 0;

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
          <h1 className="text-3xl font-bold text-white mb-2">My Call Rates</h1>
          <p className="text-slate-400">
            View your current calling rates to international destinations
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={rates.length === 0}
          title={rates.length === 0 ? 'No rates to export' : 'Export rates as CSV'}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 disabled:from-slate-700 disabled:to-slate-800 disabled:cursor-not-allowed text-white rounded-lg transition-all"
        >
          <Download className="w-4 h-4" />
          Export Rates
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="hover:scale-105 transition-transform duration-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-slate-400 mb-1">Total Destinations</p>
              <p className="text-3xl font-bold text-white mb-1">{rates.length}</p>
              <p className="text-xs text-slate-500">Available to call</p>
            </div>
            <div className="p-3 bg-violet-900/20 rounded-lg">
              <Globe className="w-6 h-6 text-violet-400" />
            </div>
          </div>
        </Card>

        <Card className="hover:scale-105 transition-transform duration-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-slate-400 mb-1">Average Rate</p>
              <p className="text-3xl font-bold text-white mb-1">${avgRate.toFixed(5)}</p>
              <p className="text-xs text-slate-500">Per minute</p>
            </div>
            <div className="p-3 bg-blue-900/20 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="hover:scale-105 transition-transform duration-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-slate-400 mb-1">Lowest Rate</p>
              <p className="text-3xl font-bold text-white mb-1">${minRate.toFixed(5)}</p>
              <p className="text-xs text-slate-500">Per minute</p>
            </div>
            <div className="p-3 bg-green-900/20 rounded-lg">
              <Phone className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </Card>

        <Card className="hover:scale-105 transition-transform duration-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-slate-400 mb-1">Highest Rate</p>
              <p className="text-3xl font-bold text-white mb-1">${maxRate.toFixed(5)}</p>
              <p className="text-xs text-slate-500">Per minute</p>
            </div>
            <div className="p-3 bg-orange-900/20 rounded-lg">
              <Phone className="w-6 h-6 text-orange-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Info Banner */}
      <Card className="bg-gradient-to-r from-violet-900/20 to-purple-900/20 border-violet-800/30">
        <div className="flex items-start gap-3">
          <DollarSign className="w-5 h-5 text-violet-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-white font-semibold mb-1">About Your Rates</h3>
            <p className="text-sm text-slate-300">
              These are the rates you'll be charged per minute when making international calls.
              Rates are billed per second with a minimum billing increment. Your balance will be deducted automatically.
            </p>
          </div>
        </div>
      </Card>

      {/* Rates Table */}
      <Card>
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by destination or country code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-600"
              />
            </div>
            <div className="text-sm text-slate-400">
              {filteredRates.length} of {rates.length} destinations
            </div>
          </div>

          {/* Table */}
          {filteredRates.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              {searchQuery ? (
                <>
                  <Search className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                  <p className="text-lg font-medium text-slate-400 mb-2">No matching rates found</p>
                  <p className="text-sm text-slate-500">Try a different search term</p>
                </>
              ) : rates.length === 0 ? (
                <>
                  <AlertCircle className="w-16 h-16 mx-auto mb-4 text-amber-500/50" />
                  <p className="text-lg font-medium text-slate-400 mb-2">No Tariff Plan Assigned</p>
                  <p className="text-sm text-slate-500 mb-4">
                    You don't have a rate plan assigned yet.
                    <br />
                    Please contact your administrator to get started.
                  </p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600/10 border border-violet-500/20 rounded-lg text-violet-400 text-sm">
                    <Phone className="w-4 h-4" />
                    <span>Contact Support</span>
                  </div>
                </>
              ) : (
                <>
                  <Search className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                  <p className="text-sm">No rates available</p>
                </>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-900/50 border-b border-slate-800">
                  <tr>
                    <th
                      onClick={() => handleSort('destinationName')}
                      className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-violet-400 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        Destination
                        {sortConfig.key === 'destinationName' && (
                          <span className="text-violet-400">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('code')}
                      className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-violet-400 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        Code
                        {sortConfig.key === 'code' && (
                          <span className="text-violet-400">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('sellPrice')}
                      className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-violet-400 transition-colors"
                    >
                      <div className="flex items-center justify-end gap-2">
                        Rate (per min)
                        {sortConfig.key === 'sellPrice' && (
                          <span className="text-violet-400">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {sortedRates.map((rate, index) => (
                    <tr key={index} className="hover:bg-slate-900/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-slate-500" />
                          <span className="text-sm text-white font-medium">
                            {rate.destinationName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-slate-400 font-mono">
                          +{rate.code}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm text-violet-400 font-mono font-semibold">
                          ${rate.sellPrice.toFixed(5)}
                        </span>
                        <span className="text-xs text-slate-500 ml-1">/min</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      {/* Footer Info */}
      <Card className="bg-slate-900/50">
        <div className="text-sm text-slate-400 space-y-2">
          <p>
            <span className="font-semibold text-slate-300">Note:</span> Rates shown are per minute charges.
            Actual billing may vary based on your tariff plan's charging interval (typically per second or per 6 seconds).
          </p>
          <p>
            <span className="font-semibold text-slate-300">International Prefix:</span> Remember to dial the '+'
            or your country's international access code (e.g., 00 or 011) before the country code.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default MyRates;
