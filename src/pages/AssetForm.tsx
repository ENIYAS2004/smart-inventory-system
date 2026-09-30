import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { ArrowLeft, Save, AlertCircle, CheckCircle2 } from 'lucide-react';

export const AssetForm: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [departments, setDepartments] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    assetId: '',
    name: '',
    category: 'Computing Equipment',
    description: '',
    department: '',
    location: '',
    manufacturer: '',
    model: '',
    serialNumber: '',
    purchaseDate: new Date().toISOString().slice(0, 10),
    purchaseCost: '0',
    quantity: '1',
    availableQuantity: '1',
    minimumStockLevel: '1',
    unit: 'Units',
    condition: 'Good',
    status: 'Available',
    warrantyExpiry: '',
  });

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [deptRes, locRes] = await Promise.all([
          api.get('/departments'),
          api.get('/locations'),
        ]);

        if (deptRes.data.success) {
          setDepartments(deptRes.data.departments || []);
          if (!isEdit && deptRes.data.departments?.length > 0) {
            setFormData((prev) => ({ ...prev, department: deptRes.data.departments[0]._id }));
          }
        }

        if (locRes.data.success) {
          setLocations(locRes.data.locations || []);
          if (!isEdit && locRes.data.locations?.length > 0) {
            setFormData((prev) => ({ ...prev, location: locRes.data.locations[0]._id }));
          }
        }

        if (isEdit && id) {
          const assetRes = await api.get(`/assets/${id}`);
          if (assetRes.data.success && assetRes.data.asset) {
            const a = assetRes.data.asset;
            setFormData({
              assetId: a.assetId || '',
              name: a.name || '',
              category: a.category || 'Computing Equipment',
              description: a.description || '',
              department: a.department?._id || a.department || '',
              location: a.location?._id || a.location || '',
              manufacturer: a.manufacturer || '',
              model: a.model || '',
              serialNumber: a.serialNumber || '',
              purchaseDate: a.purchaseDate ? new Date(a.purchaseDate).toISOString().slice(0, 10) : '',
              purchaseCost: String(a.purchaseCost || '0'),
              quantity: String(a.quantity || '1'),
              availableQuantity: String(a.availableQuantity || '1'),
              minimumStockLevel: String(a.minimumStockLevel || '1'),
              unit: a.unit || 'Units',
              condition: a.condition || 'Good',
              status: a.status || 'Available',
              warrantyExpiry: a.warrantyExpiry ? new Date(a.warrantyExpiry).toISOString().slice(0, 10) : '',
            });
          }
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error loading form data.');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchMetadata();
  }, [id, isEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.serialNumber || !formData.department || !formData.location) {
      setError('Please fill in all required fields (Name, Serial Number, Department, and Location).');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        purchaseCost: Number(formData.purchaseCost) || 0,
        quantity: Number(formData.quantity) || 1,
        availableQuantity: Number(formData.availableQuantity) || 1,
        minimumStockLevel: Number(formData.minimumStockLevel) || 1,
      };

      let res;
      if (isEdit) {
        res = await api.put(`/assets/${id}`, payload);
      } else {
        res = await api.post('/assets', payload);
      }

      if (res.data.success) {
        const targetId = res.data.asset?._id || id;
        navigate(`/assets/${targetId}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save asset.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <span className="text-xs text-slate-500">Loading asset form...</span>
      </div>
    );
  }

  // Filter locations by selected department if matching
  const filteredLocations = formData.department
    ? locations.filter((loc) => loc.department?._id === formData.department || loc.department === formData.department)
    : locations;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <Link
          to={isEdit ? `/assets/${id}` : '/assets'}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Cancel & Return</span>
        </Link>
        <span className="text-xs text-slate-400 font-mono">
          {isEdit ? `Editing ${formData.assetId}` : 'New Registration'}
        </span>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70">
          <h1 className="text-base font-bold text-slate-900">
            {isEdit ? 'Update Institutional Asset Record' : 'Register New College Asset'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Fill in the asset specifications, serial number, and laboratory placement.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-md flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Identification */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-1.5">
              1. Asset Identification & Categorization
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Asset Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Dell OptiPlex 7090 Desktop"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category <span className="text-rose-500">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:ring-indigo-500 focus:border-indigo-500"
                >
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Asset ID <span className="text-slate-400 font-normal">(Leave blank to auto-generate)</span>
                </label>
                <input
                  type="text"
                  name="assetId"
                  placeholder="e.g. AST-2026-0025"
                  value={formData.assetId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-mono focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Serial Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="serialNumber"
                  required
                  placeholder="e.g. DL-OPT-7090-9941A"
                  value={formData.serialNumber}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-mono focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Manufacturer / OEM
                </label>
                <input
                  type="text"
                  name="manufacturer"
                  placeholder="e.g. Dell Technologies, Rigol, Fluke"
                  value={formData.manufacturer}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Model Specification
                </label>
                <input
                  type="text"
                  name="model"
                  placeholder="e.g. OptiPlex 7090 MT, DS1054Z"
                  value={formData.model}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Department Placement */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-1.5">
              2. Department Assignment & Campus Location
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department <span className="text-rose-500">*</span>
                </label>
                <select
                  name="department"
                  required
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Laboratory / Room Location <span className="text-rose-500">*</span>
                </label>
                <select
                  name="location"
                  required
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select Location</option>
                  {(filteredLocations.length > 0 ? filteredLocations : locations).map((loc) => (
                    <option key={loc._id} value={loc._id}>
                      {loc.name} ({loc.roomNumber} - {loc.floor})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Financial & Stock Thresholds */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-1.5">
              3. Procurement, Stock & Warranty
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Purchase Cost (INR) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  name="purchaseCost"
                  required
                  min="0"
                  value={formData.purchaseCost}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Purchase Date
                </label>
                <input
                  type="date"
                  name="purchaseDate"
                  value={formData.purchaseDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Warranty Expiry Date
                </label>
                <input
                  type="date"
                  name="warrantyExpiry"
                  value={formData.warrantyExpiry}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Unit of Measure
                </label>
                <input
                  type="text"
                  name="unit"
                  placeholder="Units, Kits, Reels, Sets"
                  value={formData.unit}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Total Quantity
                </label>
                <input
                  type="number"
                  name="quantity"
                  min="0"
                  value={formData.quantity}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Available Quantity
                </label>
                <input
                  type="number"
                  name="availableQuantity"
                  min="0"
                  value={formData.availableQuantity}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Min Stock Threshold
                </label>
                <input
                  type="number"
                  name="minimumStockLevel"
                  min="0"
                  value={formData.minimumStockLevel}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Current Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs"
                >
                  <option value="Available">Available</option>
                  <option value="In Use">In Use</option>
                  <option value="Under Maintenance">Under Maintenance</option>
                  <option value="Damaged">Damaged</option>
                  <option value="Retired">Retired</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Asset Condition
                </label>
                <select
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs"
                >
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Asset Description & Technical Notes
            </label>
            <textarea
              name="description"
              rows={3}
              placeholder="Processor, RAM specs, voltage tolerances, interface ports, or lab usage guidelines..."
              value={formData.description}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Link
              to={isEdit ? `/assets/${id}` : '/assets'}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md text-xs font-medium hover:bg-slate-50 transition-colors"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving Asset...' : isEdit ? 'Save Changes' : 'Register Asset'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
