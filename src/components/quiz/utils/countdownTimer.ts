
export const initializeCountdown = (): number => {
  const savedExpiry = localStorage.getItem('consultation_offer_expiry');
  const now = new Date().getTime();
  
  if (savedExpiry) {
    const expiryTime = parseInt(savedExpiry);
    return Math.max(0, Math.floor((expiryTime - now) / 1000));
  } else {
    // Set 24 hours from now
    const expiryTime = now + (24 * 60 * 60 * 1000);
    localStorage.setItem('consultation_offer_expiry', expiryTime.toString());
    return 24 * 60 * 60; // 24 hours in seconds
  }
};

export const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const clearCountdownExpiry = (): void => {
  localStorage.removeItem('consultation_offer_expiry');
};
