import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Box,
  QrCode,
  Barcode,
  Printer,
  Edit2,
  ArrowLeftRight,
  Wrench,
  Calendar,
  DollarSign,
  ShieldCheck,
  Building,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  User as UserIcon,
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import JsBarcode from 'jsbarcode';

export const AssetDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [asset, setAsset] = useState<any>(null);
  const [usageHistory, setUsageHistory] = useState<any[]>([]);
  const [maintenanceHistory, setMaintenanceHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab State: 'info' | 'usage' | 'maintenance'
  const [activeTab, setActiveTab] = useState<'info' | 'usage' | 'maintenance'>('info');

  // Circulation modals
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [checkinModalOpen, setCheckinModalOpen] = useState(false);
  const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false);

  // Checkout form
  const [purpose, setPurpose] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [circulationNotes, setCirculationNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Checkin form
  const [conditionAfter, setConditionAfter] = useState('Good');
  const [checkinNotes, setCheckinNotes] = useState('');

  // Maintenance form
  const [maintType, setMaintType] = useState('Preventive');
  const [maintDueDate, setMaintDueDate] = useState('');
  const [maintTech, setMaintTech] = useState('');
  const [maintCost, setMaintCost] = useState('0');
  const [maintDesc, setMaintDesc] = useState('');
  const [maintPriority, setMaintPriority] = useState('Medium');

  const barcodeRef = useRef<SVGSVGElement>(null);

  const fetchAssetDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/assets/${id}`);
      if (res.data.success) {
        setAsset(res.data.asset);
        setUsageHistory(res.data.usageHistory || []);
        setMaintenanceHistory(res.data.maintenanceHistory || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load asset details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssetDetails();
  }, [id]);

  useEffect(() => {
    if (asset?.assetId && barcodeRef.current) {
      try {
        JsBarcode(barcodeRef.current, asset.assetId, {
          format: 'CODE128',
          lineColor: '#1e293b',
          width: 2,
          height: 50,
          displayValue: true,
          fontSize: 12,
          font: 'monospace',
          margin: 5,
        });
      } catch (err) {
        console.error('JsBarcode rendering error:', err);
      }
    }
  }, [asset]);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await api.post('/usage/checkout', {
        assetId: asset._id,
        purpose,
        expectedReturnDate,
        notes: circulationNotes,
      });
      if (res.data.success) {
        setCheckoutModalOpen(false);
        setPurpose('');
        setExpectedReturnDate('');
        setCirculationNotes('');
        fetchAssetDetails();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Check out failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await api.post('/usage/checkin', {
        assetId: asset._id,
        conditionAfter,
        notes: checkinNotes,
      });
      if (res.data.success) {
        setCheckinModalOpen(false);
        setCheckinNotes('');
        fetchAssetDetails();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Check in failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleScheduleMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await api.post('/maintenance', {
        assetId: asset._id,
        maintenanceType: maintType,
        dueDate: maintDueDate,
        technician: maintTech,
        cost: maintCost,
        description: maintDesc,
        priority: maintPriority,
      });
      if (res.data.success) {
        setMaintenanceModalOpen(false);
        setMaintDesc('');
        setMaintTech('');
        fetchAssetDetails();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to schedule maintenance');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrintTag = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <span className="text-xs text-slate-500">Retrieving asset profile and history...</span>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-200 rounded-lg text-center max-w-lg mx-auto">
        <h3 className="text-sm font-semibold text-rose-800">Asset Record Not Found</h3>
        <p className="text-xs text-rose-600 mt-1">{error || 'Requested asset does not exist.'}</p>
        <Link
          to="/assets"
          className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 text-white rounded text-xs font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Assets
        </Link>
      </div>
    );
  }

  const isLowStock = asset.availableQuantity <= asset.minimumStockLevel;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Quick Nav */}
      <div className="flex items-center justify-between">
        <Link
          to="/assets"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Asset Register</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrintTag}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded-md hover:bg-slate-50 shadow-2xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Print Asset Tag</span>
          </button>

          <Link
            to={`/assets/edit/${asset._id}`}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold rounded-md hover:bg-slate-200 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Asset</span>
          </Link>
        </div>
      </div>

      {/* Asset Header Overview Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded font-mono text-xs font-bold">
                {asset.assetId}
              </span>
              <StatusBadge status={asset.status} type="status" />
              <StatusBadge status={asset.condition} type="condition" />
              {isLowStock && (
                <span className="px-2 py-0.5 bg-rose-100 text-rose-800 border border-rose-200 rounded text-xs font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Low Stock
                </span>
              )}
            </div>

            <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-snug">
              {asset.name}
            </h1>

            <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
              {asset.description || 'No description provided.'}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-medium text-slate-700">{asset.department?.name || 'Unassigned'}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-medium text-slate-700">
                  {asset.location?.name || 'Store'} ({asset.location?.roomNumber})
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <Box className="w-3.5 h-3.5 text-slate-400" />
                <span>{asset.category}</span>
              </span>
            </div>
          </div>

          {/* Action buttons on Header */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
            {asset.status === 'Available' ? (
              <button
                onClick={() => setCheckoutModalOpen(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md shadow-2xs transition-colors flex items-center justify-center gap-1.5"
              >
                <ArrowLeftRight className="w-4 h-4" />
                <span>Check Out / Issue</span>
              </button>
            ) : asset.status === 'In Use' ? (
              <button
                onClick={() => setCheckinModalOpen(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md shadow-2xs transition-colors flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Check In / Return</span>
              </button>
            ) : null}

            <button
              onClick={() => setMaintenanceModalOpen(true)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-semibold rounded-md transition-colors flex items-center justify-center gap-1.5"
            >
              <Wrench className="w-4 h-4 text-slate-600" />
              <span>Schedule Service</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid: QR & Identification Card + Core Specs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* College Tag / QR / Barcode Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs flex flex-col items-center text-center">
          <div className="w-full border-b border-slate-100 pb-3 mb-4 text-left flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Institutional Asset Tag
            </span>
            <span className="text-[10px] font-mono text-slate-400">ISO-TAG-STD</span>
          </div>

          {/* Printable tag content */}
          <div id="printable-asset-tag" className="border-2 border-slate-800 p-3 rounded-md bg-white max-w-xs w-full shadow-xs">
            <div className="text-[10px] font-bold tracking-wider text-slate-800 uppercase border-b border-slate-200 pb-1 mb-2">
              INSTITUTIONAL PROPERTY
            </div>

            {/* QR Code image */}
            {asset.qrCode ? (
              <img
                src={asset.qrCode}
                alt={`QR code for ${asset.assetId}`}
                className="w-36 h-36 mx-auto object-contain border border-slate-100 p-1 rounded"
              />
            ) : (
              <div className="w-36 h-36 mx-auto bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                No QR Data
              </div>
            )}

            <div className="mt-2 text-xs font-bold font-mono text-slate-900 tracking-wider">
              {asset.assetId}
            </div>
            <div className="text-[11px] font-medium text-slate-700 truncate px-1 mt-0.5">
              {asset.name}
            </div>

            {/* Barcode SVG */}
            <div className="mt-2 flex justify-center overflow-hidden">
              <svg ref={barcodeRef} className="max-w-full h-12" />
            </div>

            <div className="text-[9px] text-slate-400 font-mono mt-1 border-t border-slate-100 pt-1">
              SN: {asset.serialNumber}
            </div>
          </div>

          <p className="text-[11px] text-slate-500 mt-3">
            Affix this thermal synthetic tag to the asset chassis or equipment front panel.
          </p>
        </div>

        {/* Specifications & Financial Card */}
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
            Asset Specifications & Procurement
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-slate-400 text-[11px] block">Manufacturer</span>
              <span className="font-semibold text-slate-900">{asset.manufacturer || 'N/A'}</span>
            </div>

            <div>
              <span className="text-slate-400 text-[11px] block">Model</span>
              <span className="font-semibold text-slate-900">{asset.model || 'N/A'}</span>
            </div>

            <div>
              <span className="text-slate-400 text-[11px] block">Serial Number</span>
              <span className="font-semibold font-mono text-slate-900">{asset.serialNumber}</span>
            </div>

            <div>
              <span className="text-slate-400 text-[11px] block">Purchase Cost</span>
              <span className="font-semibold font-mono text-slate-900">
                ₹{asset.purchaseCost ? asset.purchaseCost.toLocaleString() : '0'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 text-[11px] block">Purchase Date</span>
              <span className="font-semibold text-slate-900">
                {asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : 'N/A'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 text-[11px] block">Warranty Expiry</span>
              <span className="font-semibold text-slate-900">
                {asset.warrantyExpiry ? new Date(asset.warrantyExpiry).toLocaleDateString() : 'Lifetime / Expired'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 text-[11px] block">Current Quantity</span>
              <span className="font-bold text-slate-900 font-mono">
                {asset.quantity} {asset.unit}
              </span>
            </div>

            <div>
              <span className="text-slate-400 text-[11px] block">Available for Loan</span>
              <span className="font-bold text-emerald-600 font-mono">
                {asset.availableQuantity} {asset.unit}
              </span>
            </div>

            <div>
              <span className="text-slate-400 text-[11px] block">Min Reorder Threshold</span>
              <span className="font-bold text-slate-700 font-mono">
                {asset.minimumStockLevel} {asset.unit}
              </span>
            </div>
          </div>

          {/* Currently Assigned Person (if In Use) */}
          {asset.assignedTo && (
            <div className="mt-4 p-3 bg-blue-50/70 border border-blue-200 rounded-md text-xs">
              <div className="font-semibold text-blue-900 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-blue-700" />
                <span>Currently Issued to Personnel:</span>
              </div>
              <div className="mt-1 text-blue-800">
                <span className="font-semibold">{asset.assignedTo.name}</span> ({asset.assignedTo.designation}) —{' '}
                <span className="font-mono text-[11px]">{asset.assignedTo.email}</span>
              </div>
              <div className="text-[10px] text-blue-600 mt-0.5">
                Issued on: {asset.assignedDate ? new Date(asset.assignedDate).toLocaleDateString() : 'Recently'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs Navigation for History & Circulation */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50/60 px-4">
          <button
            onClick={() => setActiveTab('info')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'info'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Audit & System Records
          </button>

          <button
            onClick={() => setActiveTab('usage')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'usage'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Circulation & Loan History ({usageHistory.length})
          </button>

          <button
            onClick={() => setActiveTab('maintenance')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'maintenance'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Maintenance & Service History ({maintenanceHistory.length})
          </button>
        </div>

        <div className="p-5">
          {/* Tab 1: System Info */}
          {activeTab === 'info' && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-700 uppercase">Created Timestamp</span>
                  <div className="font-mono text-slate-900 mt-1">
                    {new Date(asset.createdAt).toLocaleString()}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-700 uppercase">Last Modified</span>
                  <div className="font-mono text-slate-900 mt-1">
                    {new Date(asset.updatedAt).toLocaleString()}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-700 uppercase">Last Serviced Date</span>
                  <div className="font-mono text-slate-900 mt-1">
                    {asset.lastMaintenanceDate ? new Date(asset.lastMaintenanceDate).toLocaleDateString() : 'None on record'}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-700 uppercase">Next Scheduled Maintenance</span>
                  <div className="font-mono text-slate-900 mt-1">
                    {asset.nextMaintenanceDate ? new Date(asset.nextMaintenanceDate).toLocaleDateString() : 'Not scheduled'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Usage / Circulation History */}
          {activeTab === 'usage' && (
            <div>
              {usageHistory.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No circulation or check-out transactions on record for this asset.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                        <th className="py-2.5">Date</th>
                        <th className="py-2.5">Action</th>
                        <th className="py-2.5">Borrower / Staff</th>
                        <th className="py-2.5">Purpose</th>
                        <th className="py-2.5">Condition</th>
                        <th className="py-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {usageHistory.map((item) => (
                        <tr key={item._id} className="hover:bg-slate-50/50">
                          <td className="py-2.5 font-mono text-slate-600">
                            {new Date(item.createdAt).toLocaleDateString()}{' '}
                            <span className="text-[10px] text-slate-400">
                              {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </td>
                          <td className="py-2.5 font-semibold text-slate-800">
                            <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[11px] font-mono">
                              {item.action}
                            </span>
                          </td>
                          <td className="py-2.5">
                            <span className="font-medium text-slate-900">{item.user?.name || 'Staff'}</span>
                            <span className="text-[10px] text-slate-400 block">{item.user?.designation}</span>
                          </td>
                          <td className="py-2.5 text-slate-700 max-w-xs truncate">
                            {item.purpose || 'Institutional lab task'}
                          </td>
                          <td className="py-2.5">
                            <StatusBadge status={item.conditionAfter || item.conditionBefore || 'Good'} type="condition" />
                          </td>
                          <td className="py-2.5">
                            <span className={`text-[11px] font-semibold ${item.status === 'ACTIVE' ? 'text-blue-600' : 'text-slate-500'}`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Maintenance History */}
          {activeTab === 'maintenance' && (
            <div>
              {maintenanceHistory.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No maintenance records or repair tickets filed for this asset.
                </div>
              ) : (
                <div className="space-y-3">
                  {maintenanceHistory.map((m) => (
                    <div key={m._id} className="p-3.5 border border-slate-200 rounded-md text-xs hover:bg-slate-50/50">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{m.maintenanceType} Maintenance</span>
                          <StatusBadge status={m.status} type="status" />
                          <StatusBadge status={m.priority} type="priority" />
                        </div>
                        <span className="font-mono text-slate-500 text-[11px]">
                          Due: {new Date(m.dueDate).toLocaleDateString()}
                        </span>
                      </div>

                      <p className="text-slate-700 mt-1">{m.description}</p>

                      <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-slate-500 text-[11px]">
                        <span>Technician: <strong className="text-slate-800">{m.technician}</strong></span>
                        <span>Cost: <strong className="text-slate-900 font-mono">₹{m.cost}</strong></span>
                        {m.notes && <span>Notes: {m.notes}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Check Out Modal */}
      {checkoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Check Out Asset: {asset.name}</h3>
            <p className="text-xs text-slate-500">
              Record temporary issuance of this equipment to staff, faculty, or laboratory practical.
            </p>

            <form onSubmit={handleCheckout} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Purpose / Lab Session
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Operating Systems Practical Lab Batch B"
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
                  Circulation Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Accessories issued, initial condition notes..."
                  value={circulationNotes}
                  onChange={(e) => setCirculationNotes(e.target.value)}
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
                  disabled={actionLoading}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold shadow-xs disabled:opacity-50"
                >
                  {actionLoading ? 'Issuing...' : 'Confirm Check Out'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Check In Modal */}
      {checkinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Check In Asset: {asset.name}</h3>
            <p className="text-xs text-slate-500">
              Verify physical condition upon return and restore asset to Available status in the registry.
            </p>

            <form onSubmit={handleCheckin} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Physical Condition After Return
                </label>
                <select
                  value={conditionAfter}
                  onChange={(e) => setConditionAfter(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor (Flags for Inspection)</option>
                  <option value="Critical">Critical (Damaged)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Return Verification Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Returned with cables, verified boots to BIOS cleanly."
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
                  disabled={actionLoading}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow-xs disabled:opacity-50"
                >
                  {actionLoading ? 'Recording...' : 'Confirm Return'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Maintenance Modal */}
      {maintenanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Schedule Maintenance: {asset.name}</h3>

            <form onSubmit={handleScheduleMaintenance} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Type</label>
                  <select
                    value={maintType}
                    onChange={(e) => setMaintType(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs"
                  >
                    <option value="Preventive">Preventive</option>
                    <option value="Corrective">Corrective</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Priority</label>
                  <select
                    value={maintPriority}
                    onChange={(e) => setMaintPriority(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Due Date</label>
                <input
                  type="date"
                  required
                  value={maintDueDate}
                  onChange={(e) => setMaintDueDate(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Technician / Agency</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Er. Rajesh Kumar / Vendor Engineer"
                  value={maintTech}
                  onChange={(e) => setMaintTech(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Estimated Cost (INR)</label>
                <input
                  type="number"
                  min="0"
                  value={maintCost}
                  onChange={(e) => setMaintCost(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Service Description</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Describe repair or calibration work to be performed..."
                  value={maintDesc}
                  onChange={(e) => setMaintDesc(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setMaintenanceModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold shadow-xs disabled:opacity-50"
                >
                  {actionLoading ? 'Scheduling...' : 'Schedule Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
