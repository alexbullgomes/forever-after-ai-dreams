import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

export type TabMedia = {
  value: string;
  label: string;
  src: string;
  alt?: string;
};

export type ShowcaseStep = {
  id: string;
  title: string;
  text: string;
};

export type FeatureShowcaseProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  stats?: string[];
  steps?: ShowcaseStep[];
  tabs: TabMedia[];
  defaultTab?: string;
  panelMinHeight?: number;
  ctaPrimaryText?: string;
  ctaPrimaryLink?: string;
  ctaSecondaryText?: string;
  ctaSecondaryLink?: string;
  className?: string;
};

export function FeatureShowcase({
  eyebrow = "Discover",
  title,
  description,
  stats = [],
  steps = [],
  tabs,
  defaultTab,
  panelMinHeight = 720,
  ctaPrimaryText,
  ctaPrimaryLink,
  ctaSecondaryText,
  ctaSecondaryLink,
  className,
}: FeatureShowcaseProps) {
  const initial = defaultTab ?? (tabs[0]?.value ?? "tab-0");

  return (
    <section className={cn("bg-background py-16 md:py-24", className)}>
      <div className="container mx-auto px-4">
        <Tabs defaultValue={initial} className="flex flex-col gap-10 lg:flex-row lg:gap-16">
          {/* Left column */}
          <div className="flex flex-col gap-6 lg:max-w-md lg:flex-shrink-0">
            <Badge variant="outline" className="w-fit text-xs font-medium tracking-wide uppercase text-muted-foreground">
              {eyebrow}
            </Badge>

            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">
              {title}
            </h2>

            {description && (
              <p className="text-base leading-relaxed text-muted-foreground">{description}</p>
            )}

            {/* Stats chips */}
            {stats.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {stats.map((s, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {s}
                  </Badge>
                ))}
              </div>
            )}

            {/* Steps (Accordion) */}
            <div className="flex flex-col gap-6">
              {steps.length > 0 && (
                <Accordion type="single" collapsible defaultValue={steps[0]?.id}>
                  {steps.map((step) => (
                    <AccordionItem key={step.id} value={step.id}>
                      <AccordionTrigger className="text-sm font-semibold text-foreground">
                        {step.title}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground">
                        {step.text}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}

              {/* CTAs */}
              {(ctaPrimaryText || ctaSecondaryText) && (
                <div className="flex flex-wrap gap-3">
                  {ctaPrimaryText && (
                    <a href={ctaPrimaryLink || "#"}>
                      <Button size="lg">{ctaPrimaryText}</Button>
                    </a>
                  )}
                  {ctaSecondaryText && (
                    <a href={ctaSecondaryLink || "#"}>
                      <Button variant="outline" size="lg">{ctaSecondaryText}</Button>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="flex-1 min-w-0">
            <Card className="overflow-hidden border-border/50">
              {/* Media container */}
              <div
                className="relative w-full"
                style={{ minHeight: `${panelMinHeight}px` }}
              >
                {tabs.map((t) => (
                  <TabsContent
                    key={t.value}
                    value={t.value}
                    className="absolute inset-0 m-0 data-[state=inactive]:hidden"
                  >
                    <img
                      src={t.src}
                      alt={t.alt || t.label}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </TabsContent>
                ))}
              </div>

              {/* Tab controls */}
              <div className="border-t border-border/50 bg-muted/30 p-2">
                <TabsList className="w-full justify-start bg-transparent">
                  {tabs.map((t) => (
                    <TabsTrigger key={t.value} value={t.value} className="text-xs">
                      {t.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            </Card>
          </div>
        </Tabs>
      </div>
    </section>
  );
}
