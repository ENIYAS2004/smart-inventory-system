import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import {
  ArrowLeftRight,
  Plus,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  AlertTriangle,
  User as UserIcon,
  Calendar,
  Building,
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';

export const Circulation: React.FC = () => {
  const [activeLoans, setActiveLoans] = useState<any[]>([]);
  const [usageHistory, setUsageHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [checkinModalOpen, setCheckinModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);

  // Available assets for checkout
  const [availableAssets, setAvailableAssets] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);

  // Checkout Form
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [purpose, setPurpose] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [checkoutNotes, setCheckoutNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Checkin Form
  const [conditionAfter, setConditionAfter] = useState('Good');
  const [checkinNotes, setCheckinNotes] = useState('');

  const fetchCirculationData = async () => {
    try {
      setLoading(true);
      const [loansRes, historyRes, assetsRes, usersRes] = await Promise.all([
        api.get('/usage', { params: { action: 'CHECK_OUT', status: 'ACTIVE', limit: 50 } }),
        api.get('/usage', { params: { limit: 50 } }),
        api.get('/assets', { params: { status: 'Available', limit: 100 } }),
        api.get('/users'),
      ]);

      if (loansRes.data.success) setActiveLoans(loansRes.data.records || []);
      if (historyRes.data.success) setUsageHistory(historyRes.data.records || []);
      if (assetsRes.data.success) setAvailableAssets(assetsRes.data.assets || []);
      if (usersRes.data.success) setUsersList(usersRes.data.users || []);
    } catch (err) {
      console.error('Error fetching circulation data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCirculationData();
  }, []);

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId || !purpose) {
      setFormError('Please select an asset and state the purpose of checkout.');
      return;
    }
    setSubmitting(true);
    setFormError(null);

    try {
      const res = await api.post('/usage/checkout', {
        assetId: selectedAssetId,
        userId: selectedUserId || undefined,
        purpose,
        expectedReturnDate,
        notes: checkoutNotes,
      });

      if (res.data.success) {
        setCheckoutModalOpen(false);
        setSelectedAssetId('');
        setPurpose('');
        setExpectedReturnDate('');
        setCheckoutNotes('');
        fetchCirculationData();
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Check-out transaction failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const openCheckinModal = (loanRecord: any) => {
    setSelectedAsset(loanRecord.asset);
    setConditionAfter('Good');
    setCheckinNotes('');
    setCheckinModalOpen(true);
  };

  const handleCheckinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;
    setSubmitting(true);

    try {
      const res = await api.post('/usage/checkin', {
        assetId: selectedAsset._id,
        conditionAfter,
        notes: checkinNotes,
      });

      if (res.data.success) {
        setCheckinModalOpen(false);
        fetchCirculationData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Check-in failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Equipment Circulation Desk
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage student & staff equipment borrowing, temporary lab loans, and item check-in returns.
          </p>
        </div>

        <button
          onClick={() => {
            setFormError(null);
            setCheckoutModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md shadow-2xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Check-Out Loan</span>
        </button>
      </div>

      {/* Active Loans Section */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Active Loans & Equipment in Use ({activeLoans.length})
            </h2>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Currently borrowed by personnel</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">Checking circulation ledger...</div>
        ) : activeLoans.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No equipment is currently issued or checked out. All assets are safely stored in their designated labs.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider bg-slate-50/40">
                  <th className="py-3 px-4">Asset Tag / Equipment</th>
                  <th className="py-3 px-4">Borrower / Staff</th>
                  <th className="py-3 px-4">Issued On</th>
                  <th className="py-3 px-4">Expected Return</th>
                  <th className="py-3 px-4">Purpose / Practical</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeLoans.map((loan) => {
                  const isOverdue =
                    loan.expectedReturnDate && new Date(loan.expectedReturnDate) < new Date();
                  return (
                    <tr key={loan._id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4">
                        <Link
                          to={`/assets/${loan.asset?._id}`}
                          className="font-semibold text-slate-900 hover:text-indigo-600 block"
                        >
                          {loan.asset?.name}
                        </Link>
                        <span className="text-[10px] font-mono text-slate-400">{loan.asset?.assetId}</span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">{loan.user?.name}</div>
                        <div className="text-[10px] text-slate-400">{loan.user?.designation}</div>
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-600">
                        {new Date(loan.checkOutDate || loan.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-3 px-4">
                        {loan.expectedReturnDate ? (
                          <span
                            className={`font-mono font-medium ${
                              isOverdue ? 'text-rose-600 font-bold' : 'text-slate-700'
                            }`}
                          >
                            {new Date(loan.expectedReturnDate).toLocaleDateString()}
                            {isOverdue && (
                              <span className="block text-[10px] text-rose-600 font-sans font-semibold">
                                OVERDUE
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-slate-400">Open-ended</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                        {loan.purpose || 'Laboratory assignment'}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => openCheckinModal(loan)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded text-xs font-medium transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Return / Check-In</span>
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

      {/* Circulation History / Audit Timeline */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Circulation Activity Log & History
          </h2>
        </div>

        <div className="p-5">
          {usageHistory.length === 0 ? (
            <div className="text-center text-xs text-slate-400 py-6">No historical records logged yet.</div>
          ) : (
            <div className="space-y-3">
              {usageHistory.slice(0, 15).map((item) => (
                <div key={item._id} className="p-3 border border-slate-100 rounded-md text-xs hover:bg-slate-50/60 flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="text-slate-800">
                        <strong className="text-slate-900">{item.user?.name || 'Staff Member'}</strong>{' '}
                        performed <span className="font-mono px-1.5 py-0.5 bg-slate-100 rounded text-[11px] font-semibold">{item.action}</span> on{' '}
                        <strong className="text-indigo-600">{item.asset?.name || 'Asset'}</strong>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="text-slate-500 mt-1">
                      {item.purpose && <span>Purpose: {item.purpose}</span>}
                      {item.conditionAfter && (
                        <span className="ml-2 font-medium">Condition verified: {item.conditionAfter}</span>
                      )}
                      {item.notes && <span className="ml-2 italic text-slate-400">({item.notes})</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* New Check Out Modal */}
      {checkoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-lg w-full p-5 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Issue Asset / Check Out</h3>
            <p className="text-xs text-slate-500">
              Select an available piece of equipment from the catalog and assign it to authorized staff or a practical session.
            </p>

            {formError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded">
                {formError}
              </div>
            )}

            <form onSubmit={handleCheckoutSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Select Available Asset <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">-- Choose an Available Asset --</option>
                  {availableAssets.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.assetId} - {a.name} ({a.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Issued To (Faculty / Technician)
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Current Authenticated User (Self)</option>
                  {usersList.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.designation} - {u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Purpose / Class / Project <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Signal Processing Lab Experiment, Batch C"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Expected Return Date
                </label>
                <input
                  type="date"
                  value={expectedReturnDate}
                  onChange={(e) => setExpectedReturnDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Special Instructions / Accessories
                </label>
                <textarea
                  rows={2}
                  placeholder="Includes power adapter, probes, user manual..."
                  value={checkoutNotes}
                  onChange={(e) => setCheckoutNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCheckoutModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Processing...' : 'Authorize Check-Out'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Check In Modal */}
      {checkinModalOpen && selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Check In: {selectedAsset.name}</h3>
            <p className="text-xs text-slate-500">
              Verify device integrity before updating catalog status to Available.
            </p>

            <form onSubmit={handleCheckinSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Condition Upon Return
                </label>
                <select
                  value={conditionAfter}
                  onChange={(e) => setConditionAfter(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor (Flags for technician check)</option>
                  <option value="Critical">Critical (Damaged during loan)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Inspection Comments
                </label>
                <textarea
                  rows={2}
                  placeholder="Device powered on, cleaned and restored to shelf..."
                  value={checkinNotes}
                  onChange={(e) => setCheckinNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCheckinModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Recording...' : 'Confirm Return'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
