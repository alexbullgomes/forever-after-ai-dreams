import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, Circle, Clock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

type PipelineStatus = 
  | 'New Lead & Negotiation'
  | 'Closed Deal & Pre-Production'
  | 'Production'
  | 'Post-Production (Editing)'
  | 'Delivery & Finalization';

interface ProfileData {
  pipeline_profile: string | null;
  pipeline_status: string | null;
  updated_at: string;
}

interface Step {
  id: number;
  title: string;
  status: PipelineStatus;
}

const STEPS: Step[] = [
  { id: 1, title: 'Negotiation', status: 'New Lead & Negotiation' },
  { id: 2, title: 'Pre-Production', status: 'Closed Deal & Pre-Production' },
  { id: 3, title: 'Production', status: 'Production' },
  { id: 4, title: 'Post-Production', status: 'Post-Production (Editing)' },
  { id: 5, title: 'Delivered & Finalized', status: 'Delivery & Finalization' },
];

const ServiceTracking = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('pipeline_profile, pipeline_status, updated_at')
          .eq('id', user.id)
          .maybeSingle();

        if (error) throw error;
        setProfile(data);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load tracking data');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Profile updated:', payload);
          setProfile(payload.new as ProfileData);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const getCurrentStepIndex = (): number => {
    if (!profile?.pipeline_status) return 0;
    const index = STEPS.findIndex(step => step.status === profile.pipeline_status);
    return index >= 0 ? index : 0;
  };

  const getStepState = (stepIndex: number): 'completed' | 'current' | 'pending' => {
    const currentIndex = getCurrentStepIndex();
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  const getProgressPercentage = (): number => {
    const currentIndex = getCurrentStepIndex();
    return ((currentIndex + 1) / STEPS.length) * 100;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!profile || profile.pipeline_profile !== 'Enable') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-200 rounded-lg p-8 text-center">
          <Clock className="h-12 w-12 text-rose-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent mb-2">
            Service Tracking Coming Soon
          </h2>
          <p className="text-gray-700 mb-4">
            Tracking will appear here once your project is enabled.
          </p>
          <p className="text-sm text-gray-600">
            If you have questions, please contact our support team.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent mb-2">
          Service Tracking
        </h1>
        <p className="text-gray-600">Track your project progress in real-time</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <Progress value={getProgressPercentage()} className="h-2" />
        </div>

        {/* Steps */}
        <div className="space-y-6">
          {STEPS.map((step, index) => {
            const state = getStepState(index);
            return (
              <div
                key={step.id}
                className={`flex items-start gap-4 p-4 rounded-lg transition-all ${
                  state === 'current'
                    ? 'bg-gradient-to-r from-rose-50 to-pink-50 border-2 border-rose-300'
                    : state === 'completed'
                    ? 'bg-gray-50 border border-gray-200'
                    : 'bg-white border border-gray-200'
                }`}
              >
                <div className="flex-shrink-0">
                  {state === 'completed' ? (
                    <CheckCircle className="h-8 w-8 text-rose-500" />
                  ) : state === 'current' ? (
                    <div className="relative">
                      <Circle className="h-8 w-8 text-rose-500 fill-rose-100" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-3 w-3 bg-rose-500 rounded-full animate-pulse" />
                      </div>
                    </div>
                  ) : (
                    <Circle className="h-8 w-8 text-gray-300" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3
                    className={`text-lg font-semibold mb-1 ${
                      state === 'current'
                        ? 'bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent'
                        : state === 'completed'
                        ? 'text-gray-700'
                        : 'text-gray-400'
                    }`}
                  >
                    {step.id}. {step.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {state === 'completed' ? (
                      <span className="text-green-600 font-medium">✓ Completed</span>
                    ) : state === 'current' ? (
                      <span className="text-rose-600 font-medium">In Progress</span>
                    ) : (
                      <span className="text-gray-400">Pending</span>
                    )}
                  </p>
                  {state === 'current' && profile.updated_at && (
                    <p className="text-xs text-gray-500 mt-1">
                      Last updated: {new Date(profile.updated_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            Your project status updates automatically. Contact us if you have any questions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ServiceTracking;
