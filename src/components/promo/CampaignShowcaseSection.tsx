import { FeatureShowcase, type TabMedia, type ShowcaseStep } from "@/components/ui/feature-showcase";

interface CampaignShowcaseData {
  showcase_eyebrow?: string | null;
  showcase_title?: string | null;
  showcase_description?: string | null;
  showcase_stats?: string[];
  showcase_steps?: ShowcaseStep[];
  showcase_tabs?: TabMedia[];
  showcase_default_tab?: string | null;
  showcase_cta_primary_text?: string | null;
  showcase_cta_primary_link?: string | null;
  showcase_cta_secondary_text?: string | null;
  showcase_cta_secondary_link?: string | null;
}

interface CampaignShowcaseSectionProps {
  campaign: CampaignShowcaseData;
}

export function CampaignShowcaseSection({ campaign }: CampaignShowcaseSectionProps) {
  const tabs = campaign.showcase_tabs || [];
  
  if (!campaign.showcase_title || tabs.length === 0) return null;

  return (
    <FeatureShowcase
      eyebrow={campaign.showcase_eyebrow || undefined}
      title={campaign.showcase_title}
      description={campaign.showcase_description || undefined}
      stats={campaign.showcase_stats || []}
      steps={campaign.showcase_steps || []}
      tabs={tabs}
      defaultTab={campaign.showcase_default_tab || undefined}
      ctaPrimaryText={campaign.showcase_cta_primary_text || undefined}
      ctaPrimaryLink={campaign.showcase_cta_primary_link || undefined}
      ctaSecondaryText={campaign.showcase_cta_secondary_text || undefined}
      ctaSecondaryLink={campaign.showcase_cta_secondary_link || undefined}
    />
  );
}
