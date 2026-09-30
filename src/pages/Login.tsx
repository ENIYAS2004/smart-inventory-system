import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, Lock, Mail, Eye, EyeOff, ShieldCheck, AlertCircle, ArrowRight, UserPlus, LogIn, User } from 'lucide-react';

export const Login: React.FC = () => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'STAFF' | 'DEPARTMENT_HEAD'>('STAFF');
  const [designation, setDesignation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide your email address and password.');
      return;
    }

    setLoading(true);
    setError(null);

    let res;
    if (isRegisterMode) {
      if (!name) {
        setError('Please provide your full name.');
        setLoading(false);
        return;
      }
      res = await register({
        name,
        email,
        password,
        role,
        designation: designation || (role === 'ADMIN' ? 'Administrator' : 'Staff Member'),
      });
    } else {
      res = await login(email, password);
    }

    setLoading(false);

    if (res.success) {
      navigate('/dashboard');
    } else {
      setError(res.message || 'Authentication failed. Please check your credentials.');
    }
  };

  const fillCredentials = (demoEmail: string, demoPass = 'password123') => {
    setIsRegisterMode(false);
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">
              SMART INVENTORY
            </h1>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Asset & Equipment Management
            </p>
          </div>
        </div>
        <h2 className="mt-4 text-center text-lg font-semibold text-slate-800">
          {isRegisterMode ? 'Create Personal or Institutional Account' : 'Sign in to your Institutional Account'}
        </h2>
        <p className="text-center text-xs text-slate-500 mt-1">
          Authorized faculty, laboratory technicians, evaluators, and administrators
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 sm:rounded-lg sm:px-10">
          {/* Sign In vs Register Tabs */}
          <div className="flex border-b border-slate-200 mb-6">
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(false);
                setError(null);
              }}
              className={`flex-1 py-2 text-center text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 transition-colors ${
                !isRegisterMode
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(true);
                setError(null);
              }}
              className={`flex-1 py-2 text-center text-xs font-bold border-b-2 flex items-center justify-center gap-1.5 transition-colors ${
                isRegisterMode
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register Account</span>
            </button>
          </div>

          <form className="space-y-4" onSubmit={handleAuthSubmit}>
            {error && (
              <div className="p-3 rounded-md bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-700 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {isRegisterMode && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Eniya Siva"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Email Address (Personal or Institutional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="e.g. eniyasiva2004@gmail.com, admin@inventory.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 pr-10 py-2 border border-slate-300 rounded-md text-sm placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {isRegisterMode && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    System Role
                  </label>
                  <select
                    value={role}
                    onChange={(e: any) => setRole(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs"
                  >
                    <option value="ADMIN">ADMIN (Full Access)</option>
                    <option value="STAFF">STAFF (Lab Tech)</option>
                    <option value="DEPARTMENT_HEAD">DEPARTMENT HEAD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Lead Engineer"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md text-xs"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-xs text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors mt-2"
            >
              {loading ? (
                'Processing...'
              ) : isRegisterMode ? (
                <>
                  <span>Create Account & Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Panel */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Direct Demo Logins (Click to autofill):</span>
            </div>
            <div className="space-y-1.5">
              {/* Personal Gmail Admin profile */}
              <button
                type="button"
                onClick={() => fillCredentials('eniyasiva2004@gmail.com')}
                className="w-full text-left px-3 py-2 rounded border border-indigo-200 bg-indigo-50/40 hover:bg-indigo-50 transition-colors flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-semibold text-indigo-900">Personal Admin</span>
                  <span className="text-indigo-600 ml-1.5 font-mono">eniyasiva2004@gmail.com</span>
                </div>
                <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.5 rounded font-semibold">
                  Admin
                </span>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('admin@inventory.com')}
                className="w-full text-left px-3 py-2 rounded border border-slate-200 hover:bg-slate-50 transition-colors flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-semibold text-slate-800">Campus Admin</span>
                  <span className="text-slate-500 ml-1.5 font-mono">admin@inventory.com</span>
                </div>
                <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-semibold">
                  Full Access
                </span>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('staff@inventory.com')}
                className="w-full text-left px-3 py-2 rounded border border-slate-200 hover:bg-slate-50 transition-colors flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-semibold text-slate-800">Lab Staff</span>
                  <span className="text-slate-500 ml-1.5 font-mono">staff@inventory.com</span>
                </div>
                <span className="text-[10px] bg-cyan-100 text-cyan-800 px-1.5 py-0.5 rounded font-semibold">
                  Check-in/out & QR
                </span>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials('head@inventory.com')}
                className="w-full text-left px-3 py-2 rounded border border-slate-200 hover:bg-slate-50 transition-colors flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-semibold text-slate-800">Dept Head</span>
                  <span className="text-slate-500 ml-1.5 font-mono">head@inventory.com</span>
                </div>
                <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-semibold">
                  Dept Reports
                </span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 text-center mt-2.5">
              Default password for all accounts: <code className="font-mono text-slate-600 bg-slate-100 px-1 rounded">password123</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
