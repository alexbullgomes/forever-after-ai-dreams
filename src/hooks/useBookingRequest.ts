import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getOrCreateVisitorId } from '@/utils/visitor';
import { useProductBookingRules, ProductBookingRules } from './useProductBookingRules';

export interface BookingRequest {
  id: string;
  product_id: string | null;
  user_id: string | null;
  visitor_id: string | null;
  event_date: string;
  timezone: string;
  stage: string;
  offer_expires_at: string;
  availability_version: 'full' | 'limited';
  selected_time: string | null;
  last_seen_at: string;
  stripe_checkout_session_id: string | null;
  created_at: string;
  updated_at: string;
  campaign_id?: string | null;
  campaign_card_index?: number | null;
}

interface CampaignData {
  campaignId: string;
  cardIndex: number;
}

export function useBookingRequest(
  productId: string | null,
  campaignData?: CampaignData
) {
  const { user } = useAuth();
  const { rules, loading: rulesLoading } = useProductBookingRules(productId);
  const [bookingRequest, setBookingRequest] = useState<BookingRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const findOrCreateRequest = useCallback(async (eventDate: Date, timezone: string) => {
    // Need either productId or campaignData
    if (!productId && !campaignData) {
      setError('No product or campaign selected');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const visitorId = getOrCreateVisitorId();
      const dateStr = eventDate.toISOString().split('T')[0];
      const offerExpiresAt = new Date(Date.now() + rules.offer_window_hours * 60 * 60 * 1000).toISOString();

      // Build query based on product or campaign mode
      let query = supabase
        .from('booking_requests')
        .select('*')
        .eq('event_date', dateStr);

      if (productId) {
        query = query.eq('product_id', productId);
      } else if (campaignData) {
        query = query
          .eq('campaign_id', campaignData.campaignId)
          .eq('campaign_card_index', campaignData.cardIndex)
          .is('product_id', null);
      }

      if (user?.id) {
        query = query.eq('user_id', user.id);
      } else {
        query = query.eq('visitor_id', visitorId).is('user_id', null);
      }

      const { data: existing, error: fetchError } = await query.maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existing) {
        // Update last_seen_at
        const { data: updated, error: updateError } = await supabase
          .from('booking_requests')
          .update({ last_seen_at: new Date().toISOString() })
          .eq('id', existing.id)
          .select()
          .single();

        if (updateError) throw updateError;

        // Determine availability version based on offer expiry
        const offerExpired = new Date(existing.offer_expires_at) < new Date();
        const isPaid = existing.stage === 'paid';
        const availabilityVersion = (!offerExpired || isPaid) ? 'full' : 'limited';

        const request = {
          ...updated,
          availability_version: availabilityVersion,
        } as BookingRequest;
        
        setBookingRequest(request);
        return request;
      }

      // Create new request
      const newRequest: any = {
        product_id: productId || null,
        user_id: user?.id || null,
        visitor_id: user?.id ? null : visitorId,
        event_date: dateStr,
        timezone,
        stage: 'date_selected',
        offer_expires_at: offerExpiresAt,
        availability_version: 'full' as const,
        last_seen_at: new Date().toISOString(),
      };

      // Add campaign fields if in campaign mode
      if (campaignData) {
        newRequest.campaign_id = campaignData.campaignId;
        newRequest.campaign_card_index = campaignData.cardIndex;
      }

      const { data: created, error: createError } = await supabase
        .from('booking_requests')
        .insert(newRequest)
        .select()
        .single();

      if (createError) throw createError;

      setBookingRequest(created as BookingRequest);
      return created as BookingRequest;
    } catch (err: any) {
      console.error('Error in findOrCreateRequest:', err);
      setError(err.message || 'Failed to create booking request');
      return null;
    } finally {
      setLoading(false);
    }
  }, [productId, user?.id, rules.offer_window_hours, campaignData]);

  const updateSelectedTime = useCallback(async (time: string) => {
    if (!bookingRequest) return null;

    const { data, error: updateError } = await supabase
      .from('booking_requests')
      .update({ 
        selected_time: time, 
        stage: 'time_selected',
        last_seen_at: new Date().toISOString() 
      })
      .eq('id', bookingRequest.id)
      .select()
      .single();

    if (updateError) {
      setError(updateError.message);
      return null;
    }

    setBookingRequest(data as BookingRequest);
    return data as BookingRequest;
  }, [bookingRequest]);

  const generateTimeSlots = useCallback((version: 'full' | 'limited'): string[] => {
    if (version === 'limited') {
      return rules.limited_slots;
    }

    // Generate full window slots
    const slots: string[] = [];
    const [startHour] = rules.full_window_start.split(':').map(Number);
    const [endHour] = rules.full_window_end.split(':').map(Number);
    const duration = rules.slot_duration_minutes;

    for (let hour = startHour; hour < endHour; hour++) {
      for (let min = 0; min < 60; min += duration) {
        if (hour === endHour - 1 && min + duration > 60) break;
        const time = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }

    return slots;
  }, [rules]);

  return {
    bookingRequest,
    loading: loading || rulesLoading,
    error,
    rules,
    findOrCreateRequest,
    updateSelectedTime,
    generateTimeSlots,
  };
}
