import * as React from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent } from
"@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const isVideoUrl = (url: string) => /\.(mp4|webm)(\?.*)?$/i.test(url);

export type TabMedia = {
  value: string;
  label: string;
  src: string;
  alt?: string;
  posterUrl?: string;
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

function Showcase3DCard({ tabs, initial }: {tabs: TabMedia[];initial: string;}) {
  const isMobile = useIsMobile();
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 15, stiffness: 150 };
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);

  const rotateX = useTransform(springY, [-0.5, 0.5], ["10.5deg", "-10.5deg"]);
  const rotateY = useTransform(springX, [-0.5, 0.5], ["-10.5deg", "10.5deg"]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isMobile) return;
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div style={{ perspective: "1000px" }}>
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={isMobile ? {} : { rotateX, rotateY }}
        className="transition-shadow duration-300">
        
        <Card className="overflow-hidden rounded-2xl border-border/50 ring-1 ring-primary/10 shadow-lg hover:shadow-xl hover:shadow-primary/10 transition-shadow duration-300">
          {/* Media container – 4:5 portrait (Instagram vertical) */}
          <div className="relative aspect-[4/5] w-full overflow-hidden">
            {tabs.map((t) => {
              const isVideo = isVideoUrl(t.src);
              return (
                <TabsContent
                  key={t.value}
                  value={t.value}
                  className="absolute inset-0 m-0 data-[state=inactive]:hidden">
                  
                  {isVideo ?
                  <video
                    src={t.src}
                    poster={t.posterUrl || undefined}
                    muted
                    autoPlay
                    loop
                    playsInline
                    preload="metadata"
                    className="h-full w-full object-cover transition-transform duration-300 hover:scale-105" /> :


                  <img
                    src={t.src}
                    alt={t.alt || t.label}
                    className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                    loading="lazy" />

                  }
                </TabsContent>);

            })}
            {/* Gradient overlay for depth */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black/20 to-transparent" />
          </div>

          {/* Tab controls */}
          <div className="border-t border-border/50 bg-muted/30 p-2">
            <TabsList className="w-full justify-start bg-transparent">
              {tabs.map((t) =>
              <TabsTrigger key={t.value} value={t.value} className="text-xs rounded-lg">
                  {t.label}
                </TabsTrigger>
              )}
            </TabsList>
          </div>
        </Card>
      </motion.div>
    </div>);

}

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
  className
}: FeatureShowcaseProps) {
  const initial = defaultTab ?? tabs[0]?.value ?? "tab-0";

  return (
    <section className={cn("bg-background py-16 md:py-24", className)}>
      <div className="container mx-auto px-4">
        <Tabs defaultValue={initial} className="flex flex-col gap-10 lg:flex-row lg:items-center lg:gap-12">
          {/* Left column */}
          <div className="flex flex-col justify-center gap-6 lg:max-w-md lg:flex-shrink-0 mx-[100px]">
            <Badge variant="outline" className="w-fit text-xs font-medium tracking-wide uppercase text-muted-foreground">
              {eyebrow}
            </Badge>

            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">
              {title}
            </h2>

            {description &&
            <p className="text-base leading-relaxed text-muted-foreground">{description}</p>
            }

            {/* Stats chips */}
            {stats.length > 0 &&
            <div className="flex flex-wrap gap-2">
                {stats.map((s, i) =>
              <Badge key={i} variant="secondary" className="text-xs">
                    {s}
                  </Badge>
              )}
              </div>
            }

            {/* Steps (Accordion) */}
            <div className="flex flex-col gap-6">
              {steps.length > 0 &&
              <Accordion type="single" collapsible>
                  {steps.map((step) =>
                <AccordionItem key={step.id} value={step.id}>
                      <AccordionTrigger className="text-sm font-semibold text-foreground">
                        {step.title}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground">
                        {step.text}
                      </AccordionContent>
                    </AccordionItem>
                )}
                </Accordion>
              }

              {/* CTAs */}
              {(ctaPrimaryText || ctaSecondaryText) &&
              <div className="flex flex-wrap gap-3">
                  {ctaPrimaryText &&
                <a href={ctaPrimaryLink || "#"}>
                      <Button size="lg">{ctaPrimaryText}</Button>
                    </a>
                }
                  {ctaSecondaryText &&
                <a href={ctaSecondaryLink || "#"}>
                      <Button variant="outline" size="lg">{ctaSecondaryText}</Button>
                    </a>
                }
                </div>
              }
            </div>
          </div>

          {/* Right column */}
          <div className="flex-1 min-w-0 flex items-center justify-center">
            <div className="w-full max-w-xs mx-auto">
              <Showcase3DCard tabs={tabs} initial={initial} />
            </div>
          </div>
        </Tabs>
      </div>
    </section>);

}