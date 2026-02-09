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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const { logout, user } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Users', href: '/users', icon: Users, adminOnly: true },
    { name: 'Profile', href: '/profile', icon: UserCircle },
    { name: 'Call History', href: '/dashboard/call-history', icon: History },
  ];

  const filteredNav = navigation.filter(
    (item) => !item.adminOnly || user?.role === 'Admin'
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
            <span className="font-medium">{item.name}</span>
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

        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-red-900/20 hover:text-red-400 transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
