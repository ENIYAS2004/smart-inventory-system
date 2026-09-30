import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Search, X, AlertCircle } from 'lucide-react';
import api from '../services/api';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({ isOpen, onClose }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleLookup = async (lookupCode: string) => {
    if (!lookupCode.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/assets/scan/${encodeURIComponent(lookupCode.trim())}`);
      if (res.data.success && res.data.asset) {
        onClose();
        navigate(`/assets/${res.data.asset._id}`);
      } else {
        setError('Asset not found for scanned tag.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'No asset found with this code or serial number.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLookup(code);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-2 text-slate-800">
            <QrCode className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-slate-900 text-base">Scan or Identify Asset</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-200/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center bg-slate-50/60">
            <div className="w-16 h-16 mx-auto rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-3">
              <QrCode className="w-8 h-8" />
            </div>
            <h4 className="text-sm font-medium text-slate-800">QR Code / Barcode Lookup</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              Scan with an external USB handheld barcode reader, paste QR payload, or enter the institutional Asset ID.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Asset Tag / Serial Number / Barcode
              </label>
              <div className="relative">
                <input
                  type="text"
                  autoFocus
                  placeholder="e.g. AST-2026-0001, DL-OPT-7090-9941A..."
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-md text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                />
                <button
                  type="submit"
                  disabled={loading || !code.trim()}
                  className="absolute right-1 top-1 bottom-1 px-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 text-xs font-medium flex items-center"
                >
                  {loading ? 'Searching...' : <Search className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-md">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="pt-2 border-t border-slate-100">
              <span className="text-[11px] font-medium text-slate-500">Quick Test Tags:</span>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {['AST-2026-0001', 'AST-2026-0003', 'AST-2026-0010', 'AST-2026-0005'].map((sample) => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => {
                      setCode(sample);
                      handleLookup(sample);
                    }}
                    className="text-xs px-2 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 rounded text-slate-600 font-mono transition-colors"
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </div>
          </form>
        </div>

        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 border border-slate-300 text-slate-700 text-xs font-medium rounded-md hover:bg-white transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
