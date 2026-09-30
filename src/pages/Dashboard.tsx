import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Box,
  CheckCircle2,
  Clock,
  Wrench,
  AlertTriangle,
  Calendar,
  ArrowRight,
  Plus,
  ArrowLeftRight,
  QrCode,
  FileSpreadsheet,
  AlertOctagon,
  Building,
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { QRScannerModal } from '../components/QRScannerModal';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reports/dashboard-summary');
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500 font-medium">Loading institutional dashboard metrics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 rounded-lg text-center">
        <AlertOctagon className="w-8 h-8 text-rose-600 mx-auto mb-2" />
        <h3 className="text-sm font-semibold text-rose-800">Error Loading Dashboard</h3>
        <p className="text-xs text-rose-600 mt-1">{error || 'Could not connect to backend service.'}</p>
        <button
          onClick={fetchDashboardData}
          className="mt-3 px-3 py-1.5 bg-rose-600 text-white rounded text-xs font-medium hover:bg-rose-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const { summary, charts, lowStockItems, recentActivity, recentCheckouts, upcomingMaintenance } = data;

  return (
    <div className="space-y-6">
      {/* Welcome Banner & Quick Action Buttons */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900">
              Welcome back, {user?.name}
            </h1>
            <StatusBadge status={user?.role || 'STAFF'} type="role" />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {user?.departmentName ? `${user.departmentName} • ` : ''}
            {summary.lowStockCount > 0
              ? `${summary.lowStockCount} items have reached their minimum stock level.`
              : 'All asset inventories are within normal thresholds.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setScannerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-xs font-semibold rounded-md border border-slate-200 transition-colors"
          >
            <QrCode className="w-3.5 h-3.5 text-indigo-600" />
            <span>Scan Tag</span>
          </button>

          <Link
            to="/circulation"
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md border border-slate-200 transition-colors"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-slate-600" />
            <span>Check-Out / In</span>
          </Link>

          <Link
            to="/assets/new"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md shadow-2xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Asset</span>
          </Link>
        </div>
      </div>

      {/* Primary KPI Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Assets */}
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Assets</span>
            <Box className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 text-xl font-bold text-slate-900">{summary.totalAssets}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Cataloged in registry</div>
        </div>

        {/* Available Assets */}
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Available</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-xl font-bold text-emerald-600">{summary.availableAssets}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Ready for issuance</div>
        </div>

        {/* In Use Assets */}
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">In Use</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-xl font-bold text-blue-600">{summary.inUseAssets}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Active loans / labs</div>
        </div>

        {/* Under Maintenance */}
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Maintenance</span>
            <Wrench className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-xl font-bold text-amber-600">{summary.underMaintenanceAssets}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Servicing & repairs</div>
        </div>

        {/* Low Stock Items */}
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Low Stock</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2 text-xl font-bold text-rose-600">{summary.lowStockCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Below reorder limit</div>
        </div>

        {/* Maintenance Due Soon */}
        <div className="bg-white border border-slate-200 rounded-lg p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Maint. Due</span>
            <Calendar className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 text-xl font-bold text-purple-600">
            {summary.maintenanceDueSoon + summary.maintenanceOverdue}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {summary.maintenanceOverdue > 0 ? `${summary.maintenanceOverdue} overdue` : 'Next 7 days'}
          </div>
        </div>
      </div>

      {/* Middle Section: Distributions & Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Asset Status Distribution
            </h3>
            <span className="text-xs text-slate-400">{summary.totalAssets} items</span>
          </div>

          <div className="space-y-3">
            {charts.statusDistribution.map((item: any) => {
              const pct = summary.totalAssets > 0 ? Math.round((item.count / summary.totalAssets) * 100) : 0;
              return (
                <div key={item.status} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-700">{item.status}</span>
                    <span className="font-semibold text-slate-900">
                      {item.count} <span className="text-slate-400 font-normal">({pct}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{ width: `${pct}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Department-Wise Distribution */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Department Inventory
            </h3>
            <Link to="/departments" className="text-xs text-indigo-600 hover:underline flex items-center gap-0.5">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {charts.departmentDistribution.map((dept: any) => (
              <div
                key={dept.id}
                className="flex items-center justify-between p-2 rounded-md hover:bg-slate-50 border border-slate-100 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 font-mono font-semibold rounded text-[10px]">
                    {dept.code}
                  </span>
                  <span className="text-slate-800 font-medium truncate max-w-[180px]">{dept.name}</span>
                </div>
                <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                  {dept.count} assets
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Category Distribution
            </h3>
            <Link to="/reports?tab=category" className="text-xs text-indigo-600 hover:underline flex items-center gap-0.5">
              Reports <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {charts.categoryDistribution.slice(0, 5).map((cat: any) => (
              <div key={cat.category} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-0">
                <span className="text-slate-700 font-medium truncate max-w-[200px]">{cat.category}</span>
                <span className="font-semibold text-slate-900 font-mono">{cat.count} units</span>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Total Asset Registry Value:</span>
            <span className="font-bold text-slate-900 font-mono">
              ₹{summary.totalValuation ? summary.totalValuation.toLocaleString() : '0'}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Section: Actionable Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Items Alert Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Low Stock Threshold Alerts
              </h3>
            </div>
            <Link to="/stock?lowStock=true" className="text-xs text-indigo-600 hover:underline flex items-center gap-0.5">
              Stock Manager <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {lowStockItems.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded">
              All inventory levels are currently above minimum reserve thresholds.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-[10px] uppercase tracking-wider">
                    <th className="py-2 font-semibold">Asset / Item</th>
                    <th className="py-2 font-semibold">In Stock</th>
                    <th className="py-2 font-semibold">Min Level</th>
                    <th className="py-2 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lowStockItems.map((item: any) => (
                    <tr key={item._id} className="hover:bg-rose-50/30">
                      <td className="py-2.5">
                        <Link to={`/assets/${item._id}`} className="font-semibold text-slate-800 hover:text-indigo-600 block">
                          {item.name}
                        </Link>
                        <span className="text-[10px] font-mono text-slate-400">{item.assetId}</span>
                      </td>
                      <td className="py-2.5">
                        <span className="font-bold text-rose-600 font-mono">
                          {item.availableQuantity} {item.unit}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-500 font-mono">
                        {item.minimumStockLevel} {item.unit}
                      </td>
                      <td className="py-2.5 text-right">
                        <Link
                          to="/stock"
                          className="px-2 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded text-[11px] font-medium hover:bg-indigo-100 transition-colors"
                        >
                          Restock
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Upcoming & Overdue Maintenance */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-amber-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Scheduled Maintenance & Service
              </h3>
            </div>
            <Link to="/maintenance" className="text-xs text-indigo-600 hover:underline flex items-center gap-0.5">
              Service Log <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {upcomingMaintenance.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded">
              No outstanding maintenance tickets or overdue services.
            </div>
          ) : (
            <div className="space-y-2.5">
              {upcomingMaintenance.map((m: any) => {
                const isOverdue = new Date(m.dueDate) < new Date() && m.status !== 'Completed';
                return (
                  <div
                    key={m._id}
                    className={`p-3 rounded-md border text-xs flex items-center justify-between gap-3 ${
                      isOverdue
                        ? 'border-rose-200 bg-rose-50/40'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 truncate">
                          {m.asset?.name || 'Asset Service'}
                        </span>
                        <StatusBadge status={m.status} type="status" />
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                        Tech: {m.technician} • Due: {new Date(m.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                    <Link
                      to="/maintenance"
                      className="px-2.5 py-1 text-xs border border-slate-300 rounded font-medium text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
                    >
                      Inspect
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity Timeline & Active Check-outs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Checkouts */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Currently Checked Out Equipment
            </h3>
            <Link to="/circulation" className="text-xs text-indigo-600 hover:underline flex items-center gap-0.5">
              Circulation desk <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recentCheckouts.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded">
              No equipment currently borrowed or checked out.
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentCheckouts.map((rec: any) => (
                <div key={rec._id} className="p-3 border border-slate-200 rounded-md text-xs flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-slate-900">{rec.asset?.name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Issued to <span className="font-medium text-slate-700">{rec.user?.name}</span> ({rec.user?.designation})
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Purpose: {rec.purpose || 'Laboratory practical'}
                    </div>
                  </div>
                  <Link
                    to="/circulation"
                    className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[11px] font-medium hover:bg-emerald-100 transition-colors"
                  >
                    Check In
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Audit Activity Stream */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Recent Institutional Activity
            </h3>
            <Link to="/audit-logs" className="text-xs text-indigo-600 hover:underline flex items-center gap-0.5">
              Audit log <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {recentActivity.slice(0, 5).map((act: any) => (
              <div key={act._id} className="flex items-start gap-2.5 text-xs py-1 border-b border-slate-100 last:border-0">
                <div className="w-2 h-2 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-slate-800">
                    <span className="font-semibold">{act.user?.name || 'System User'}</span>{' '}
                    <span className="text-slate-500 font-mono text-[10px] uppercase">[{act.action}]</span>{' '}
                    <span className="text-slate-700">{act.asset?.name || act.purpose}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {new Date(act.createdAt).toLocaleDateString()} at{' '}
                    {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <QRScannerModal isOpen={scannerOpen} onClose={() => setScannerOpen(false)} />
    </div>
  );
};
