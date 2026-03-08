export interface CardMessageData {
  entityType: 'product' | 'campaign' | 'phone_capture';
  entityId: string;
  title: string;
  description: string | null;
  priceLabel: string | null;
  imageUrl: string | null;
  ctaLabel: string;
  ctaUrl: string;
  // Additional fields for product booking
  price?: number;
  currency?: string;
  // Phone capture metadata
  phoneCaptureMeta?: {
    status?: 'pending' | 'submitted';
    submittedNumber?: string;
  };
}

export type MessageType = 'text' | 'audio' | 'card';
