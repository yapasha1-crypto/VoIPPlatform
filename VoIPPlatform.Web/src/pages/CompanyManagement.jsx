import { useState, useEffect } from 'react';
import { usersAPI } from '../services/api';
import { Building2, Users, Activity, DollarSign, Gauge, TrendingUp, Search, Plus } from 'lucide-react';
import Card from '../components/ui/Card';
import AddCompanyModal from '../components/modals/AddCompanyModal';
import toast from 'react-hot-toast';

const CompanyManagement = () => {
  const [companies, setCompanies] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = companies.filter(
        (company) =>
          company.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          company.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          company.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCompanies(filtered);
    } else {
      setFilteredCompanies(companies);
    }
  }, [searchTerm, companies]);

  const fetchCompanies = async () => {
    try {
      const response = await usersAPI.getAll();
      // Handle 204 No Content (empty response)
      if (response.status === 204 || !response.data) {
        setCompanies([]);
        setFilteredCompanies([]);
        setLoading(false);
        return;
      }
      if (response.data.success) {
        // Filter only Company role users
        const companyUsers = response.data.data.filter((user) => user.role === 'Company');
        setCompanies(companyUsers);
        setFilteredCompanies(companyUsers);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch companies:', error);
      toast.error('Failed to load companies');
      setLoading(false);
    }
  };

  const getStatusColor = (isActive) => {
    return isActive
      ? 'bg-green-500/20 text-green-400 border-green-500/50'
      : 'bg-red-500/20 text-red-400 border-red-500/50';
  };

  const getChannelUtilizationColor = (active, max) => {
    if (max === 0) return 'text-slate-500';
    const percentage = (active / max) * 100;
    if (percentage >= 90) return 'text-red-400';
    if (percentage >= 70) return 'text-orange-400';
    if (percentage >= 50) return 'text-yellow-400';
    return 'text-green-400';
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
          <h1 className="text-3xl font-bold text-white mb-2">Company Management</h1>
          <p className="text-slate-400">
            Managing {companies.length} {companies.length === 1 ? 'company' : 'companies'}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-700 text-white rounded-lg hover:from-violet-700 hover:to-purple-800 transition-all shadow-lg shadow-violet-900/50"
        >
          <Plus className="w-5 h-5" />
          <span>Add Company</span>
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="hover:scale-105 transition-transform duration-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-slate-400 mb-1">Total Companies</p>
              <p className="text-3xl font-bold text-white mb-1">{companies.length}</p>
              <p className="text-xs text-slate-500">Active organizations</p>
            </div>
            <div className="p-3 bg-violet-900/20 rounded-lg">
              <Building2 className="w-6 h-6 text-violet-400" />
            </div>
          </div>
        </Card>

        <Card className="hover:scale-105 transition-transform duration-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-slate-400 mb-1">Total Users</p>
              <p className="text-3xl font-bold text-white mb-1">
                {companies.reduce((sum, c) => sum + (c.childUserCount || 0), 0)}
              </p>
              <p className="text-xs text-slate-500">Across all companies</p>
            </div>
            <div className="p-3 bg-blue-900/20 rounded-lg">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="hover:scale-105 transition-transform duration-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-slate-400 mb-1">Total Channels</p>
              <p className="text-3xl font-bold text-white mb-1">
                {companies.reduce((sum, c) => sum + (c.maxConcurrentCalls || 0), 0)}
              </p>
              <p className="text-xs text-slate-500">Channel capacity</p>
            </div>
            <div className="p-3 bg-emerald-900/20 rounded-lg">
              <Gauge className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
        </Card>

        <Card className="hover:scale-105 transition-transform duration-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-slate-400 mb-1">Active Calls</p>
              <p className="text-3xl font-bold text-white mb-1">
                {companies.reduce((sum, c) => sum + (c.activeCalls || 0), 0)}
              </p>
              <p className="text-xs text-slate-500">In progress now</p>
            </div>
            <div className="p-3 bg-orange-900/20 rounded-lg">
              <Activity className="w-6 h-6 text-orange-400" />
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
            placeholder="Search companies by name, email, or username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          />
        </div>
      </Card>

      {/* Companies Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-4 px-4 text-sm font-semibold text-slate-300">Company</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-slate-300">Status</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-slate-300">Channels</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-slate-300">Users</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-slate-300">Balance</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-slate-300">Billing</th>
                <th className="text-left py-4 px-4 text-sm font-semibold text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12">
                    <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                    <p className="text-slate-400">
                      {searchTerm ? 'No companies found matching your search' : 'No companies yet'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCompanies.map((company) => (
                  <tr key={company.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                    {/* Company Info */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-purple-700 rounded-lg flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{company.fullName || company.username}</p>
                          <p className="text-xs text-slate-400">{company.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                          company.isActive
                        )}`}
                      >
                        {company.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* Channels */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Activity
                          className={`w-4 h-4 ${getChannelUtilizationColor(
                            company.activeCalls || 0,
                            company.maxConcurrentCalls || 0
                          )}`}
                        />
                        <span className="text-white font-medium">
                          {company.activeCalls || 0}/{company.maxConcurrentCalls || 0}
                        </span>
                      </div>
                    </td>

                    {/* Users */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-400" />
                        <span className="text-white">{company.childUserCount || 0}</span>
                      </div>
                    </td>

                    {/* Balance */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-400" />
                        <span className="text-white font-medium">
                          ${(company.accountBalance || 0).toFixed(2)}
                        </span>
                      </div>
                    </td>

                    {/* Billing */}
                    <td className="py-4 px-4">
                      <div className="text-sm">
                        <p className="text-white">{company.billingType || 'N/A'}</p>
                        <p className="text-xs text-slate-400">
                          ${(company.channelRate || 0).toFixed(2)}/mo
                        </p>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4">
                      <button className="text-violet-400 hover:text-violet-300 text-sm font-medium transition-colors">
                        Manage
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Company Modal */}
      <AddCompanyModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchCompanies}
      />
    </div>
  );
};

export default CompanyManagement;
