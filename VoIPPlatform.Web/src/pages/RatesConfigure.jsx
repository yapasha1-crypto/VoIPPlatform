import { useState, useEffect } from 'react';
import { Plus, Download, Upload, Calculator, DollarSign, TrendingUp, Info } from 'lucide-react';
import Card from '../components/ui/Card';
import toast from 'react-hot-toast';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5004';

const RatesConfigure = () => {
  const [tariffPlans, setTariffPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [configuredRates, setConfiguredRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRates, setLoadingRates] = useState(false);
  const [showNewPlanModal, setShowNewPlanModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // New Plan Form
  const [newPlan, setNewPlan] = useState({
    name: '',
    type: 0, // 0 = Percentage, 1 = Fixed, 2 = Free
    profitPercent: 10.0,
    fixedProfit: 0.0,
    minProfit: 0.0,
    maxProfit: 999999.0,
    precision: 5,
    chargingIntervalSeconds: 60,
  });

  useEffect(() => {
    fetchTariffPlans();
  }, []);

  useEffect(() => {
    if (selectedPlanId) {
      fetchConfiguredRates(selectedPlanId);
    }
  }, [selectedPlanId]);

  const fetchTariffPlans = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/rates/tariff-plans`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTariffPlans(response.data);

      // Auto-select first plan
      if (response.data.length > 0 && !selectedPlanId) {
        setSelectedPlanId(response.data[0].id);
      }

      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch tariff plans:', error);
      toast.error('Failed to load tariff plans');
      setLoading(false);
    }
  };

  const fetchConfiguredRates = async (planId) => {
    setLoadingRates(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/rates/configure?planId=${planId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConfiguredRates(response.data);
      setLoadingRates(false);
    } catch (error) {
      console.error('Failed to fetch configured rates:', error);
      toast.error('Failed to load rates');
      setLoadingRates(false);
    }
  };

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/api/rates/tariff-plans`, newPlan, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Tariff plan created successfully!');
      setShowNewPlanModal(false);
      fetchTariffPlans();

      // Reset form
      setNewPlan({
        name: '',
        type: 0,
        profitPercent: 10.0,
        fixedProfit: 0.0,
        minProfit: 0.0,
        maxProfit: 999999.0,
        precision: 5,
        chargingIntervalSeconds: 60,
      });
    } catch (error) {
      console.error('Failed to create tariff plan:', error);
      toast.error(error.response?.data?.error || 'Failed to create tariff plan');
    }
  };

  const handleExportRates = () => {
    if (configuredRates.length === 0) {
      toast.error('No rates to export');
      return;
    }

    // Create CSV content
    const csvHeaders = 'Destination,Code,Buy Rate,Sell Rate,Profit,Profit %\n';
    const csvContent = configuredRates.map(rate =>
      `"${rate.destinationName}",${rate.code},${rate.buyPrice.toFixed(5)},${rate.sellPrice.toFixed(5)},${rate.profit.toFixed(5)},${rate.profitMarginPercent.toFixed(2)}`
    ).join('\n');

    const blob = new Blob([csvHeaders + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const selectedPlan = tariffPlans.find(p => p.id === selectedPlanId);
    link.setAttribute('href', url);
    link.setAttribute('download', `rates_${selectedPlan?.name || 'export'}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Rates exported successfully!');
  };

  const handleUploadBaseRates = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    const loadingToast = toast.loading('Uploading base rates...');
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/api/rates/upload-base-rates`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success(`Successfully imported ${response.data.imported} base rates!`, { id: loadingToast });

      // Refresh rates if a plan is selected
      if (selectedPlanId) {
        fetchConfiguredRates(selectedPlanId);
      }
    } catch (error) {
      console.error('Failed to upload base rates:', error);
      toast.error(error.response?.data?.error || 'Failed to upload base rates', { id: loadingToast });
    }

    // Reset file input
    e.target.value = '';
  };

  // Filter rates based on search
  const filteredRates = configuredRates.filter(rate =>
    rate.destinationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rate.code.includes(searchQuery)
  );

  // Calculate summary statistics
  const totalProfit = configuredRates.reduce((sum, rate) => sum + rate.profit, 0);
  const avgProfit = configuredRates.length > 0 ? totalProfit / configuredRates.length : 0;
  const avgProfitPercent = configuredRates.length > 0
    ? configuredRates.reduce((sum, rate) => sum + rate.profitMarginPercent, 0) / configuredRates.length
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  const selectedPlan = tariffPlans.find(p => p.id === selectedPlanId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Rate Configuration</h1>
          <p className="text-slate-400">
            Configure and preview sell rates based on tariff plans
          </p>
        </div>
        <div className="flex gap-3">
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".csv"
              onChange={handleUploadBaseRates}
              className="hidden"
            />
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700 transition-colors">
              <Upload className="w-4 h-4" />
              Upload Base Rates
            </div>
          </label>
          <button
            onClick={() => setShowNewPlanModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 text-white rounded-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            Add New Rate List
          </button>
        </div>
      </div>

      {/* Plan Selector & Summary Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Plan Selector */}
        <Card className="lg:col-span-2">
          <div className="space-y-4">
            <label className="block text-sm font-medium text-slate-300">
              Choose Rate List
            </label>
            <select
              value={selectedPlanId || ''}
              onChange={(e) => setSelectedPlanId(Number(e.target.value))}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-600"
            >
              <option value="" disabled>Select a tariff plan...</option>
              {tariffPlans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name}
                  {plan.type === 0 && ` (${plan.profitPercent}% Profit)`}
                  {plan.type === 1 && ` (Fixed $${plan.fixedProfit})`}
                  {plan.type === 2 && ' (Free)'}
                </option>
              ))}
            </select>

            {selectedPlan && (
              <div className="mt-4 p-4 bg-slate-900/50 rounded-lg border border-slate-800">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-violet-400 mt-0.5 flex-shrink-0" />
                  <div className="space-y-2 text-sm">
                    <p className="text-slate-300">
                      <span className="font-semibold">Type:</span>{' '}
                      {selectedPlan.type === 0 ? 'Percentage-based' : selectedPlan.type === 1 ? 'Fixed Amount' : 'Free'}
                    </p>
                    {selectedPlan.type === 0 && (
                      <p className="text-slate-300">
                        <span className="font-semibold">Profit Margin:</span> {selectedPlan.profitPercent}%
                      </p>
                    )}
                    {selectedPlan.type === 1 && (
                      <p className="text-slate-300">
                        <span className="font-semibold">Fixed Profit:</span> ${selectedPlan.fixedProfit.toFixed(5)}/min
                      </p>
                    )}
                    <p className="text-slate-300">
                      <span className="font-semibold">Min/Max Profit:</span>{' '}
                      ${selectedPlan.minProfit.toFixed(5)} - ${selectedPlan.maxProfit.toFixed(5)}
                    </p>
                    <p className="text-slate-300">
                      <span className="font-semibold">Billing:</span> Per {selectedPlan.chargingIntervalSeconds}s
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Summary Stats */}
        <Card>
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-slate-300">Summary Statistics</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">Total Destinations</span>
                <span className="text-white font-semibold">{configuredRates.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">Avg. Profit/min</span>
                <span className="text-green-400 font-semibold">${avgProfit.toFixed(5)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-sm">Avg. Margin</span>
                <span className="text-violet-400 font-semibold">{avgProfitPercent.toFixed(2)}%</span>
              </div>
            </div>
            <button
              onClick={handleExportRates}
              disabled={configuredRates.length === 0}
              className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 disabled:text-slate-600 text-white rounded-lg border border-slate-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export to CSV
            </button>
          </div>
        </Card>
      </div>

      {/* Rates Table */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Rate Simulation</h3>
            <input
              type="text"
              placeholder="Search destination or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-600"
            />
          </div>

          {loadingRates ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
            </div>
          ) : filteredRates.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Calculator className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                {searchQuery ? 'No rates match your search' : 'No rates available. Upload base rates to get started.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-900/50 border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Destination
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Buy Rate
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Sell Rate
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Profit
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Margin %
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredRates.slice(0, 50).map((rate, index) => (
                    <tr key={index} className="hover:bg-slate-900/30 transition-colors">
                      <td className="px-4 py-3 text-sm text-white">{rate.destinationName}</td>
                      <td className="px-4 py-3 text-sm text-slate-400">{rate.code}</td>
                      <td className="px-4 py-3 text-sm text-slate-300 text-right font-mono">
                        ${rate.buyPrice.toFixed(5)}
                      </td>
                      <td className="px-4 py-3 text-sm text-white text-right font-mono font-semibold">
                        ${rate.sellPrice.toFixed(5)}
                      </td>
                      <td className="px-4 py-3 text-sm text-green-400 text-right font-mono">
                        ${rate.profit.toFixed(5)}
                      </td>
                      <td className="px-4 py-3 text-sm text-violet-400 text-right font-mono">
                        {rate.profitMarginPercent.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredRates.length > 50 && (
                <div className="text-center py-4 text-sm text-slate-500">
                  Showing 50 of {filteredRates.length} rates
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* New Plan Modal */}
      {showNewPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-800 bg-gradient-to-r from-violet-600 to-purple-700">
              <h2 className="text-2xl font-bold text-white">Create New Tariff Plan</h2>
              <p className="text-violet-100 text-sm mt-1">Define custom pricing rules for your rates</p>
            </div>

            <form onSubmit={handleCreatePlan} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Plan Name</label>
                <input
                  type="text"
                  required
                  value={newPlan.name}
                  onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-600"
                  placeholder="e.g., Premium 15%"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Pricing Type</label>
                <select
                  value={newPlan.type}
                  onChange={(e) => setNewPlan({ ...newPlan, type: Number(e.target.value) })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-600"
                >
                  <option value={0}>Percentage-based</option>
                  <option value={1}>Fixed Amount</option>
                  <option value={2}>Free (No Charge)</option>
                </select>
              </div>

              {newPlan.type === 0 && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Profit Percentage (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newPlan.profitPercent}
                    onChange={(e) => setNewPlan({ ...newPlan, profitPercent: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-600"
                  />
                </div>
              )}

              {newPlan.type === 1 && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Fixed Profit per Minute ($)</label>
                  <input
                    type="number"
                    step="0.00001"
                    min="0"
                    value={newPlan.fixedProfit}
                    onChange={(e) => setNewPlan({ ...newPlan, fixedProfit: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-600"
                  />
                </div>
              )}

              {newPlan.type !== 2 && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Min Profit ($)</label>
                      <input
                        type="number"
                        step="0.00001"
                        min="0"
                        value={newPlan.minProfit}
                        onChange={(e) => setNewPlan({ ...newPlan, minProfit: parseFloat(e.target.value) })}
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Max Profit ($)</label>
                      <input
                        type="number"
                        step="0.00001"
                        min="0"
                        value={newPlan.maxProfit}
                        onChange={(e) => setNewPlan({ ...newPlan, maxProfit: parseFloat(e.target.value) })}
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Precision (Decimals)</label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={newPlan.precision}
                        onChange={(e) => setNewPlan({ ...newPlan, precision: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-600"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Charging Per (seconds)</label>
                      <input
                        type="number"
                        min="1"
                        value={newPlan.chargingIntervalSeconds}
                        onChange={(e) => setNewPlan({ ...newPlan, chargingIntervalSeconds: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-600"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewPlanModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg border border-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 text-white rounded-lg transition-all"
                >
                  Create Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RatesConfigure;
