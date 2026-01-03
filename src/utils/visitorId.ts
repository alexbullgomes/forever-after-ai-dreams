const VISITOR_ID_KEY = 'booking-visitor-id';

export const getOrCreateVisitorId = (): string => {
  if (typeof window === 'undefined') {
    return crypto.randomUUID();
  }
  
  let visitorId = localStorage.getItem(VISITOR_ID_KEY);
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem(VISITOR_ID_KEY, visitorId);
  }
  return visitorId;
};

export const getVisitorId = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem(VISITOR_ID_KEY);
};
