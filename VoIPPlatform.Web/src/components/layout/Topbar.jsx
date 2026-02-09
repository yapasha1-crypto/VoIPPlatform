import { Bell, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Topbar = () => {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6">
      {/* Search */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Balance */}
        {user?.balance !== undefined && (
          <div className="px-4 py-2 bg-slate-800 rounded-lg border border-slate-700">
            <span className="text-sm text-slate-400">Balance: </span>
            <span className="text-sm font-semibold text-green-400">
              ${user.balance.toFixed(2)}
            </span>
          </div>
        )}

        {/* Notifications */}
        <button className="relative p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-all">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
      </div>
    </header>
  );
};

export default Topbar;
