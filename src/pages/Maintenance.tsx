import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import {
  Wrench,
  Plus,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Search,
  Filter,
  DollarSign,
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';

export const Maintenance: React.FC = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Schedule Modal
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [assetsList, setAssetsList] = useState<any[]>([]);

  // Schedule Form
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [maintType, setMaintType] = useState('Preventive');
  const [dueDate, setDueDate] = useState('');
  const [technician, setTechnician] = useState('');
  const [cost, setCost] = useState('0');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Complete Service Modal
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [activeTicket, setActiveTicket] = useState<any>(null);
  const [finalCost, setFinalCost] = useState('0');
  const [finalCondition, setFinalCondition] = useState('Good');
  const [completionNotes, setCompletionNotes] = useState('');

  const fetchMaintenance = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;

      const [maintRes, assetsRes] = await Promise.all([
        api.get('/maintenance', { params }),
        api.get('/assets', { params: { limit: 150 } }),
      ]);

      if (maintRes.data.success) setRecords(maintRes.data.records || []);
      if (assetsRes.data.success) setAssetsList(assetsRes.data.assets || []);
    } catch (err) {
      console.error('Error fetching maintenance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaintenance();
  }, [statusFilter, priorityFilter]);

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId || !dueDate || !technician || !description) {
      setFormError('Please fill in all mandatory ticket fields.');
      return;
    }
    setSubmitting(true);
    setFormError(null);

    try {
      const res = await api.post('/maintenance', {
        assetId: selectedAssetId,
        maintenanceType: maintType,
        dueDate,
        technician,
        cost,
        description,
        priority,
        notes,
      });

      if (res.data.success) {
        setScheduleModalOpen(false);
        setSelectedAssetId('');
        setDescription('');
        setTechnician('');
        fetchMaintenance();
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to schedule maintenance.');
    } finally {
      setSubmitting(false);
    }
  };

  const openCompleteModal = (ticket: any) => {
    setActiveTicket(ticket);
    setFinalCost(String(ticket.cost || 0));
    setFinalCondition('Good');
    setCompletionNotes('');
    setCompleteModalOpen(true);
  };

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket) return;
    setSubmitting(true);

    try {
      const res = await api.post(`/maintenance/${activeTicket._id}/complete`, {
        cost: finalCost,
        finalCondition,
        notes: completionNotes,
      });

      if (res.data.success) {
        setCompleteModalOpen(false);
        fetchMaintenance();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to complete maintenance');
    } finally {
      setSubmitting(false);
    }
  };

  const scheduledCount = records.filter((r) => r.status === 'Scheduled').length;
  const inProgressCount = records.filter((r) => r.status === 'In Progress').length;
  const overdueCount = records.filter((r) => r.status === 'Overdue').length;
  const completedCount = records.filter((r) => r.status === 'Completed').length;

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Maintenance & Equipment Servicing</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log preventive calibration, vendor repair contracts, and breakdown tickets.
          </p>
        </div>

        <button
          onClick={() => {
            setFormError(null);
            setScheduleModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md shadow-2xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Schedule Service Ticket</span>
        </button>
      </div>

      {/* Status Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div
          onClick={() => setStatusFilter(statusFilter === 'Scheduled' ? '' : 'Scheduled')}
          className={`bg-white border rounded-lg p-3.5 cursor-pointer transition-all ${
            statusFilter === 'Scheduled' ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Scheduled</div>
          <div className="mt-1 text-2xl font-bold text-slate-900 font-mono">{scheduledCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Awaiting technician arrival</div>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === 'In Progress' ? '' : 'In Progress')}
          className={`bg-white border rounded-lg p-3.5 cursor-pointer transition-all ${
            statusFilter === 'In Progress' ? 'border-amber-600 ring-2 ring-amber-100' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">In Progress</div>
          <div className="mt-1 text-2xl font-bold text-amber-600 font-mono">{inProgressCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Currently on bench / workshop</div>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === 'Overdue' ? '' : 'Overdue')}
          className={`bg-white border rounded-lg p-3.5 cursor-pointer transition-all ${
            statusFilter === 'Overdue' ? 'border-rose-600 ring-2 ring-rose-100' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] font-semibold text-rose-600 uppercase tracking-wider">Overdue Service</div>
          <div className="mt-1 text-2xl font-bold text-rose-600 font-mono">{overdueCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Past target service date</div>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === 'Completed' ? '' : 'Completed')}
          className={`bg-white border rounded-lg p-3.5 cursor-pointer transition-all ${
            statusFilter === 'Completed' ? 'border-emerald-600 ring-2 ring-emerald-100' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Completed</div>
          <div className="mt-1 text-2xl font-bold text-emerald-600 font-mono">{completedCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Restored to lab service</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Filters:</span>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-300 rounded text-xs"
          >
            <option value="">All Statuses</option>
            <option value="Scheduled">Scheduled</option>
            <option value="In Progress">In Progress</option>
            <option value="Overdue">Overdue</option>
            <option value="Completed">Completed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-2.5 py-1.5 border border-slate-300 rounded text-xs"
          >
            <option value="">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>

        {(statusFilter || priorityFilter) && (
          <button
            onClick={() => {
              setStatusFilter('');
              setPriorityFilter('');
            }}
            className="text-xs text-indigo-600 hover:underline font-medium"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Maintenance Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-500">Retrieving service tickets...</div>
        ) : records.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No service records matching the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Asset Under Service</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Technician / Agency</th>
                  <th className="py-3 px-4">Cost (INR)</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((ticket) => (
                  <tr key={ticket._id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4">
                      <Link
                        to={`/assets/${ticket.asset?._id}`}
                        className="font-semibold text-slate-900 hover:text-indigo-600 block"
                      >
                        {ticket.asset?.name || 'Asset'}
                      </Link>
                      <span className="text-[10px] font-mono text-slate-400">
                        {ticket.asset?.assetId} • {ticket.asset?.department?.code}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-700">{ticket.maintenanceType}</td>

                    <td className="py-3 px-4">
                      <StatusBadge status={ticket.priority} type="priority" />
                    </td>

                    <td className="py-3 px-4">
                      <StatusBadge status={ticket.status} type="status" />
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-700">
                      {new Date(ticket.dueDate).toLocaleDateString()}
                    </td>

                    <td className="py-3 px-4 text-slate-800 font-medium">
                      {ticket.technician}
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-900">
                      ₹{ticket.cost ? ticket.cost.toLocaleString() : '0'}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {ticket.status !== 'Completed' ? (
                        <button
                          onClick={() => openCompleteModal(ticket)}
                          className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded text-xs font-semibold transition-colors"
                        >
                          Complete Service
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-mono">
                          Completed {ticket.completedDate ? new Date(ticket.completedDate).toLocaleDateString() : ''}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Schedule Maintenance Modal */}
      {scheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-lg w-full p-5 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Schedule Asset Maintenance</h3>
            <p className="text-xs text-slate-500">
              Create a formal service ticket. The asset's registry status will be updated to "Under Maintenance".
            </p>

            {formError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded">
                {formError}
              </div>
            )}

            <form onSubmit={handleScheduleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Select Asset <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">-- Choose Asset to Service --</option>
                  {assetsList.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.assetId} - {a.name} ({a.department?.name || 'Store'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Service Type</label>
                  <select
                    value={maintType}
                    onChange={(e) => setMaintType(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs"
                  >
                    <option value="Preventive">Preventive Calibration</option>
                    <option value="Corrective">Corrective Repair</option>
                    <option value="Emergency">Emergency Breakdown</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical (Immediate Service)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Target Completion Due Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Estimated Cost (INR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Assigned Technician / Vendor Agency <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Er. Rajesh Kumar / Dell Service Engineer"
                  value={technician}
                  onChange={(e) => setTechnician(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Issue Description & Scope of Work <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Symptoms observed, fault diagnostics or scheduled routine maintenance..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setScheduleModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Scheduling...' : 'File Service Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Maintenance Modal */}
      {completeModalOpen && activeTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Close Service Ticket: {activeTicket.asset?.name}</h3>
            <p className="text-xs text-slate-500">
              Record completion of maintenance, invoice cost, and restore asset status to "Available".
            </p>

            <form onSubmit={handleCompleteSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Actual Incurred Cost (INR)
                </label>
                <input
                  type="number"
                  min="0"
                  value={finalCost}
                  onChange={(e) => setFinalCost(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Restored Physical Condition
                </label>
                <select
                  value={finalCondition}
                  onChange={(e) => setFinalCondition(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs"
                >
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Technician Sign-Off Notes / Invoice #
                </label>
                <textarea
                  rows={2}
                  placeholder="Replaced power supply capacitors, firmware flashed, passed diagnostic testing..."
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCompleteModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Closing...' : 'Close Ticket & Restore Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
