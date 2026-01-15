
const WEBHOOK_PROXY_URL = "https://hmdnronxajctsrlgrhey.supabase.co/functions/v1/webhook-proxy";

export const sendAuthWebhook = async (event: "login" | "register", userId: string, email: string) => {
  try {
    await fetch(WEBHOOK_PROXY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        webhook_type: "auth_events",
        payload: {
          event,
          user_id: userId,
          email,
          timestamp: new Date().toISOString()
        }
      }),
    });
    console.log(`Webhook sent successfully for ${event} event`);
  } catch (error) {
    console.error(`Failed to send webhook for ${event} event:`, error);
    // Don't block the user flow if webhook fails
  }
};

export const sendGoogleAuthWebhook = async (
  event: "login" | "register", 
  userId: string, 
  email: string, 
  fullName: string
) => {
  try {
    await fetch(WEBHOOK_PROXY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        webhook_type: "auth_events",
        payload: {
          event,
          provider: "google",
          user_id: userId,
          email,
          name: fullName,
          timestamp: new Date().toISOString()
        }
      }),
    });
    console.log(`Google auth webhook sent successfully for ${event} event`);
  } catch (error) {
    console.error(`Failed to send Google auth webhook for ${event} event:`, error);
    // Don't block the user flow if webhook fails
  }
};

