import { useState } from 'react';
import { Phone, Globe, Shield, Zap, Users, TrendingUp, MapPin } from 'lucide-react';
import NetworkMap from '../components/ui/NetworkMap';
import LoginModal from '../components/modals/LoginModal';
import RegisterModal from '../components/modals/RegisterModal';

const LandingPage = () => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  const features = [
    {
      icon: Globe,
      title: 'Global Coverage',
      description: 'Connect with anyone, anywhere in the world with our extensive VoIP network.',
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Bank-level encryption and security protocols to protect your communications.',
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Ultra-low latency connections for crystal-clear voice quality.',
    },
    {
      icon: Users,
      title: 'Multi-User Support',
      description: 'Manage multiple accounts and users with advanced role-based access control.',
    },
    {
      icon: TrendingUp,
      title: 'Real-Time Analytics',
      description: 'Comprehensive dashboards and reports to track your communication metrics.',
    },
    {
      icon: Phone,
      title: '24/7 Support',
      description: 'Round-the-clock technical support and customer service.',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 via-slate-900 to-slate-900"></div>

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600/10 border border-violet-500/20 rounded-full mb-8">
              <span className="w-2 h-2 bg-violet-500 rounded-full animate-pulse"></span>
              <span className="text-violet-400 text-sm font-medium">Enterprise VoIP Solution</span>
            </div>

            {/* Heading */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Communication
              <br />
              <span className="bg-gradient-to-r from-violet-400 to-purple-600 bg-clip-text text-transparent">
                Redefined
              </span>
            </h1>

            {/* Description */}
            <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Transform your business communications with our cutting-edge VoIP platform.
              Reliable, scalable, and built for the future.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setShowLoginModal(true)}
                className="px-8 py-4 bg-gradient-to-r from-violet-600 to-purple-700 text-white font-semibold rounded-lg hover:shadow-2xl hover:shadow-violet-500/50 transition-all transform hover:scale-105"
              >
                Get Started
              </button>
              <button
                onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 bg-slate-800 text-white font-semibold rounded-lg border border-slate-700 hover:bg-slate-700 transition-all"
              >
                Learn More
              </button>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-1/4 left-10 w-72 h-72 bg-violet-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl"></div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-slate-950/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-bold text-white mb-4">
              Why Choose Our Platform?
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Built with enterprise-grade technology and designed for seamless communication.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-6 bg-slate-900 border border-slate-800 rounded-xl hover:border-violet-500/50 hover:shadow-lg hover:shadow-violet-500/10 transition-all"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-purple-700 rounded-lg flex items-center justify-center mb-4 group-hover:shadow-lg group-hover:shadow-violet-500/50 transition-all">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Global Network Section */}
      <section id="network" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600/10 border border-violet-500/20 rounded-full mb-6">
              <MapPin className="w-4 h-4 text-violet-400" />
              <span className="text-violet-400 text-sm font-medium">Global Infrastructure</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold text-white mb-4">
              Global Low-Latency Network
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Our strategically positioned servers across 5 continents ensure crystal-clear voice quality
              and minimal latency for your global communications.
            </p>
          </div>

          {/* Network Map */}
          <NetworkMap />

          {/* Server Stats - TODO: Replace with real infrastructure metrics in Phase 9+ */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="text-center p-6 bg-slate-900/50 border border-slate-800 rounded-xl">
              <div className="text-3xl font-bold text-violet-400 mb-2">5</div>
              <div className="text-sm text-slate-400">Data Centers</div>
            </div>
            <div className="text-center p-6 bg-slate-900/50 border border-slate-800 rounded-xl">
              <div className="text-3xl font-bold text-violet-400 mb-2">&lt;50ms</div>
              <div className="text-sm text-slate-400">Avg Latency</div>
            </div>
            <div className="text-center p-6 bg-slate-900/50 border border-slate-800 rounded-xl">
              <div className="text-3xl font-bold text-violet-400 mb-2">99.9%</div>
              <div className="text-sm text-slate-400">Uptime SLA</div>
            </div>
            <div className="text-center p-6 bg-slate-900/50 border border-slate-800 rounded-xl">
              <div className="text-3xl font-bold text-violet-400 mb-2">24/7</div>
              <div className="text-sm text-slate-400">Monitoring</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gradient-to-r from-violet-600/10 to-purple-600/10 border border-violet-500/20 rounded-2xl p-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-slate-400 mb-8">
              Join thousands of businesses already using our platform to power their communications.
            </p>
            <button
              onClick={() => setShowLoginModal(true)}
              className="px-8 py-4 bg-gradient-to-r from-violet-600 to-purple-700 text-white font-semibold rounded-lg hover:shadow-2xl hover:shadow-violet-500/50 transition-all transform hover:scale-105"
            >
              Access Dashboard
            </button>
          </div>
        </div>
      </section>

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

export default LandingPage;
