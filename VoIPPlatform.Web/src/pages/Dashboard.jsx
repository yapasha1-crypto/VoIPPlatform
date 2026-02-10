import { useAuth } from '../context/AuthContext';
import ResellerDashboard from './ResellerDashboard';
import CompanyDashboard from './CompanyDashboard';
import UserDashboard from './UserDashboard';

/**
 * Smart Dashboard Router (Phase 5.3)
 * Routes to appropriate dashboard based on user role:
 * - Reseller → ResellerDashboard (Aggregated multi-company stats)
 * - Company → CompanyDashboard (Live channel monitor)
 * - User/Customer → UserDashboard (Personal stats)
 * - Admin → UserDashboard (Can switch to admin view via settings)
 */
const Dashboard = () => {
  const { user } = useAuth();

  // Route based on user role
  if (user?.role === 'Reseller') {
    return <ResellerDashboard />;
  }

  if (user?.role === 'Company') {
    return <CompanyDashboard />;
  }

  // Default: User, Customer, Admin (all use UserDashboard)
  return <UserDashboard />;
};

export default Dashboard;
