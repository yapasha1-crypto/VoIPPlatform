import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Phone, LogIn, X } from 'lucide-react';
import Input from '../ui/Input';
import Button from '../ui/Button';

const LoginModal = ({ onClose, onSwitchToRegister }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(username, password);

    if (result.success) {
      onClose();
      navigate('/dashboard');
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 w-10 h-10 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-all shadow-lg z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Logo & Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-violet-600 to-purple-700 rounded-2xl mb-4 shadow-lg shadow-violet-900/50">
            <Phone className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">VoIP Platform</h1>
          <p className="text-slate-400">Sign in to your account</p>
        </div>

        {/* Login Form */}
        <div className="bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              autoComplete="username"
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Sign In</span>
                </>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center space-y-3">
            <p className="text-sm text-slate-400">
              Test users: <span className="text-violet-400 font-medium">reseller</span> | <span className="text-violet-400 font-medium">company</span> | <span className="text-violet-400 font-medium">agent</span> | <span className="text-violet-400 font-medium">user</span>
            </p>
            <p className="text-xs text-slate-500">
              Password for all: <span className="text-violet-400 font-medium">Password123!</span>
            </p>
            <p className="text-sm text-slate-400">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
              >
                Create one here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
