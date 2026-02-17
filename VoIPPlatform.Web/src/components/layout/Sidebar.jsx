import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserCircle,
  Phone,
  MessageSquare,
  DollarSign,
  FileText,
  Settings,
  LogOut,
  History,
  Building2,
  UsersIcon,
  Activity,
  HelpCircle,
  Calculator,
  CreditCard,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import HowToCallModal from '../common/HowToCallModal';

const Sidebar = () => {
  const { logout, user } = useAuth();
  const [showHowToCallModal, setShowHowToCallModal] = useState(false);

  // Phase 5: Role-based navigation
  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: ['Admin', 'Reseller', 'Company', 'User', 'Customer']
    },

    // Reseller-specific
    {
      name: 'Company Management',
      href: '/dashboard/companies',
      icon: Building2,
      roles: ['Reseller'],
      badge: 'Reseller'
    },

    // Company-specific
    {
      name: 'User Management',
      href: '/dashboard/manage-users',
      icon: UsersIcon,
      roles: ['Company'],
      badge: 'Company'
    },
    {
      name: 'Channel Monitor',
      href: '/dashboard/channels',
      icon: Activity,
      roles: ['Company'],
      badge: 'Live'
    },

    // Admin-specific
    {
      name: 'All Users',
      href: '/dashboard/users',
      icon: Users,
      roles: ['Admin'],
      badge: 'Admin'
    },

    // Phase 6: Rates Management
    {
      name: 'Rate Configuration',
      href: '/dashboard/rates/configure',
      icon: Calculator,
      roles: ['Admin', 'Reseller'],
      badge: 'Phase 6'
    },
    {
      name: 'My Rates',
      href: '/dashboard/rates/my-rates',
      icon: DollarSign,
      roles: ['User', 'Company', 'Customer'],
    },

    // Phase 7: Billing & Payments
    {
      name: 'Billing',
      href: '/dashboard/billing',
      icon: CreditCard,
      roles: ['Admin', 'Reseller', 'Company', 'User', 'Customer'],
      badge: 'Phase 7'
    },
    {
      name: 'Invoices',
      href: '/dashboard/invoices',
      icon: FileText,
      roles: ['Admin', 'Reseller', 'Company', 'User', 'Customer'],
    },

    // Common for all roles
    {
      name: 'Profile',
      href: '/dashboard/profile',
      icon: UserCircle,
      roles: ['Admin', 'Reseller', 'Company', 'User', 'Customer']
    },
    {
      name: 'Call History',
      href: '/dashboard/call-history',
      icon: History,
      roles: ['Admin', 'Reseller', 'Company', 'User', 'Customer']
    },
    {
      name: 'SMS Portal',
      href: '/dashboard/sms',
      icon: MessageSquare,
      roles: ['Admin', 'Reseller', 'Company', 'User', 'Customer']
    },
  ];

  // Filter navigation based on user role
  const filteredNav = navigation.filter((item) =>
    item.roles.includes(user?.role || 'Customer')
  );

  return (
    <div className="w-64 h-full bg-slate-950 border-r border-slate-800 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-violet-600 to-purple-700 rounded-lg flex items-center justify-center">
            <Phone className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">VoIP Platform</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
        {filteredNav.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-900/50'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium flex-1">{item.name}</span>
            {item.badge && (
              <span className="text-xs px-2 py-0.5 bg-violet-500/20 text-violet-300 rounded-full">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-4 py-3 bg-slate-900 rounded-lg mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-purple-700 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">
              {user?.username || 'User'}
            </p>
            <p className="text-xs text-slate-500 truncate">{user?.role || 'Customer'}</p>
          </div>
        </div>

        {/* How to Call Button */}
        <button
          onClick={() => setShowHowToCallModal(true)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-violet-900/20 hover:text-violet-400 transition-all mb-2"
        >
          <HelpCircle className="w-5 h-5" />
          <span className="font-medium">How to Call</span>
        </button>

        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-red-900/20 hover:text-red-400 transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>

      {/* How to Call Modal */}
      <HowToCallModal
        isOpen={showHowToCallModal}
        onClose={() => setShowHowToCallModal(false)}
      />
    </div>
  );
};

export default Sidebar;
