import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { MapPin, Plus, Edit2, Trash2, Building, Box, Users } from 'lucide-react';

export const Locations: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [locations, setLocations] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLoc, setEditingLoc] = useState<any>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [department, setDepartment] = useState('');
  const [floor, setFloor] = useState('Ground Floor');
  const [roomNumber, setRoomNumber] = useState('');
  const [capacity, setCapacity] = useState('30');
  const [inCharge, setInCharge] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const [locRes, deptRes] = await Promise.all([
        api.get('/locations'),
        api.get('/departments'),
      ]);
      if (locRes.data.success) setLocations(locRes.data.locations || []);
      if (deptRes.data.success) setDepartments(deptRes.data.departments || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const openCreateModal = () => {
    setEditingLoc(null);
    setName('');
    setCode('');
    setDepartment(departments[0]?._id || '');
    setFloor('1st Floor');
    setRoomNumber('');
    setCapacity('30');
    setInCharge('');
    setDescription('');
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (loc: any) => {
    setEditingLoc(loc);
    setName(loc.name);
    setCode(loc.code);
    setDepartment(loc.department?._id || loc.department);
    setFloor(loc.floor);
    setRoomNumber(loc.roomNumber);
    setCapacity(String(loc.capacity || 30));
    setInCharge(loc.inCharge || '');
    setDescription(loc.description || '');
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      if (editingLoc) {
        await api.put(`/locations/${editingLoc._id}`, {
          name,
          code,
          department,
          floor,
          roomNumber,
          capacity: Number(capacity) || 30,
          inCharge,
          description,
        });
      } else {
        await api.post('/locations', {
          name,
          code,
          department,
          floor,
          roomNumber,
          capacity: Number(capacity) || 30,
          inCharge,
          description,
        });
      }

      setModalOpen(false);
      fetchLocations();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Operation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this lab room? Ensure no assets are housed here first.')) return;
    try {
      await api.delete(`/locations/${id}`);
      fetchLocations();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete location.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Laboratories & Physical Locations</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Physical spaces, lab rooms, workshop bays, and storage lockers across campus buildings.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md shadow-2xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Lab / Room</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-slate-500">Loading lab locations...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {locations.map((loc) => (
            <div
              key={loc._id}
              className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 font-mono font-bold text-[11px] rounded">
                      {loc.code}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm mt-1.5 leading-snug">{loc.name}</h3>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEditModal(loc)}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                        title="Edit Location"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(loc._id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50"
                        title="Delete Location"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="text-xs text-slate-600 space-y-1 pt-1">
                  <div className="flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-400" />
                    <span>Dept: <strong>{loc.department?.name || 'Central'}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>Room: <strong className="font-mono">{loc.roomNumber}</strong> ({loc.floor})</span>
                  </div>
                  {loc.inCharge && (
                    <div className="text-[11px] text-slate-500">
                      Lab In-Charge: <span className="font-medium text-slate-800">{loc.inCharge}</span>
                    </div>
                  )}
                  {loc.description && (
                    <p className="text-[11px] text-slate-500 line-clamp-2 pt-1">{loc.description}</p>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 mt-3 flex items-center justify-between text-xs text-slate-600">
                <span className="flex items-center gap-1 font-mono">
                  <Box className="w-3.5 h-3.5 text-indigo-600" />
                  <strong>{loc.assetCount || 0}</strong> assets housed
                </span>
                <span className="flex items-center gap-1 text-[11px] text-slate-400">
                  <Users className="w-3.5 h-3.5" />
                  Cap: {loc.capacity}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 max-w-md w-full p-5 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">
              {editingLoc ? 'Edit Room / Location' : 'Register New Campus Lab Room'}
            </h3>

            {formError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Location Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CSE Lab 1 (Programming & OS)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Location Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="LOC-CSE-01"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Department <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs"
                  >
                    <option value="">Select Dept</option>
                    {departments.map((d) => (
                      <option key={d._id} value={d._id}>
                        {d.code} - {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Floor Level <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ground Floor, 1st Floor..."
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Room / Door Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="A-101, B-204"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    In-Charge Faculty / Tech
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Er. Rajesh Kumar"
                    value={inCharge}
                    onChange={(e) => setInCharge(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Student / Bench Capacity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Description / Lab Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Key setups, equipment bays, or safety equipment available..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingLoc ? 'Save Changes' : 'Register Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
