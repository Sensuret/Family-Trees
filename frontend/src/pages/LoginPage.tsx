import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    display_name: '',
    family_code: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await register(form);
      } else {
        await login(form.username, form.password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-2xl backdrop-blur-sm mb-4">
            <svg className="w-12 h-12" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="10" r="6" fill="white" />
              <circle cx="12" cy="30" r="5" fill="white" opacity="0.8" />
              <circle cx="36" cy="30" r="5" fill="white" opacity="0.8" />
              <circle cx="6" cy="44" r="3" fill="white" opacity="0.6" />
              <circle cx="18" cy="44" r="3" fill="white" opacity="0.6" />
              <circle cx="30" cy="44" r="3" fill="white" opacity="0.6" />
              <circle cx="42" cy="44" r="3" fill="white" opacity="0.6" />
              <line x1="24" y1="16" x2="12" y2="25" stroke="white" strokeWidth="2" opacity="0.7" />
              <line x1="24" y1="16" x2="36" y2="25" stroke="white" strokeWidth="2" opacity="0.7" />
              <line x1="12" y1="35" x2="6" y2="41" stroke="white" strokeWidth="1.5" opacity="0.5" />
              <line x1="12" y1="35" x2="18" y2="41" stroke="white" strokeWidth="1.5" opacity="0.5" />
              <line x1="36" y1="35" x2="30" y2="41" stroke="white" strokeWidth="1.5" opacity="0.5" />
              <line x1="36" y1="35" x2="42" y2="41" stroke="white" strokeWidth="1.5" opacity="0.5" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Family Trees</h1>
          <p className="text-white/70 text-lg">Track your family history beautifully</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            {isRegister ? 'Create Account' : 'Welcome Back'}
          </h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Family Code
                  </label>
                  <input
                    type="text"
                    placeholder="Enter or create a family code (e.g., The Smiths)"
                    value={form.family_code}
                    onChange={(e) => setForm({ ...form, family_code: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Share this code with family members so they can join
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    placeholder="Your name"
                    value={form.display_name}
                    onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm"
                    required
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                placeholder="Choose a username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                placeholder="Your personal password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-base hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer border-none disabled:opacity-50 disabled:scale-100"
            >
              {loading ? 'Please wait...' : isRegister ? 'Create Family Account' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
              }}
              className="text-primary hover:text-primary-dark text-sm font-medium cursor-pointer bg-transparent border-none"
            >
              {isRegister
                ? 'Already have an account? Sign in'
                : "New here? Create a family account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
