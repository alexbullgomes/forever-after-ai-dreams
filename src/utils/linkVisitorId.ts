import { supabase } from "@/integrations/supabase/client";

/**
 * Links the current anonymous visitorId to the logged-in user's profile
 * @param userId - The authenticated user's ID
 */
export const linkVisitorIdToProfile = async (userId: string): Promise<void> => {
  try {
    // Get the stored visitorId from localStorage
    const storedVisitorId = localStorage.getItem('homepage-visitor-id');
    
    if (!storedVisitorId) {
      return; // No visitorId to link
    }

    // Update the user's profile with the visitorId
    const { error } = await supabase
      .from('profiles')
      .update({ visitor_id: storedVisitorId })
      .eq('id', userId);

    if (error) {
      console.error('Error linking visitorId to profile:', error);
    } else {
      console.log('Successfully linked visitorId to user profile');
    }
  } catch (error) {
    console.error('Error in linkVisitorIdToProfile:', error);
  }
};