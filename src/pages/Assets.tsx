import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit2,
  Trash2,
  QrCode,
  ArrowUpDown,
  Building,
  MapPin,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';

export const Assets: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [assets, setAssets] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState('');
  const [condition, setCondition] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Deletion modal state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchFiltersData = async () => {
    try {
      const [deptRes, locRes] = await Promise.all([
        api.get('/departments'),
        api.get('/locations'),
      ]);
      if (deptRes.data.success) setDepartments(deptRes.data.departments || []);
      if (locRes.data.success) setLocations(locRes.data.locations || []);
    } catch (err) {
      console.error('Failed to load filter metadata:', err);
    }
  };

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        limit: 15,
        sortBy,
        sortOrder,
      };
      if (search) params.search = search;
      if (category) params.category = category;
      if (department) params.department = department;
      if (status) params.status = status;
      if (condition) params.condition = condition;

      const res = await api.get('/assets', { params });
      if (res.data.success) {
        setAssets(res.data.assets || []);
        setTotalCount(res.data.pagination?.total || 0);
        setTotalPages(res.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error('Error fetching assets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiltersData();
  }, []);

  useEffect(() => {
    fetchAssets();
  }, [page, category, department, status, condition, sortBy, sortOrder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchAssets();
  };

  const handleDeleteAsset = async (id: string) => {
    setDeleteError(null);
    try {
      const res = await api.delete(`/assets/${id}`);
      if (res.data.success) {
        setDeletingId(null);
        fetchAssets();
      }
    } catch (err: any) {
      setDeleteError(err.response?.data?.message || 'Failed to delete asset.');
    }
  };

  const exportCSV = () => {
    if (assets.length === 0) return;
    const headers = ['Asset ID', 'Name', 'Category', 'Department', 'Location', 'Serial Number', 'Cost (INR)', 'Status', 'Condition'];
    const rows = assets.map((a) => [
      a.assetId,
      `"${a.name.replace(/"/g, '""')}"`,
      `"${a.category}"`,
      `"${a.department?.name || ''}"`,
      `"${a.location?.name || ''}"`,
      `"${a.serialNumber}"`,
      a.purchaseCost,
      a.status,
      a.condition,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Asset_Register_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Institutional Asset Register</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Central repository of campus equipment, laboratory instruments, and computing assets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-md border border-slate-200 shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <Link
            to="/assets/new"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md shadow-2xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register Asset</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Asset ID, Name, Serial Number, or Manufacturer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-xs placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-md transition-colors"
          >
            Search
          </button>

          <button
            type="button"
            onClick={() => {
              setSearch('');
              setCategory('');
              setDepartment('');
              setStatus('');
              setCondition('');
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium rounded-md transition-colors"
            title="Reset Filters"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-100">
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="w-full py-1.5 px-2 border border-slate-300 rounded-md text-xs focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Categories</option>
              <option value="Computing Equipment">Computing Equipment</option>
              <option value="Laboratory Instruments">Laboratory Instruments</option>
              <option value="Networking & Servers">Networking & Servers</option>
              <option value="Audio-Visual & Presentation">Audio-Visual & Presentation</option>
              <option value="Power & Backup">Power & Backup</option>
              <option value="Tools & Machinery">Tools & Machinery</option>
              <option value="Furniture & Fixtures">Furniture & Fixtures</option>
              <option value="Consumables & Supplies">Consumables & Supplies</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Department
            </label>
            <select
              value={department}
              onChange={(e) => {
                setDepartment(e.target.value);
                setPage(1);
              }}
              className="w-full py-1.5 px-2 border border-slate-300 rounded-md text-xs focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full py-1.5 px-2 border border-slate-300 rounded-md text-xs focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="Available">Available</option>
              <option value="In Use">In Use</option>
              <option value="Under Maintenance">Under Maintenance</option>
              <option value="Damaged">Damaged</option>
              <option value="Retired">Retired</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Condition
            </label>
            <select
              value={condition}
              onChange={(e) => {
                setCondition(e.target.value);
                setPage(1);
              }}
              className="w-full py-1.5 px-2 border border-slate-300 rounded-md text-xs focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Conditions</option>
              <option value="Excellent">Excellent</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
              <option value="Poor">Poor</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Asset Data Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span className="text-xs text-slate-500">Querying asset repository...</span>
          </div>
        ) : assets.length === 0 ? (
          <div className="py-16 text-center">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-700">No Assets Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No matching assets registered under the specified search criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Asset ID / Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Department & Location</th>
                  <th className="py-3 px-4">Serial Number</th>
                  <th className="py-3 px-4">Cost</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Condition</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assets.map((asset) => (
                  <tr key={asset._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/assets/${asset._id}`}
                          className="font-semibold text-slate-900 hover:text-indigo-600 transition-colors"
                        >
                          {asset.name}
                        </Link>
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                        {asset.assetId}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      {asset.category}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">
                        {asset.department?.name || 'Unassigned'}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{asset.location?.name || 'Storage'}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      {asset.serialNumber}
                    </td>

                    <td className="py-3 px-4 font-mono font-medium text-slate-900">
                      ₹{asset.purchaseCost ? asset.purchaseCost.toLocaleString() : '0'}
                    </td>

                    <td className="py-3 px-4">
                      <StatusBadge status={asset.status} type="status" />
                    </td>

                    <td className="py-3 px-4">
                      <StatusBadge status={asset.condition} type="condition" />
                    </td>

                    <td className="py-3 px-4 text-right space-x-1">
                      <Link
                        to={`/assets/${asset._id}`}
                        className="inline-flex p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded transition-colors"
                        title="View Asset Details & QR"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>

                      <Link
                        to={`/assets/edit/${asset._id}`}
                        className="inline-flex p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-slate-100 rounded transition-colors"
                        title="Edit Asset"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Link>

                      {isAdmin && (
                        <button
                          onClick={() => setDeletingId(asset._id)}
                          className="inline-flex p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="Delete Asset"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs text-slate-600">
          <div>
            Showing <span className="font-semibold">{assets.length}</span> of{' '}
            <span className="font-semibold">{totalCount}</span> registered assets
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 border border-slate-300 rounded hover:bg-white disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 py-1 font-medium">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 border border-slate-300 rounded hover:bg-white disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-sm w-full p-5 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Confirm Asset Deletion</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently remove this asset from the institutional register? Related maintenance tickets and circulation logs will be archived.
            </p>
            {deleteError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded">
                {deleteError}
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-3 py-1.5 border border-slate-300 rounded text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteAsset(deletingId)}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold shadow-xs"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
