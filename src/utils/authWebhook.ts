
const WEBHOOK_URL = "https://agcreationmkt.cloud/webhook/3d243bf4-c682-4903-a4b7-08bb9ef98b04";

export const sendAuthWebhook = async (event: "login" | "register", userId: string, email: string) => {
  try {
    await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event,
        user_id: userId,
        email,
        timestamp: new Date().toISOString()
      }),
    });
    console.log(`Webhook sent successfully for ${event} event`);
  } catch (error) {
    console.error(`Failed to send webhook for ${event} event:`, error);
    // Don't block the user flow if webhook fails
  }
};
