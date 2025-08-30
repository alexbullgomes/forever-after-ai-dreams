import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/hooks/useRole';
import { supabase } from '@/integrations/supabase/client';
import { Users, UserCheck, Calendar, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

interface CustomerMetrics {
  totalCustomers: number;
  newLeadsThisMonth: number;
  totalAppointments: number;
  recentCustomers: Array<{
    id: string;
    name: string | null;
    email: string | null;
    created_at: string;
    package_consultation: string | null;
  }>;
}

const AdminDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { hasRole, loading: roleLoading } = useRole('admin');
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<CustomerMetrics>({
    totalCustomers: 0,
    newLeadsThisMonth: 0,
    totalAppointments: 0,
    recentCustomers: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only redirect after auth and role loading is complete
    if (!authLoading && !roleLoading) {
      if (!user) {
        navigate('/');
        return;
      }
      if (!hasRole) {
        navigate('/');
        return;
      }
    }
  }, [user, hasRole, authLoading, roleLoading, navigate]);

  useEffect(() => {
    if (hasRole && user) {
      fetchMetrics();
    }
  }, [hasRole, user]);

  const fetchMetrics = async () => {
    try {
      // Get total customers
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, email, created_at, package_consultation')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return;
      }

      // Get appointments count
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('id');

      if (appointmentsError) {
        console.error('Error fetching appointments:', appointmentsError);
      }

      // Calculate metrics
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const newLeadsThisMonth = profiles?.filter(profile => 
        new Date(profile.created_at) >= thisMonth
      ).length || 0;

      setMetrics({
        totalCustomers: profiles?.length || 0,
        newLeadsThisMonth,
        totalAppointments: appointments?.length || 0,
        recentCustomers: profiles?.slice(0, 10) || []
      });
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  if (!user || !hasRole) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  const MetricCard = ({ title, value, icon: Icon, description, color = "blue" }) => (
    <div className="p-6 rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg ${
          color === 'blue' ? 'bg-blue-50' :
          color === 'green' ? 'bg-green-50' :
          color === 'purple' ? 'bg-purple-50' :
          'bg-orange-50'
        }`}>
          <Icon className={`h-5 w-5 ${
            color === 'blue' ? 'text-blue-600' :
            color === 'green' ? 'text-green-600' :
            color === 'purple' ? 'text-purple-600' :
            'text-orange-600'
          }`} />
        </div>
        <TrendingUp className="h-4 w-4 text-green-500" />
      </div>
      <h3 className="font-medium text-gray-600 mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {description && (
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Everafter Photography Admin Panel</p>
            </div>
            <button 
              onClick={() => navigate('/')}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Back to Site
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Customers"
            value={metrics.totalCustomers}
            icon={Users}
            description="Registered users"
            color="blue"
          />
          <MetricCard
            title="New Leads This Month"
            value={metrics.newLeadsThisMonth}
            icon={UserCheck}
            description="Recent sign-ups"
            color="green"
          />
          <MetricCard
            title="Total Appointments"
            value={metrics.totalAppointments}
            icon={Calendar}
            description="Scheduled sessions"
            color="purple"
          />
          <MetricCard
            title="Conversion Rate"
            value="24%"
            icon={TrendingUp}
            description="Leads to appointments"
            color="orange"
          />
        </div>

        {/* Customer Table */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Customers</h3>
            <p className="text-gray-600 mt-1">Latest customer registrations and their consultation preferences</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Package Interest
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sign-up Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {metrics.recentCustomers.length > 0 ? (
                  metrics.recentCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 flex items-center justify-center text-white text-sm font-medium">
                            {customer.name ? customer.name.charAt(0).toUpperCase() : customer.email?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {customer.name || 'Anonymous User'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{customer.email || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          customer.package_consultation 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {customer.package_consultation || 'No preference'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(customer.created_at), 'MMM d, yyyy')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      No customers found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;