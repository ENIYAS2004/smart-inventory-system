import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowLeft } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-14 h-14 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 mb-4">
        <HelpCircle className="w-7 h-7" />
      </div>
      <h1 className="text-lg font-bold text-slate-900">404 - Page Not Found</h1>
      <p className="text-xs text-slate-500 mt-1 max-w-sm">
        The requested portal endpoint or asset record does not exist or has been relocated.
      </p>
      <Link
        to="/dashboard"
        className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold shadow-2xs transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Dashboard</span>
      </Link>
    </div>
  );
};
