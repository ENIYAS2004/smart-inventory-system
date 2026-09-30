import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  BarChart3,
  Download,
  Printer,
  Filter,
  FileSpreadsheet,
  Building,
  Wrench,
  Layers,
  ArrowLeftRight,
  TrendingUp,
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';

export const Reports: React.FC = () => {
  const [reportType, setReportType] = useState<
    'assets' | 'stock' | 'maintenance' | 'usage' | 'department'
  >('assets');

  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await api.get('/departments');
        if (res.data.success) setDepartments(res.data.departments || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchDepartments();
  }, []);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params: any = { reportType };
      if (selectedDept) params.department = selectedDept;
      if (selectedCategory) params.category = selectedCategory;
      if (selectedStatus) params.status = selectedStatus;

      const res = await api.get('/reports/detailed', { params });
      if (res.data.success) {
        setReportData(res.data);
      }
    } catch (err) {
      console.error('Error fetching report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType, selectedDept, selectedCategory, selectedStatus]);

  const handleExportCSV = () => {
    if (!reportData?.data || reportData.data.length === 0) return;

    let headers: string[] = [];
    let rows: any[] = [];

    if (reportType === 'assets' || reportType === 'stock') {
      headers = ['Asset ID', 'Name', 'Category', 'Department', 'Location', 'Serial Number', 'Purchase Cost', 'Quantity', 'Status', 'Condition'];
      rows = reportData.data.map((item: any) => [
        item.assetId,
        `"${item.name.replace(/"/g, '""')}"`,
        `"${item.category}"`,
        `"${item.department?.name || ''}"`,
        `"${item.location?.name || ''}"`,
        `"${item.serialNumber}"`,
        item.purchaseCost,
        item.quantity,
        item.status,
        item.condition,
      ]);
    } else if (reportType === 'maintenance') {
      headers = ['Asset ID', 'Asset Name', 'Service Type', 'Technician', 'Status', 'Cost', 'Due Date', 'Description'];
      rows = reportData.data.map((item: any) => [
        item.asset?.assetId || '',
        `"${(item.asset?.name || '').replace(/"/g, '""')}"`,
        item.maintenanceType,
        `"${item.technician}"`,
        item.status,
        item.cost,
        new Date(item.dueDate).toLocaleDateString(),
        `"${(item.description || '').replace(/"/g, '""')}"`,
      ]);
    } else if (reportType === 'usage') {
      headers = ['Date', 'Action', 'Asset ID', 'Asset Name', 'Borrower', 'Department', 'Purpose', 'Status'];
      rows = reportData.data.map((item: any) => [
        new Date(item.createdAt).toLocaleDateString(),
        item.action,
        item.asset?.assetId || '',
        `"${(item.asset?.name || '').replace(/"/g, '""')}"`,
        `"${item.user?.name || ''}"`,
        `"${item.department?.name || ''}"`,
        `"${(item.purpose || '').replace(/"/g, '""')}"`,
        item.status,
      ]);
    } else if (reportType === 'department') {
      headers = ['Department', 'Code', 'Block', 'Total Assets', 'In Use', 'Under Maintenance', 'Total Valuation'];
      rows = reportData.data.map((item: any) => [
        `"${item.department}"`,
        item.code,
        `"${item.block}"`,
        item.totalAssets,
        item.inUse,
        item.underMaintenance,
        item.totalValuation,
      ]);
    }

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${reportType}_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Institutional Reports & Audits</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Generate verifiable asset valuation, maintenance expenditure, and departmental distribution reports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-md border border-slate-200 shadow-2xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Layout</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Report Selection Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setReportType('assets')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold transition-colors ${
            reportType === 'assets'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Asset Inventory</span>
        </button>

        <button
          onClick={() => setReportType('stock')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold transition-colors ${
            reportType === 'stock'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Stock & Valuation</span>
        </button>

        <button
          onClick={() => setReportType('maintenance')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold transition-colors ${
            reportType === 'maintenance'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>Maintenance & Repairs</span>
        </button>

        <button
          onClick={() => setReportType('usage')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold transition-colors ${
            reportType === 'usage'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
          <span>Circulation Log</span>
        </button>

        <button
          onClick={() => setReportType('department')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold transition-colors ${
            reportType === 'department'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>Department Breakdown</span>
        </button>
      </div>

      {/* Filter Parameters */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs flex flex-wrap items-center gap-3">
        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Report Filters:</span>

        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="px-2.5 py-1.5 border border-slate-300 rounded text-xs"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d._id} value={d._id}>
              {d.name} ({d.code})
            </option>
          ))}
        </select>

        {reportType === 'assets' && (
          <>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded text-xs"
            >
              <option value="">All Categories</option>
              <option value="Computing Equipment">Computing Equipment</option>
              <option value="Laboratory Instruments">Laboratory Instruments</option>
              <option value="Networking & Servers">Networking & Servers</option>
              <option value="Audio-Visual & Presentation">Audio-Visual & Presentation</option>
              <option value="Tools & Machinery">Tools & Machinery</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded text-xs"
            >
              <option value="">All Statuses</option>
              <option value="Available">Available</option>
              <option value="In Use">In Use</option>
              <option value="Under Maintenance">Under Maintenance</option>
              <option value="Damaged">Damaged</option>
            </select>
          </>
        )}
      </div>

      {/* Report Data Rendering */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-500">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Compiling institutional dataset...
          </div>
        ) : !reportData?.data || reportData.data.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No matching records found for the requested report parameters.
          </div>
        ) : (
          <div>
            {/* Header Metrics Summary for Report */}
            {reportType === 'assets' && (
              <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs">
                <div>
                  Total Registered Records: <strong className="font-mono text-slate-900">{reportData.totalCount}</strong>
                </div>
                <div>
                  Cumulative Registry Valuation: <strong className="font-mono text-slate-900">₹{reportData.totalValuation?.toLocaleString()}</strong>
                </div>
              </div>
            )}

            {reportType === 'maintenance' && (
              <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs">
                <div>
                  Total Service Records: <strong className="font-mono text-slate-900">{reportData.data?.length}</strong>
                </div>
                <div>
                  Total Service Incurred Expenses: <strong className="font-mono text-slate-900">₹{reportData.totalCost?.toLocaleString()}</strong>
                </div>
              </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                {/* Table for Assets & Stock */}
                {(reportType === 'assets' || reportType === 'stock') && (
                  <>
                    <thead>
                      <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                        <th className="py-3 px-4">Asset ID</th>
                        <th className="py-3 px-4">Name</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4">Department</th>
                        <th className="py-3 px-4">Serial Number</th>
                        <th className="py-3 px-4">Cost</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Condition</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reportData.data.map((a: any) => (
                        <tr key={a._id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-mono font-medium text-slate-900">{a.assetId}</td>
                          <td className="py-3 px-4 font-semibold text-slate-800">{a.name}</td>
                          <td className="py-3 px-4 text-slate-600">{a.category}</td>
                          <td className="py-3 px-4 text-slate-700">{a.department?.name || 'Store'}</td>
                          <td className="py-3 px-4 font-mono text-slate-500">{a.serialNumber}</td>
                          <td className="py-3 px-4 font-mono">₹{a.purchaseCost?.toLocaleString()}</td>
                          <td className="py-3 px-4"><StatusBadge status={a.status} type="status" /></td>
                          <td className="py-3 px-4"><StatusBadge status={a.condition} type="condition" /></td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}

                {/* Table for Maintenance */}
                {reportType === 'maintenance' && (
                  <>
                    <thead>
                      <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                        <th className="py-3 px-4">Asset</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Technician</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Cost</th>
                        <th className="py-3 px-4">Due Date</th>
                        <th className="py-3 px-4">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reportData.data.map((m: any) => (
                        <tr key={m._id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-semibold text-slate-900">
                            {m.asset?.name}
                            <span className="block text-[10px] font-mono text-slate-400">{m.asset?.assetId}</span>
                          </td>
                          <td className="py-3 px-4">{m.maintenanceType}</td>
                          <td className="py-3 px-4 font-medium">{m.technician}</td>
                          <td className="py-3 px-4"><StatusBadge status={m.status} type="status" /></td>
                          <td className="py-3 px-4 font-mono font-semibold">₹{m.cost?.toLocaleString()}</td>
                          <td className="py-3 px-4 font-mono">{new Date(m.dueDate).toLocaleDateString()}</td>
                          <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{m.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}

                {/* Table for Usage */}
                {reportType === 'usage' && (
                  <>
                    <thead>
                      <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Action</th>
                        <th className="py-3 px-4">Asset</th>
                        <th className="py-3 px-4">Borrower</th>
                        <th className="py-3 px-4">Department</th>
                        <th className="py-3 px-4">Purpose</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reportData.data.map((u: any) => (
                        <tr key={u._id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-mono text-slate-600">{new Date(u.createdAt).toLocaleDateString()}</td>
                          <td className="py-3 px-4 font-mono font-semibold">{u.action}</td>
                          <td className="py-3 px-4 font-semibold text-slate-900">{u.asset?.name}</td>
                          <td className="py-3 px-4 text-slate-800">{u.user?.name}</td>
                          <td className="py-3 px-4 text-slate-600">{u.department?.name || 'General'}</td>
                          <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{u.purpose}</td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}

                {/* Table for Department */}
                {reportType === 'department' && (
                  <>
                    <thead>
                      <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                        <th className="py-3 px-4">Department Name</th>
                        <th className="py-3 px-4">Code</th>
                        <th className="py-3 px-4">Campus Wing / Block</th>
                        <th className="py-3 px-4 text-center">Total Assets</th>
                        <th className="py-3 px-4 text-center">In Use</th>
                        <th className="py-3 px-4 text-center">Under Maintenance</th>
                        <th className="py-3 px-4 text-right">Total Valuation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reportData.data.map((d: any) => (
                        <tr key={d.code} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-bold text-slate-900">{d.department}</td>
                          <td className="py-3 px-4 font-mono font-semibold text-slate-600">{d.code}</td>
                          <td className="py-3 px-4 text-slate-600">{d.block}</td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">{d.totalAssets}</td>
                          <td className="py-3 px-4 text-center font-mono font-semibold text-blue-600">{d.inUse}</td>
                          <td className="py-3 px-4 text-center font-mono font-semibold text-amber-600">{d.underMaintenance}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                            ₹{d.totalValuation?.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </>
                )}
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
