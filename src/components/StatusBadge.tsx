import React from 'react';

interface StatusBadgeProps {
  status: string;
  type?: 'status' | 'condition' | 'priority' | 'role';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'status' }) => {
  let style = 'bg-slate-100 text-slate-700 border-slate-200';

  if (type === 'status') {
    switch (status) {
      case 'Available':
        style = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        break;
      case 'In Use':
        style = 'bg-blue-50 text-blue-700 border-blue-200';
        break;
      case 'Under Maintenance':
        style = 'bg-amber-50 text-amber-800 border-amber-200';
        break;
      case 'Damaged':
        style = 'bg-rose-50 text-rose-700 border-rose-200';
        break;
      case 'Retired':
        style = 'bg-slate-100 text-slate-600 border-slate-200';
        break;
    }
  } else if (type === 'condition') {
    switch (status) {
      case 'Excellent':
        style = 'bg-teal-50 text-teal-700 border-teal-200';
        break;
      case 'Good':
        style = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        break;
      case 'Fair':
        style = 'bg-amber-50 text-amber-700 border-amber-200';
        break;
      case 'Poor':
        style = 'bg-orange-50 text-orange-700 border-orange-200';
        break;
      case 'Critical':
        style = 'bg-rose-50 text-rose-700 border-rose-200';
        break;
    }
  } else if (type === 'priority') {
    switch (status) {
      case 'Low':
        style = 'bg-slate-100 text-slate-700 border-slate-200';
        break;
      case 'Medium':
        style = 'bg-blue-50 text-blue-700 border-blue-200';
        break;
      case 'High':
        style = 'bg-amber-50 text-amber-800 border-amber-200';
        break;
      case 'Critical':
        style = 'bg-rose-50 text-rose-800 border-rose-200 font-semibold';
        break;
    }
  } else if (type === 'role') {
    switch (status) {
      case 'ADMIN':
        style = 'bg-indigo-50 text-indigo-700 border-indigo-200';
        break;
      case 'STAFF':
        style = 'bg-cyan-50 text-cyan-700 border-cyan-200';
        break;
      case 'DEPARTMENT_HEAD':
        style = 'bg-purple-50 text-purple-700 border-purple-200';
        break;
    }
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium border rounded ${style}`}
    >
      {status}
    </span>
  );
};
