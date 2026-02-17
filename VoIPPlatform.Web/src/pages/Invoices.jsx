import { useState, useEffect } from 'react';
import { FileText, Download, CheckCircle, Clock, AlertCircle, XCircle, DollarSign, Loader2 } from 'lucide-react';
import { invoicesAPI } from '../services/api';

// ── Status helpers ────────────────────────────────────────────────────────────

const STATUS_MAP = {
  0: { label: 'Draft',    color: 'bg-slate-700 text-slate-300',   icon: Clock },
  1: { label: 'Unpaid',   color: 'bg-amber-500/20 text-amber-400', icon: AlertCircle },
  2: { label: 'Paid',     color: 'bg-emerald-500/20 text-emerald-400', icon: CheckCircle },
  3: { label: 'Overdue',  color: 'bg-red-500/20 text-red-400',    icon: AlertCircle },
  4: { label: 'Cancelled',color: 'bg-slate-600/40 text-slate-400', icon: XCircle },
};

const getStatus = (status) => STATUS_MAP[status] ?? STATUS_MAP[0];

const fmt = (n) => `$${Number(n).toFixed(5)}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// ── Component ─────────────────────────────────────────────────────────────────

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await invoicesAPI.getAll();
      setInvoices(res.data);
    } catch (err) {
      setError('Failed to load invoices. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (id) => {
    setDownloadingId(id);
    try {
      await invoicesAPI.downloadPdf(id);
    } catch {
      setError(`Failed to download Invoice_${id}.pdf. Please try again.`);
    } finally {
      setDownloadingId(null);
    }
  };

  // ── Derived stats ────────────────────────────────────────────────────────────
  const totalPaid = invoices
    .filter((inv) => inv.status === 2)
    .reduce((sum, inv) => sum + Number(inv.totalAmount), 0);

  const totalPending = invoices
    .filter((inv) => inv.status === 1 || inv.status === 3)
    .reduce((sum, inv) => sum + Number(inv.totalAmount), 0);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-violet-600/20 rounded-lg flex items-center justify-center">
          <FileText className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">My Invoices</h1>
          <p className="text-sm text-slate-400">View and download your billing invoices</p>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-300">✕</button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider">Total Paid</p>
            <p className="text-2xl font-bold text-white mt-0.5">{fmt(totalPaid)}</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-500/10 rounded-lg flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider">Pending Amount</p>
            <p className="text-2xl font-bold text-white mt-0.5">{fmt(totalPending)}</p>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-semibold text-white">Invoice History</h2>
          <span className="text-xs text-slate-400">{invoices.length} invoice{invoices.length !== 1 ? 's' : ''}</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading invoices…</span>
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-500">
            <FileText className="w-12 h-12 opacity-30" />
            <p className="text-sm">No invoices yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left">
                  <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Invoice #</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Period</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {invoices.map((inv) => {
                  const status = getStatus(inv.status);
                  const StatusIcon = status.icon;
                  const isDownloading = downloadingId === inv.id;

                  return (
                    <tr key={inv.id} className="hover:bg-slate-800/50 transition-colors">
                      {/* Invoice # */}
                      <td className="px-6 py-4 font-mono font-semibold text-violet-400">
                        INV-{inv.id}
                      </td>

                      {/* Date */}
                      <td className="px-6 py-4 text-slate-300">
                        {fmtDate(inv.createdAt)}
                      </td>

                      {/* Period */}
                      <td className="px-6 py-4 text-slate-400 text-xs">
                        {fmtDate(inv.periodStart)} – {fmtDate(inv.periodEnd)}
                      </td>

                      {/* Due Date */}
                      <td className="px-6 py-4 text-slate-300">
                        {fmtDate(inv.dueDate)}
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-4 font-semibold text-white">
                        {fmt(inv.totalAmount)}
                      </td>

                      {/* Status Badge */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleDownload(inv.id)}
                          disabled={isDownloading}
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-medium rounded-lg transition-colors"
                        >
                          {isDownloading
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Download className="w-3.5 h-3.5" />}
                          {isDownloading ? 'Generating…' : 'Download PDF'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Invoices;
