import { useState } from 'react';
import { X, Eye, EyeOff, Copy, Check, PhoneForwarded, Smartphone, Wifi } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const HowToCallModal = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('pc');
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  // SIP Configuration
  const sipConfig = {
    username: user?.username || 'your-username',
    password: '••••••••', // Placeholder - users must use their actual password
    server: 'Your-Server-IP', // Replace with actual server IP
    port: '5060'
  };

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`${field} copied to clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'pc', label: 'PC Client', icon: PhoneForwarded },
    { id: 'mobile', label: 'Mobile App', icon: Smartphone },
    { id: 'sip', label: 'SIP Device', icon: Wifi }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-violet-600 to-purple-700 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <PhoneForwarded className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">How to Call</h2>
                <p className="text-violet-100 text-sm">Setup guide for making calls</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-violet-700 shadow-lg'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {/* PC Client Tab */}
          {activeTab === 'pc' && (
            <div className="space-y-6">
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <PhoneForwarded className="w-5 h-5 text-violet-400" />
                  VoipSoftClient Setup
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-slate-300 mb-3">
                      Download and install <span className="text-violet-400 font-semibold">VoipSoftClient</span> for Windows or Mac.
                    </p>
                    <ol className="list-decimal list-inside space-y-2 text-slate-400 text-sm">
                      <li>Open VoipSoftClient application</li>
                      <li>Go to <span className="text-white font-medium">Settings → Account</span></li>
                      <li>Click <span className="text-white font-medium">Add New Account</span></li>
                      <li>Enter your credentials below:</li>
                    </ol>
                  </div>

                  {/* Credentials Display */}
                  <div className="bg-slate-900 rounded-lg p-4 space-y-3 mt-4">
                    <div>
                      <label className="text-xs text-slate-500 uppercase tracking-wide">Username</label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="flex-1 bg-slate-800 px-3 py-2 rounded text-violet-400 font-mono text-sm">
                          {sipConfig.username}
                        </code>
                        <button
                          onClick={() => handleCopy(sipConfig.username, 'Username')}
                          className="px-3 py-2 bg-violet-600 hover:bg-violet-700 rounded text-white transition-colors"
                        >
                          {copiedField === 'Username' ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-slate-500 uppercase tracking-wide">Password</label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="flex-1 bg-slate-800 px-3 py-2 rounded text-slate-400 font-mono text-sm">
                          {showPassword ? 'Use your account password' : sipConfig.password}
                        </code>
                        <button
                          onClick={() => setShowPassword(!showPassword)}
                          className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-white transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Use the same password you login to this platform with
                      </p>
                    </div>

                    <div>
                      <label className="text-xs text-slate-500 uppercase tracking-wide">Server</label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="flex-1 bg-slate-800 px-3 py-2 rounded text-violet-400 font-mono text-sm">
                          {sipConfig.server}
                        </code>
                        <button
                          onClick={() => handleCopy(sipConfig.server, 'Server')}
                          className="px-3 py-2 bg-violet-600 hover:bg-violet-700 rounded text-white transition-colors"
                        >
                          {copiedField === 'Server' ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-slate-500 uppercase tracking-wide">Port</label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="flex-1 bg-slate-800 px-3 py-2 rounded text-violet-400 font-mono text-sm">
                          {sipConfig.port}
                        </code>
                        <button
                          onClick={() => handleCopy(sipConfig.port, 'Port')}
                          className="px-3 py-2 bg-violet-600 hover:bg-violet-700 rounded text-white transition-colors"
                        >
                          {copiedField === 'Port' ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-violet-900/20 border border-violet-700/30 rounded-lg p-3">
                    <p className="text-sm text-violet-300">
                      <strong>Tip:</strong> After entering your credentials, click "Register" and wait for the green "Connected" status.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mobile App Tab */}
          {activeTab === 'mobile' && (
            <div className="space-y-6">
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-violet-400" />
                  YourDialer Mobile App
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-slate-300 mb-3">
                      Download <span className="text-violet-400 font-semibold">YourDialer</span> from the App Store (iOS) or Google Play (Android).
                    </p>
                    <ol className="list-decimal list-inside space-y-2 text-slate-400 text-sm">
                      <li>Open the YourDialer app</li>
                      <li>Tap <span className="text-white font-medium">Menu → Accounts</span></li>
                      <li>Tap <span className="text-white font-medium">+ Add Account</span></li>
                      <li>Select <span className="text-white font-medium">SIP Account</span></li>
                      <li>Enter your credentials:</li>
                    </ol>
                  </div>

                  {/* Credentials Display */}
                  <div className="bg-slate-900 rounded-lg p-4 space-y-3 mt-4">
                    <div>
                      <label className="text-xs text-slate-500 uppercase tracking-wide">Username</label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="flex-1 bg-slate-800 px-3 py-2 rounded text-violet-400 font-mono text-sm">
                          {sipConfig.username}
                        </code>
                        <button
                          onClick={() => handleCopy(sipConfig.username, 'Username')}
                          className="px-3 py-2 bg-violet-600 hover:bg-violet-700 rounded text-white transition-colors"
                        >
                          {copiedField === 'Username' ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-slate-500 uppercase tracking-wide">Password</label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="flex-1 bg-slate-800 px-3 py-2 rounded text-slate-400 font-mono text-sm">
                          {showPassword ? 'Use your account password' : sipConfig.password}
                        </code>
                        <button
                          onClick={() => setShowPassword(!showPassword)}
                          className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-white transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Use the same password you login to this platform with
                      </p>
                    </div>

                    <div>
                      <label className="text-xs text-slate-500 uppercase tracking-wide">Server</label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="flex-1 bg-slate-800 px-3 py-2 rounded text-violet-400 font-mono text-sm">
                          {sipConfig.server}
                        </code>
                        <button
                          onClick={() => handleCopy(sipConfig.server, 'Server')}
                          className="px-3 py-2 bg-violet-600 hover:bg-violet-700 rounded text-white transition-colors"
                        >
                          {copiedField === 'Server' ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-slate-500 uppercase tracking-wide">Port</label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="flex-1 bg-slate-800 px-3 py-2 rounded text-violet-400 font-mono text-sm">
                          {sipConfig.port}
                        </code>
                        <button
                          onClick={() => handleCopy(sipConfig.port, 'Port')}
                          className="px-3 py-2 bg-violet-600 hover:bg-violet-700 rounded text-white transition-colors"
                        >
                          {copiedField === 'Port' ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-violet-900/20 border border-violet-700/30 rounded-lg p-3">
                    <p className="text-sm text-violet-300">
                      <strong>Tip:</strong> Enable "Auto-Register" to stay connected even when the app is closed.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SIP Device Tab */}
          {activeTab === 'sip' && (
            <div className="space-y-6">
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Wifi className="w-5 h-5 text-violet-400" />
                  Generic SIP Device Configuration
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-slate-300 mb-3">
                      Configure any SIP-compatible device (IP Phone, ATA, PBX) with these credentials:
                    </p>
                  </div>

                  {/* Credentials Display */}
                  <div className="bg-slate-900 rounded-lg p-4 space-y-3">
                    <div>
                      <label className="text-xs text-slate-500 uppercase tracking-wide">SIP Username / Extension</label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="flex-1 bg-slate-800 px-3 py-2 rounded text-violet-400 font-mono text-sm">
                          {sipConfig.username}
                        </code>
                        <button
                          onClick={() => handleCopy(sipConfig.username, 'Username')}
                          className="px-3 py-2 bg-violet-600 hover:bg-violet-700 rounded text-white transition-colors"
                        >
                          {copiedField === 'Username' ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-slate-500 uppercase tracking-wide">SIP Password / Auth ID</label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="flex-1 bg-slate-800 px-3 py-2 rounded text-slate-400 font-mono text-sm">
                          {showPassword ? 'Use your account password' : sipConfig.password}
                        </code>
                        <button
                          onClick={() => setShowPassword(!showPassword)}
                          className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-white transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Use the same password you login to this platform with
                      </p>
                    </div>

                    <div>
                      <label className="text-xs text-slate-500 uppercase tracking-wide">SIP Server / Registrar</label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="flex-1 bg-slate-800 px-3 py-2 rounded text-violet-400 font-mono text-sm">
                          {sipConfig.server}
                        </code>
                        <button
                          onClick={() => handleCopy(sipConfig.server, 'Server')}
                          className="px-3 py-2 bg-violet-600 hover:bg-violet-700 rounded text-white transition-colors"
                        >
                          {copiedField === 'Server' ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-slate-500 uppercase tracking-wide">SIP Port</label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="flex-1 bg-slate-800 px-3 py-2 rounded text-violet-400 font-mono text-sm">
                          {sipConfig.port}
                        </code>
                        <button
                          onClick={() => handleCopy(sipConfig.port, 'Port')}
                          className="px-3 py-2 bg-violet-600 hover:bg-violet-700 rounded text-white transition-colors"
                        >
                          {copiedField === 'Port' ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-slate-700 pt-3">
                      <label className="text-xs text-slate-500 uppercase tracking-wide">Transport Protocol</label>
                      <div className="mt-1">
                        <code className="bg-slate-800 px-3 py-2 rounded text-violet-400 font-mono text-sm">
                          UDP (Default) / TCP
                        </code>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-slate-500 uppercase tracking-wide">Domain / Realm</label>
                      <div className="mt-1">
                        <code className="bg-slate-800 px-3 py-2 rounded text-violet-400 font-mono text-sm">
                          {sipConfig.server}
                        </code>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-3">
                    <p className="text-sm text-blue-300">
                      <strong>Note:</strong> Some devices may require additional settings like STUN server or codec selection. Contact support if you need assistance.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-800 px-6 py-4 border-t border-slate-700">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">
              Need help? Contact support at{' '}
              <a href="mailto:support@voipplatform.com" className="text-violet-400 hover:text-violet-300">
                support@voipplatform.com
              </a>
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HowToCallModal;
