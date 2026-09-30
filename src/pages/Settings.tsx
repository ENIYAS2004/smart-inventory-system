import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Settings as SettingsIcon, Database, Server, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export const Settings: React.FC = () => {
  const [statusData, setStatusData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reseedLoading, setReseedLoading] = useState(false);
  const [reseedSuccess, setReseedSuccess] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await api.get('/system/status');
      if (res.data.success) {
        setStatusData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleReseed = async () => {
    if (!window.confirm('Reset and re-seed the college database with fresh demo records?')) return;
    setReseedLoading(true);
    setReseedSuccess(null);
    try {
      const res = await api.post('/system/seed');
      if (res.data.success) {
        setReseedSuccess('Demo dataset successfully re-seeded!');
        fetchStatus();
      }
    } catch (err: any) {
      alert('Failed to reseed database: ' + (err.response?.data?.message || err.message));
    } finally {
      setReseedLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">System Configuration & Data Management</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Backend server status, MongoDB persistence metrics, and demo environment utilities.
        </p>
      </div>

      {reseedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-md flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{reseedSuccess}</span>
        </div>
      )}

      {/* Database & MERN Architecture Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Database className="w-4 h-4 text-indigo-600" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Database Operational Status
          </h2>
        </div>

        {loading ? (
          <div className="text-xs text-slate-500 py-4">Checking database connectivity...</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Engine</span>
              <div className="font-bold text-slate-900 text-sm mt-0.5">MongoDB + Mongoose</div>
              <div className="text-[10px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Connected
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Assets</span>
              <div className="font-bold text-slate-900 font-mono text-base mt-0.5">
                {statusData?.records?.assets || 0}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Cataloged items</div>
            </div>

            <div className="p-3 bg-slate-50 rounded border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Departments</span>
              <div className="font-bold text-slate-900 font-mono text-base mt-0.5">
                {statusData?.records?.departments || 0}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Academic wings</div>
            </div>

            <div className="p-3 bg-slate-50 rounded border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Locations & Labs</span>
              <div className="font-bold text-slate-900 font-mono text-base mt-0.5">
                {statusData?.records?.locations || 0}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Physical rooms</div>
            </div>

            <div className="p-3 bg-slate-50 rounded border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Maintenance Records</span>
              <div className="font-bold text-slate-900 font-mono text-base mt-0.5">
                {statusData?.records?.maintenance || 0}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Service tickets</div>
            </div>

            <div className="p-3 bg-slate-50 rounded border border-slate-100">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Circulation Events</span>
              <div className="font-bold text-slate-900 font-mono text-base mt-0.5">
                {statusData?.records?.usage || 0}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Check-ins & check-outs</div>
            </div>
          </div>
        )}
      </div>

      {/* Demo Reset Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
          Evaluator Demonstration Reset
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          If you want to reset all records back to the initial sample college dataset (with default users, departments, labs, 22+ assets, QR codes, and maintenance items), click the button below.
        </p>

        <button
          onClick={handleReseed}
          disabled={reseedLoading}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${reseedLoading ? 'animate-spin' : ''}`} />
          <span>{reseedLoading ? 'Reseeding Database...' : 'Reseed Fresh Demo College Data'}</span>
        </button>
      </div>

      {/* Architecture Spec Info */}
      <div className="bg-slate-100 border border-slate-200 rounded-lg p-5 text-xs text-slate-600 space-y-2">
        <div className="font-bold text-slate-800">MERN Stack Architecture Blueprint</div>
        <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-500">
          <li><strong>MongoDB & Mongoose:</strong> Document persistence with schema validation, ObjectIds, and unique constraints.</li>
          <li><strong>Express.js & Node.js:</strong> Modular REST APIs (/api/assets, /api/usage, /api/maintenance, /api/auth).</li>
          <li><strong>Security:</strong> bcryptjs password hashing and JWT role-based authorization (ADMIN, STAFF, DEPARTMENT_HEAD).</li>
          <li><strong>React & Vite:</strong> Single-page application with React Router, Axios interceptor, and dynamic QR/barcode generation.</li>
        </ul>
      </div>
    </div>
  );
};
