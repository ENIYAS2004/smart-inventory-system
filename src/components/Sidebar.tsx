import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Box,
  Layers,
  ArrowLeftRight,
  Wrench,
  BarChart3,
  Building,
  MapPin,
  Users,
  ShieldCheck,
  Settings,
  X,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isDeptHead = user?.role === 'DEPARTMENT_HEAD';

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
      isActive
        ? 'bg-indigo-50 text-indigo-700 font-semibold border-r-2 border-indigo-600'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
    }`;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200 lg:hidden">
          <span className="font-bold text-slate-800 text-sm">Navigation Menu</span>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Main Module */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Core Lifecycle
            </div>
            <nav className="space-y-1">
              <NavLink to="/dashboard" onClick={onClose} className={navItemClass}>
                <LayoutDashboard className="w-4 h-4 text-slate-500" />
                <span>Dashboard</span>
              </NavLink>

              <NavLink to="/assets" onClick={onClose} className={navItemClass}>
                <Box className="w-4 h-4 text-slate-500" />
                <span>Asset Register</span>
              </NavLink>

              <NavLink to="/stock" onClick={onClose} className={navItemClass}>
                <Layers className="w-4 h-4 text-slate-500" />
                <span>Stock Monitoring</span>
              </NavLink>

              <NavLink to="/circulation" onClick={onClose} className={navItemClass}>
                <ArrowLeftRight className="w-4 h-4 text-slate-500" />
                <span>Check-In / Check-Out</span>
              </NavLink>

              <NavLink to="/maintenance" onClick={onClose} className={navItemClass}>
                <Wrench className="w-4 h-4 text-slate-500" />
                <span>Maintenance</span>
              </NavLink>

              <NavLink to="/reports" onClick={onClose} className={navItemClass}>
                <BarChart3 className="w-4 h-4 text-slate-500" />
                <span>Reports & Analytics</span>
              </NavLink>
            </nav>
          </div>

          {/* Institutional Setup */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Campus Structure
            </div>
            <nav className="space-y-1">
              <NavLink to="/departments" onClick={onClose} className={navItemClass}>
                <Building className="w-4 h-4 text-slate-500" />
                <span>Departments</span>
              </NavLink>

              <NavLink to="/locations" onClick={onClose} className={navItemClass}>
                <MapPin className="w-4 h-4 text-slate-500" />
                <span>Labs & Locations</span>
              </NavLink>

              {(isAdmin || isDeptHead) && (
                <NavLink to="/users" onClick={onClose} className={navItemClass}>
                  <Users className="w-4 h-4 text-slate-500" />
                  <span>Faculty & Staff</span>
                </NavLink>
              )}
            </nav>
          </div>

          {/* Governance & Audit */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Governance
            </div>
            <nav className="space-y-1">
              {isAdmin && (
                <NavLink to="/audit-logs" onClick={onClose} className={navItemClass}>
                  <ShieldCheck className="w-4 h-4 text-slate-500" />
                  <span>Audit Trail</span>
                </NavLink>
              )}

              <NavLink to="/settings" onClick={onClose} className={navItemClass}>
                <Settings className="w-4 h-4 text-slate-500" />
                <span>System & Backup</span>
              </NavLink>
            </nav>
          </div>
        </div>

        {/* Institution Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/70">
          <div className="px-2 py-1.5 text-[11px] text-slate-500">
            <div className="font-semibold text-slate-700">MERN College Portal</div>
            <div className="text-[10px] text-slate-400">Academic Year 2025–2026</div>
          </div>
        </div>
      </aside>
    </>
  );
};
