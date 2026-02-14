import React, { useState, useEffect } from 'react';
import { CreditCard, Download, Check, Clock, AlertCircle, DollarSign, MapPin, FileText } from 'lucide-react';
import api from '../services/api';
import StripePaymentModal from '../components/StripePaymentModal';

const Billing = () => {
  // State
  const [balance, setBalance] = useState(0);
  const [currency, setCurrency] = useState('USD');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [payments, setPayments] = useState([]);
  const [billingInfo, setBillingInfo] = useState({
    country: '',
    taxRegistrationNumber: '',
    address: '',
    city: '',
    postalCode: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch balance, payment history, and billing info in parallel
      const [balanceRes, historyRes, billingRes] = await Promise.all([
        api.get('/payments/wallet/balance'),
        api.get('/payments/history'),
        api.get('/payments/billing-info')
      ]);

      setBalance(balanceRes.data.balance);
      setCurrency(balanceRes.data.currency);
      setLastUpdated(balanceRes.data.lastUpdated);
      setPayments(historyRes.data);
      setBillingInfo(billingRes.data);
    } catch (err) {
      console.error('Error fetching billing data:', err);
      setError('Failed to load billing data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBillingInfoChange = (e) => {
    const { name, value } = e.target;
    setBillingInfo(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveBillingInfo = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await api.put('/payments/billing-info', billingInfo);
      setSuccessMessage('Billing information updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error saving billing info:', err);
      setError('Failed to update billing information. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadInvoice = async (paymentId, invoiceNumber) => {
    try {
      const response = await api.get(`/payments/${paymentId}/invoice.pdf`, {
        responseType: 'blob'
      });

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading invoice:', err);
      alert('Failed to download invoice. Please try again.');
    }
  };

  const handlePaymentSuccess = () => {
    // Refresh billing data after successful payment
    setSuccessMessage('Payment processed successfully! Your wallet has been updated.');
    setTimeout(() => setSuccessMessage(null), 5000);
    fetchBillingData();
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading billing data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <CreditCard className="w-8 h-8 text-blue-600" />
              Billing & Payments
            </h1>
            <p className="text-gray-600 mt-1">Manage your wallet, payments, and billing information</p>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
            <Check className="w-5 h-5" />
            {successMessage}
          </div>
        )}

        {/* Balance Card - Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-8 text-white shadow-2xl">
          {/* Decorative Background */}
          <div className="absolute top-0 right-0 -mt-4 -mr-4 h-40 w-40 rounded-full bg-white/10 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-32 w-32 rounded-full bg-white/10 blur-2xl"></div>

          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium mb-2 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Current Balance
                </p>
                <h2 className="text-5xl font-bold mb-1">
                  ${balance.toFixed(2)}
                </h2>
                <p className="text-blue-200 text-sm">
                  Currency: {currency}
                </p>
                {lastUpdated && (
                  <p className="text-blue-300 text-xs mt-2">
                    Last updated: {new Date(lastUpdated).toLocaleString()}
                  </p>
                )}
              </div>
              <div className="hidden md:block">
                <div className="h-24 w-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <CreditCard className="w-12 h-12 text-white" />
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowPaymentModal(true)}
                className="bg-white text-blue-700 px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl"
              >
                Top Up Wallet
              </button>
              <button
                onClick={fetchBillingData}
                className="bg-white/10 backdrop-blur-sm text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-white/20 transition-all border border-white/20"
              >
                Refresh Balance
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Billing Profile Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center gap-2 mb-6">
                <MapPin className="w-5 h-5 text-blue-600" />
                <h3 className="text-xl font-bold text-gray-900">Billing Profile</h3>
              </div>

              <form onSubmit={handleSaveBillingInfo} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={billingInfo.country || ''}
                    onChange={handleBillingInfoChange}
                    placeholder="e.g., SE, US, DE"
                    className="w-full px-4 py-2 font-semibold text-gray-900 placeholder:text-gray-400 placeholder:font-normal border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    maxLength="2"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">ISO Alpha-2 code (SE for Sweden)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tax Registration Number
                  </label>
                  <input
                    type="text"
                    name="taxRegistrationNumber"
                    value={billingInfo.taxRegistrationNumber || ''}
                    onChange={handleBillingInfoChange}
                    placeholder="e.g., SE123456789001"
                    className="w-full px-4 py-2 font-semibold text-gray-900 placeholder:text-gray-400 placeholder:font-normal border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <p className="text-xs text-gray-500 mt-1">VAT ID for business customers</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={billingInfo.address || ''}
                    onChange={handleBillingInfoChange}
                    placeholder="Street address"
                    className="w-full px-4 py-2 font-semibold text-gray-900 placeholder:text-gray-400 placeholder:font-normal border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={billingInfo.city || ''}
                    onChange={handleBillingInfoChange}
                    placeholder="City name"
                    className="w-full px-4 py-2 font-semibold text-gray-900 placeholder:text-gray-400 placeholder:font-normal border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    name="postalCode"
                    value={billingInfo.postalCode || ''}
                    onChange={handleBillingInfoChange}
                    placeholder="Postal/ZIP code"
                    className="w-full px-4 py-2 font-semibold text-gray-900 placeholder:text-gray-400 placeholder:font-normal border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-blue-600 text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Billing Info'}
                </button>
              </form>

              {/* Tax Info Notice */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Tax Calculation:</strong> Your country and tax ID determine VAT rates.
                  Sweden: 25% VAT. EU B2B: 0% (Reverse Charge). International: 0% (Export).
                </p>
              </div>
            </div>
          </div>

          {/* Transaction History */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h3 className="text-xl font-bold text-gray-900">Transaction History</h3>
                </div>
                <p className="text-sm text-gray-600 mt-1">All top-up payments and invoices</p>
              </div>

              <div className="overflow-x-auto">
                {payments.length === 0 ? (
                  <div className="p-12 text-center">
                    <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No payment history yet</p>
                    <p className="text-sm text-gray-500 mt-1">Top up your wallet to get started</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Invoice #
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Tax
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Total Paid
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                          Invoice
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {payments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(payment.transactionDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-mono text-blue-600 font-medium">
                              {payment.invoiceNumber}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                            ${payment.amount.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">
                            ${payment.taxAmount.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                            ${payment.totalPaid.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(payment.status)}`}>
                              {getStatusIcon(payment.status)}
                              {payment.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {payment.invoicePdfPath ? (
                              <button
                                onClick={() => handleDownloadInvoice(payment.id, payment.invoiceNumber)}
                                className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
                              >
                                <Download className="w-4 h-4" />
                                PDF
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400">N/A</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Summary Footer */}
              {payments.length > 0 && (
                <div className="p-4 bg-gray-50 border-t border-gray-200">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">
                      Total Transactions: <strong>{payments.length}</strong>
                    </span>
                    <span className="text-gray-600">
                      Total Paid: <strong className="text-blue-600">
                        ${payments.reduce((sum, p) => sum + p.totalPaid, 0).toFixed(2)}
                      </strong>
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stripe Payment Modal */}
      <StripePaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  );
};

export default Billing;
