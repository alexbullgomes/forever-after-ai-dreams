export interface CardMessageData {
  entityType: 'product' | 'campaign';
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
}

export type MessageType = 'text' | 'audio' | 'card';
