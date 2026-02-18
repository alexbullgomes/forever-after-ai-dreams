import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, LayoutGrid, Save } from 'lucide-react';
import { useLandingPageCardsAdmin, LandingCard } from '@/hooks/useLandingPageCards';
import { LandingCardEditor } from './LandingCardEditor';
import { useToast } from '@/hooks/use-toast';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export const ContentSection = () => {
  const { config, loading: cardsLoading, updateConfig } = useLandingPageCardsAdmin();
  const [tempCards, setTempCards] = useState<LandingCard[]>([]);
  const [showCardsSection, setShowCardsSection] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Initialize temp state when config loads
  if (!initialized && !cardsLoading && config) {
    setTempCards(config.cards);
    setShowCardsSection(config.show_cards_section);
    setInitialized(true);
  }

  const handleShowCardsSectionToggle = async (checked: boolean) => {
    setShowCardsSection(checked);
  };

  const handleCardChange = (index: number, card: LandingCard) => {
    const newCards = [...tempCards];
    newCards[index] = card;
    setTempCards(newCards);
  };

  const handleSaveCards = async () => {
    setSaving(true);
    const success = await updateConfig({
      show_cards_section: showCardsSection,
      cards: tempCards
    });
    
    if (success) {
      toast({
        title: "Settings saved",
        description: "Landing page cards have been updated"
      });
    } else {
      toast({
        title: "Error saving settings",
        description: "Please try again",
        variant: "destructive"
      });
    }
    setSaving(false);
  };

  const hasChanges = initialized && (
    showCardsSection !== config.show_cards_section ||
    JSON.stringify(tempCards) !== JSON.stringify(config.cards)
  );

  if (cardsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Landing Page Cards Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-primary" />
            Landing Page Cards
          </CardTitle>
          <CardDescription>
            Customize the service cards displayed on the homepage
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Show/Hide Cards Section Toggle */}
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div className="space-y-0.5">
              <Label htmlFor="show-cards-toggle" className="text-base font-medium">
                Show Cards Section
              </Label>
              <p className="text-sm text-muted-foreground">
                Toggle the entire "Our Services" section on the homepage
              </p>
            </div>
            <Switch
              id="show-cards-toggle"
              checked={showCardsSection}
              onCheckedChange={handleShowCardsSectionToggle}
            />
          </div>

          {/* Card Editors */}
          <Accordion type="single" collapsible className="w-full">
            {tempCards.map((card, index) => (
              <AccordionItem key={index} value={`card-${index}`}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{card.title || `Card ${index + 1}`}</span>
                    <span className="text-sm text-muted-foreground">({card.icon})</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <LandingCardEditor
                    card={card}
                    index={index}
                    onChange={(updatedCard) => handleCardChange(index, updatedCard)}
                  />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t border-border">
            <Button
              onClick={handleSaveCards}
              disabled={!hasChanges || saving}
              className="bg-primary hover:bg-primary/90"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Card Settings
            </Button>
          </div>

          {hasChanges && (
            <p className="text-sm text-amber-600">
              You have unsaved changes
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
