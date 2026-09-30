import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import {
  Layers,
  AlertTriangle,
  PackageCheck,
  PackageMinus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  PlusCircle,
  MinusCircle,
  Settings2,
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';

export const Stock: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const lowStockParam = searchParams.get('lowStock') === 'true';

  const [stock, setStock] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({
    totalItems: 0,
    totalStockUnits: 0,
    availableUnits: 0,
    lowStockCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(lowStockParam);

  // Stock Adjustment Modal
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [adjustType, setAdjustType] = useState<'RESTOCK' | 'CONSUME' | 'SET'>('RESTOCK');
  const [adjustAmount, setAdjustAmount] = useState('1');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [adjustError, setAdjustError] = useState<string | null>(null);

  const fetchStock = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (search) params.search = search;
      if (lowStockFilter) params.lowStockOnly = 'true';

      const res = await api.get('/stock', { params });
      if (res.data.success) {
        setStock(res.data.stock || []);
        setMetrics(res.data.metrics || {});
      }
    } catch (err) {
      console.error('Error fetching stock:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, [lowStockFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStock();
  };

  const openAdjustModal = (item: any, type: 'RESTOCK' | 'CONSUME' | 'SET') => {
    setSelectedItem(item);
    setAdjustType(type);
    setAdjustAmount('1');
    setAdjustReason('');
    setAdjustError(null);
    setAdjustModalOpen(true);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    setAdjustLoading(true);
    setAdjustError(null);

    try {
      const res = await api.post('/stock/adjust', {
        assetId: selectedItem._id,
        adjustmentType: adjustType,
        amount: adjustAmount,
        reason: adjustReason,
      });

      if (res.data.success) {
        setAdjustModalOpen(false);
        fetchStock();
      }
    } catch (err: any) {
      setAdjustError(err.response?.data?.message || 'Failed to adjust stock level.');
    } finally {
      setAdjustLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Stock & Inventory Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time tracking of consumables, modular kits, spares, and laboratory equipment levels.
          </p>
        </div>

        <button
          onClick={fetchStock}
          className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-md border border-slate-200 shadow-2xs self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          <span>Refresh Stock</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
          <div className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">Cataloged Items</div>
          <div className="mt-1 text-2xl font-bold text-slate-900 font-mono">{metrics.totalItems}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Distinct inventory records</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
          <div className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">Total Quantity</div>
          <div className="mt-1 text-2xl font-bold text-slate-900 font-mono">{metrics.totalStockUnits}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Cumulative units across campus</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
          <div className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">Available in Stores</div>
          <div className="mt-1 text-2xl font-bold text-emerald-600 font-mono">{metrics.availableUnits}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Ready for disbursement</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs">
          <div className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">Low Stock Items</div>
          <div className="mt-1 text-2xl font-bold text-rose-600 font-mono">{metrics.lowStockCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Below minimum buffer limit</div>
        </div>
      </div>

      {/* Controls & Filter Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search stock item, model, or asset ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-md text-xs placeholder-slate-400 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </form>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setLowStockFilter(!lowStockFilter)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md border flex items-center gap-1.5 transition-colors ${
              lowStockFilter
                ? 'bg-rose-50 text-rose-700 border-rose-300 shadow-2xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${lowStockFilter ? 'text-rose-600' : 'text-slate-400'}`} />
            <span>Show Low Stock Only ({metrics.lowStockCount})</span>
          </button>
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span className="text-xs text-slate-500">Checking inventory levels...</span>
          </div>
        ) : stock.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            No stock records match the current filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Item & Code</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4 text-center">In Stock</th>
                  <th className="py-3 px-4 text-center">Available</th>
                  <th className="py-3 px-4 text-center">Min Threshold</th>
                  <th className="py-3 px-4">Stock Status</th>
                  <th className="py-3 px-4 text-right">Adjustment Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stock.map((item) => (
                  <tr
                    key={item._id}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      item.isLowStock ? 'bg-rose-50/20' : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <Link
                        to={`/assets/${item._id}`}
                        className="font-semibold text-slate-900 hover:text-indigo-600 block"
                      >
                        {item.name}
                      </Link>
                      <span className="text-[10px] font-mono text-slate-400">{item.assetId}</span>
                    </td>

                    <td className="py-3 px-4 text-slate-600">{item.category}</td>

                    <td className="py-3 px-4 text-slate-800">
                      {item.department?.name || 'Central Store'}
                    </td>

                    <td className="py-3 px-4 text-center font-mono font-semibold text-slate-900">
                      {item.quantity} {item.unit}
                    </td>

                    <td className="py-3 px-4 text-center font-mono font-bold">
                      <span className={item.isLowStock ? 'text-rose-600' : 'text-emerald-700'}>
                        {item.availableQuantity} {item.unit}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center font-mono text-slate-500">
                      {item.minimumStockLevel} {item.unit}
                    </td>

                    <td className="py-3 px-4">
                      {item.isLowStock ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-700 border border-rose-200">
                          <AlertTriangle className="w-3 h-3" /> LOW STOCK
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Normal
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right space-x-1.5">
                      <button
                        onClick={() => openAdjustModal(item, 'RESTOCK')}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded text-[11px] font-medium transition-colors"
                        title="Add Stock / Purchase Receipt"
                      >
                        <PlusCircle className="w-3 h-3" />
                        <span>Restock</span>
                      </button>

                      <button
                        onClick={() => openAdjustModal(item, 'CONSUME')}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 rounded text-[11px] font-medium transition-colors"
                        title="Consume / Disburse for lab use"
                      >
                        <MinusCircle className="w-3 h-3" />
                        <span>Consume</span>
                      </button>

                      <button
                        onClick={() => openAdjustModal(item, 'SET')}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                        title="Audit / Re-count"
                      >
                        <Settings2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Adjust Stock Level Modal */}
      {adjustModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">
              Stock Adjustment: {selectedItem.name}
            </h3>
            <p className="text-xs text-slate-500">
              Current Available Quantity: <strong className="text-slate-900 font-mono">{selectedItem.availableQuantity} {selectedItem.unit}</strong> (Total: {selectedItem.quantity})
            </p>

            {adjustError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded">
                {adjustError}
              </div>
            )}

            <form onSubmit={handleAdjustSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Adjustment Type
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setAdjustType('RESTOCK')}
                    className={`py-1.5 px-2 rounded border font-semibold text-center transition-colors ${
                      adjustType === 'RESTOCK'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    + Restock
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdjustType('CONSUME')}
                    className={`py-1.5 px-2 rounded border font-semibold text-center transition-colors ${
                      adjustType === 'CONSUME'
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    - Consume
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdjustType('SET')}
                    className={`py-1.5 px-2 rounded border font-semibold text-center transition-colors ${
                      adjustType === 'SET'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Set Count
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  {adjustType === 'RESTOCK'
                    ? `Units to Add (${selectedItem.unit})`
                    : adjustType === 'CONSUME'
                    ? `Units to Consume (${selectedItem.unit})`
                    : `Exact Inventory Count (${selectedItem.unit})`}
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-mono focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Reason / Purchase Order / Lab Practical
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Received shipment under PO #4421, or distributed for Semester 6 Microcontroller project"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAdjustModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustLoading}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold shadow-xs disabled:opacity-50"
                >
                  {adjustLoading ? 'Updating...' : 'Save Stock Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
