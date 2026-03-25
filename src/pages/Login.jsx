import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Button from '../components/ui/Button';

export default function Login() {
  const navigate = useNavigate();
  const { switchRole } = useApp();
  const [email, setEmail] = useState('sarah.chen@beroe.com');
  const [password, setPassword] = useState('demo1234');
  const [showPw, setShowPw] = useState(false);

  const handleSignIn = (e) => {
    e.preventDefault();
    switchRole('admin');
    navigate('/dashboard');
  };

  const handleRoleLogin = (role) => {
    switchRole(role);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F0EEE9' }}>
      <div className="w-full max-w-md px-4">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2 mb-8">
          <img src="/BeroeLogo.svg" alt="Beroe" style={{ height: '28px', width: 'auto' }} />
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded"
            style={{ backgroundColor: '#EDE9FF', color: '#4A00F8', letterSpacing: '0.08em' }}
          >
            SIGNAL PLATFORM
          </span>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Sign in to Signal</h1>
          <p className="text-sm text-gray-500 mb-6">Access the Market Report Platform</p>

          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-800 bg-gray-50 focus:bg-white transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-800 bg-gray-50 focus:bg-white transition-colors pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg text-white font-semibold text-sm shadow-sm hover:opacity-90 transition-opacity mt-2"
              style={{ backgroundColor: '#4A00F8' }}
            >
              Sign in
            </button>
          </form>

          {/* Demo roles */}
          <div className="mt-6 pt-5 border-t border-gray-100">
            <p className="text-xs text-gray-500 font-medium text-center mb-3">Demo mode — sign in as:</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'superadmin', label: 'Super Admin', initials: 'MS', color: 'text-purple-700 border-purple-200 bg-purple-50 hover:bg-purple-100' },
                { key: 'admin', label: 'Admin', initials: 'SC', color: 'text-blue-700 border-blue-200 bg-blue-50 hover:bg-blue-100' },
                { key: 'researcher', label: 'Standard User', initials: 'MR', color: 'text-green-700 border-green-200 bg-green-50 hover:bg-green-100' },
              ].map(role => (
                <button
                  key={role.key}
                  onClick={() => handleRoleLogin(role.key)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-xs font-medium transition-colors ${role.color}`}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: '#4A00F8' }}
                  >
                    {role.initials}
                  </div>
                  {role.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Expert survey access is via tokenized email link only
        </p>
      </div>
    </div>
  );
}
