import React, { useState } from 'react';
import { signInWithGoogle, signInAdmin } from '../lib/firebase';
import { Activity, ShieldCheck, Lock, User as UserIcon, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Auth: React.FC = () => {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error("Google Sign-In Error:", err);
      if (err.code === 'auth/network-request-failed') {
        setError('Network error: Please check your internet connection or disable ad-blockers/VPNs and try again.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Popup blocked: Please allow popups for this site to sign in with Google.');
      } else {
        setError(err.message || 'Google sign-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInAdmin(username, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-gray-100"
      >
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-50 rounded-2xl mb-6">
            <Activity className="w-12 h-12 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Healix</h1>
          <p className="text-gray-500">Your intelligent personal health companion</p>
        </div>

        <AnimatePresence mode="wait">
          {!isAdminMode ? (
            <motion.div
              key="google"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl">
                <ShieldCheck className="w-6 h-6 text-green-600 mt-1 shrink-0" />
                <div>
                  <h3 className="font-semibold text-sm">Secure Data</h3>
                  <p className="text-xs text-gray-500">Your health data is encrypted and stored securely with Firebase.</p>
                </div>
              </div>

              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 py-4 rounded-2xl font-semibold text-gray-700 hover:bg-gray-50 hover:border-blue-200 transition-all duration-300 shadow-sm disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                ) : (
                  <>
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
                    Continue with Google
                  </>
                )}
              </button>

              {error && <p className="text-xs text-red-500 text-center bg-red-50 p-3 rounded-xl border border-red-100">{error}</p>}

              <button
                onClick={() => setIsAdminMode(true)}
                className="w-full text-sm text-gray-400 hover:text-blue-600 transition-colors"
              >
                Admin Login
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="admin"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-blue-600" />
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="healix"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-blue-600" />
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>

                {error && <p className="text-xs text-red-500 text-center">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-100"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Login as Admin'}
                </button>
              </form>

              <button
                onClick={() => setIsAdminMode(false)}
                className="w-full text-sm text-gray-400 hover:text-blue-600 transition-colors"
              >
                Back to Patient Login
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="mt-8 text-center text-xs text-gray-400">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
};
