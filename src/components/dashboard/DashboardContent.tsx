import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Users, UserCheck, Calendar, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';

interface CustomerMetrics {
  totalCustomers: number;
  newLeadsThisMonth: number;
  usersWithPhoneNumbers: number;
  unreadMessages: number;
  recentCustomers: Array<{
    id: string;
    name: string | null;
    email: string | null;
    created_at: string;
    user_number: string | null;
    status: string | null;
  }>;
}

const DashboardContent = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<CustomerMetrics>({
    totalCustomers: 0,
    newLeadsThisMonth: 0,
    usersWithPhoneNumbers: 0,
    unreadMessages: 0,
    recentCustomers: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      // Get total customers
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, email, created_at, user_number, status')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return;
      }

      // Get unread messages count
      const { data: conversations, error: conversationsError } = await supabase
        .from('conversations')
        .select('id')
        .eq('new_msg', 'unread');

      if (conversationsError) {
        console.error('Error fetching conversations:', conversationsError);
      }

      // Calculate metrics
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const newLeadsThisMonth = profiles?.filter(profile => 
        new Date(profile.created_at) >= thisMonth
      ).length || 0;

      const usersWithPhoneNumbers = profiles?.filter(profile => 
        profile.user_number && profile.user_number.trim() !== ''
      ).length || 0;

      setMetrics({
        totalCustomers: profiles?.length || 0,
        newLeadsThisMonth,
        usersWithPhoneNumbers,
        unreadMessages: conversations?.length || 0,
        recentCustomers: profiles?.slice(0, 10) || []
      });
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  const MetricCard = ({ title, value, icon: Icon, description, color = "blue", onClick = null }) => {
    const isUnreadMessages = title === "Unread Messages";
    
    return (
      <div 
        className={`p-6 rounded-xl border shadow-sm hover:shadow-md transition-all duration-300 ${
          isUnreadMessages 
            ? 'bg-gradient-to-br from-rose-500 to-pink-500 border-rose-400 text-white hover:shadow-rose-200 hover:scale-105' 
            : 'border-gray-200 bg-white'
        } ${
          onClick ? 'cursor-pointer hover:border-gray-300' : ''
        }`}
        onClick={onClick}
      >
        <div className="flex items-center justify-between mb-4">
          <div className={`p-2 rounded-lg ${
            isUnreadMessages 
              ? 'bg-white/20 backdrop-blur-sm' 
              : color === 'blue' ? 'bg-blue-50' :
                color === 'green' ? 'bg-green-50' :
                color === 'purple' ? 'bg-purple-50' :
                'bg-orange-50'
          }`}>
            <Icon className={`h-5 w-5 ${
              isUnreadMessages 
                ? 'text-white' 
                : color === 'blue' ? 'text-blue-600' :
                  color === 'green' ? 'text-green-600' :
                  color === 'purple' ? 'text-purple-600' :
                  'text-orange-600'
            }`} />
          </div>
        </div>
        <h3 className={`font-medium mb-1 ${
          isUnreadMessages ? 'text-white/90' : 'text-gray-600'
        }`}>{title}</h3>
        <p className={`text-2xl font-bold ${
          isUnreadMessages ? 'text-white' : 'text-gray-900'
        }`}>{value}</p>
        {description && (
          <p className={`text-sm mt-1 ${
            isUnreadMessages ? 'text-white/80' : 'text-gray-500'
          }`}>{description}</p>
        )}
      </div>
    );
  };

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of your photography business</p>
      </div>

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
          title="Users with Phone Numbers"
          value={metrics.usersWithPhoneNumbers}
          icon={Calendar}
          description="Registered phone contacts"
          color="purple"
        />
        <MetricCard
          title="Unread Messages"
          value={metrics.unreadMessages}
          icon={MessageCircle}
          description="Pending responses"
          color="orange"
          onClick={() => navigate('/dashboard/chat-admin')}
        />
      </div>

      {/* Customer Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Customers</h3>
          <p className="text-gray-600 mt-1">Latest customer registrations and their consultation preferences</p>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
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
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sign-up Date
                </th>
              </tr>
            </thead>
          </table>
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full">
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
                        <div className="text-sm text-gray-900">{customer.user_number || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          customer.status 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {customer.status || 'New Lead'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(customer.created_at), 'MMM d, yyyy')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No customers found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile & Tablet Card View */}
        <div className="lg:hidden p-4 space-y-4">
          {metrics.recentCustomers.length > 0 ? (
            metrics.recentCustomers.map((customer) => (
              <div key={customer.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center mb-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 flex items-center justify-center text-white text-sm font-medium">
                    {customer.name ? customer.name.charAt(0).toUpperCase() : customer.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">
                      {customer.name || 'Anonymous User'}
                    </div>
                    <div className="text-xs text-gray-500">
                      Joined {format(new Date(customer.created_at), 'MMM d, yyyy')}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="text-gray-900 truncate ml-2">{customer.email || 'N/A'}</span>
                  </div>
                  
                  {customer.user_number && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone:</span>
                      <span className="text-gray-900">{customer.user_number}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Status:</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      customer.status 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {customer.status || 'New Lead'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              No customers found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardContent;