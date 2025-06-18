
export const validateConsultationForm = (email: string, cellphone: string): boolean => {
  return Boolean(email && cellphone);
};

export const submitConsultationRequest = async (
  email: string,
  cellphone: string,
  packageInfo: { name: string; price: string; type: string }
) => {
  const response = await fetch('https://agcreationmkt.cloud/webhook/36fb4d39-8ebe-4ab6-b781-c7d8b73cc9cb', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      event: 'consultation_request',
      email,
      cellphone,
      package_info: packageInfo,
      discount_offer: '30% OFF',
      timestamp: new Date().toISOString()
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to submit consultation request');
  }

  return response;
};
