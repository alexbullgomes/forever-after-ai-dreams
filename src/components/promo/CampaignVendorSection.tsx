import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GradientHeading } from "@/components/ui/gradient-heading";
import { LogoCarousel, type Logo } from "@/components/ui/logo-carousel";

interface CampaignVendorSectionProps {
  campaignId: string;
  headline?: string;
  description?: string | null;
}

export function CampaignVendorSection({ 
  campaignId, 
  headline = "Our Partners",
  description 
}: CampaignVendorSectionProps) {
  const [logos, setLogos] = useState<Logo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const { data, error } = await supabase
          .from('campaign_vendors')
          .select('id, name, logo_url, website_url')
          .eq('campaign_id', campaignId)
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (error) throw error;

        const vendorLogos: Logo[] = (data || [])
          .filter(v => v.logo_url) // Only include vendors with logos
          .map((vendor, index) => ({
            id: vendor.id || index,
            name: vendor.name,
            logoUrl: vendor.logo_url!,
            websiteUrl: vendor.website_url || undefined,
          }));

        setLogos(vendorLogos);
      } catch (err) {
        console.error('Error fetching campaign vendors:', err);
      } finally {
        setLoading(false);
      }
    };

    if (campaignId) {
      fetchVendors();
    }
  }, [campaignId]);

  // Don't render if no vendors with logos
  if (loading || logos.length === 0) {
    return null;
  }

  // Determine column count based on number of logos
  const columnCount = Math.min(logos.length, 4);

  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <GradientHeading variant="secondary" size="lg">
            {headline}
          </GradientHeading>
          {description && (
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-base md:text-lg">
              {description}
            </p>
          )}
        </div>
        
        {/* Logo Carousel */}
        <LogoCarousel logos={logos} columnCount={columnCount} />
      </div>
    </section>
  );
}
