import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Users, UserCheck, Calendar, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';
import { UserProfileModal } from './UserProfileModal';

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
  const [selectedCustomer, setSelectedCustomer] = useState<{
    id: string;
    name: string | null;
    email: string | null;
  } | null>(null);

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary-from"></div>
      </div>
    );
  }

  const MetricCard = ({ title, value, icon: Icon, description, color = "blue", onClick = null }) => {
    const isUnreadMessages = title === "Unread Messages";
    
    return (
      <div 
        className={`p-6 rounded-xl border shadow-sm hover:shadow-md transition-all duration-300 ${
          isUnreadMessages 
            ? 'bg-brand-gradient border-brand-primary-from text-primary-foreground hover:shadow-brand-primary-from/20 hover:scale-105' 
            : 'border-border bg-card'
        } ${
          onClick ? 'cursor-pointer hover:border-border' : ''
        }`}
        onClick={onClick}
      >
        <div className="flex items-center justify-between mb-4">
          <div className={`p-2 rounded-lg ${
            isUnreadMessages 
              ? 'bg-white/20 backdrop-blur-sm' 
              : color === 'blue' ? 'bg-info-light' :
                color === 'green' ? 'bg-success-light' :
                color === 'purple' ? 'bg-accent/20' :
                'bg-warning-light'
          }`}>
            <Icon className={`h-5 w-5 ${
              isUnreadMessages 
                ? 'text-primary-foreground' 
                : color === 'blue' ? 'text-info' :
                  color === 'green' ? 'text-success' :
                  color === 'purple' ? 'text-accent-foreground' :
                  'text-warning'
            }`} />
          </div>
        </div>
        <h3 className={`font-medium mb-1 ${
          isUnreadMessages ? 'text-primary-foreground/90' : 'text-muted-foreground'
        }`}>{title}</h3>
        <p className={`text-2xl font-bold ${
          isUnreadMessages ? 'text-primary-foreground' : 'text-foreground'
        }`}>{value}</p>
        {description && (
          <p className={`text-sm mt-1 ${
            isUnreadMessages ? 'text-primary-foreground/80' : 'text-muted-foreground'
          }`}>{description}</p>
        )}
      </div>
    );
  };

  return (
    <div className="p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your photography business</p>
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
      <div className="bg-card rounded-xl border border-border shadow-sm">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Recent Customers</h3>
          <p className="text-muted-foreground mt-1">Latest customer registrations and their consultation preferences</p>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-muted sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-1/4">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-1/3">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-1/6">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-1/6">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-1/6">
                    Sign-up Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {metrics.recentCustomers.length > 0 ? (
                  metrics.recentCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-muted cursor-pointer" onClick={() => setSelectedCustomer({ id: customer.id, name: customer.name, email: customer.email })}>
                      <td className="px-6 py-4 whitespace-nowrap w-1/4">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-brand-gradient flex items-center justify-center text-primary-foreground text-sm font-medium">
                            {customer.name ? customer.name.charAt(0).toUpperCase() : customer.email?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-foreground">
                              {customer.name || 'Anonymous User'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap w-1/3">
                        <div className="text-sm text-foreground">{customer.email || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap w-1/6">
                        <div className="text-sm text-foreground">{customer.user_number || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap w-1/6">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          customer.status 
                            ? 'bg-success-light text-success-text' 
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {customer.status || 'New Lead'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground w-1/6">
                        {format(new Date(customer.created_at), 'MMM d, yyyy')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
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
              <div key={customer.id} className="bg-muted rounded-lg p-4 border border-border cursor-pointer hover:bg-muted/80" onClick={() => setSelectedCustomer({ id: customer.id, name: customer.name, email: customer.email })}>
                <div className="flex items-center mb-3">
                  <div className="h-10 w-10 rounded-full bg-brand-gradient flex items-center justify-center text-primary-foreground text-sm font-medium">
                    {customer.name ? customer.name.charAt(0).toUpperCase() : customer.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-medium text-foreground">
                      {customer.name || 'Anonymous User'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Joined {format(new Date(customer.created_at), 'MMM d, yyyy')}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="text-foreground truncate ml-2">{customer.email || 'N/A'}</span>
                  </div>
                  
                  {customer.user_number && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Phone:</span>
                      <span className="text-foreground">{customer.user_number}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Status:</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      customer.status 
                        ? 'bg-success-light text-success-text' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {customer.status || 'New Lead'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No customers found
            </div>
          )}
        </div>
      </div>

      {/* Profile Modal */}
      {selectedCustomer && (
        <UserProfileModal
          isOpen={!!selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          customerId={selectedCustomer.id}
          userName={selectedCustomer.name || 'Anonymous User'}
          userEmail={selectedCustomer.email || ''}
        />
      )}
    </div>
  );
};

export default DashboardContent;