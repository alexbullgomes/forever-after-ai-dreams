
const QUIZ_WEBHOOK_URL = "https://agcreationmkt.cloud/webhook/2807df9e-fe4b-4ee0-a4c0-e357960d1c31";

export const sendQuizWebhook = async (
  userLead: {
    fullName: string;
    email: string;
    weddingDate?: string;
  },
  answers: Array<{
    questionId: number;
    answerId: string;
    category: 'photo' | 'video' | 'both';
    intensity: 'essential' | 'mid' | 'premium';
  }>,
  recommendation: {
    category: 'photo' | 'video' | 'both';
    intensity: 'essential' | 'mid' | 'premium';
    packageName: string;
    packagePrice: string;
    packageType: string;
  }
) => {
  try {
    await fetch(QUIZ_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event: "quiz_completed",
        user: {
          full_name: userLead.fullName,
          email: userLead.email,
          wedding_date: userLead.weddingDate,
        },
        quiz_answers: answers,
        recommendation: recommendation,
        timestamp: new Date().toISOString()
      }),
    });
    console.log("Quiz webhook sent successfully");
  } catch (error) {
    console.error("Failed to send quiz webhook:", error);
    // Don't block the user flow if webhook fails
  }
};
