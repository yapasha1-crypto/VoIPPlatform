import { Link, Outlet } from 'react-router-dom';
import { Phone, Menu, X } from 'lucide-react';
import { useState } from 'react';
import LoginModal from '../modals/LoginModal';
import RegisterModal from '../modals/RegisterModal';

const PublicLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Contact', href: '#contact' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-900">
      {/* Glassmorphism Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-md bg-slate-900/80 border-b border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-purple-700 rounded-lg flex items-center justify-center group-hover:shadow-lg group-hover:shadow-violet-500/50 transition-all">
                <Phone className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white hidden sm:block">
                VoIP Platform
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="text-slate-300 hover:text-white transition-colors font-medium"
                >
                  {item.name}
                </Link>
              ))}

              {/* Auth Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="px-5 py-2 text-slate-300 hover:text-white font-medium transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={() => setShowRegisterModal(true)}
                  className="px-6 py-2 bg-gradient-to-r from-violet-600 to-purple-700 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-violet-500/50 transition-all"
                >
                  Get Started
                </button>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-white transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800/50 backdrop-blur-md bg-slate-900/95">
            <div className="px-4 py-4 space-y-3">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="block px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-lg transition-all"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <button
                onClick={() => {
                  setShowLoginModal(true);
                  setMobileMenuOpen(false);
                }}
                className="w-full px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-lg font-medium transition-all"
              >
                Login
              </button>
              <button
                onClick={() => {
                  setShowRegisterModal(true);
                  setMobileMenuOpen(false);
                }}
                className="w-full px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-700 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-violet-500/50 transition-all"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Professional Footer */}
      <footer className="bg-slate-950 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-purple-700 rounded-lg flex items-center justify-center">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-white">VoIP Platform</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed max-w-md">
                Enterprise-grade VoIP solutions for businesses of all sizes.
                Reliable, scalable, and secure communication infrastructure.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-white font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/" className="text-slate-400 hover:text-violet-400 transition-colors text-sm">
                    Home
                  </Link>
                </li>
                <li>
                  <a href="#contact" className="text-slate-400 hover:text-violet-400 transition-colors text-sm">
                    Contact
                  </a>
                </li>
                <li>
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="text-slate-400 hover:text-violet-400 transition-colors text-sm"
                  >
                    Login
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setShowRegisterModal(true)}
                    className="text-slate-400 hover:text-violet-400 transition-colors text-sm"
                  >
                    Register
                  </button>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-white font-semibold mb-4">Contact</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li>Email: info@voipplatform.com</li>
                <li>Phone: +1 (555) 123-4567</li>
                <li>Support: 24/7 Available</li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-8 pt-8 border-t border-slate-800">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-slate-500 text-sm">
                &copy; {new Date().getFullYear()} VoIP Platform. All rights reserved.
              </p>
              <div className="flex gap-6">
                <a href="#" className="text-slate-500 hover:text-violet-400 transition-colors text-sm">
                  Privacy Policy
                </a>
                <a href="#" className="text-slate-500 hover:text-violet-400 transition-colors text-sm">
                  Terms of Service
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modals */}
      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onSwitchToRegister={() => {
            setShowLoginModal(false);
            setShowRegisterModal(true);
          }}
        />
      )}

      {showRegisterModal && (
        <RegisterModal
          onClose={() => setShowRegisterModal(false)}
          onSwitchToLogin={() => {
            setShowRegisterModal(false);
            setShowLoginModal(true);
          }}
        />
      )}
    </div>
  );
};

export default PublicLayout;
