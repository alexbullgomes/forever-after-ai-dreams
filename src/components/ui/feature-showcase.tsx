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
  const [activeTab, setActiveTab] = React.useState(initial);
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

  const activeMedia = tabs.find((t) => t.value === activeTab) || tabs[0];

  return (
    <div style={{ perspective: "1000px" }}>
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={isMobile ? {} : { rotateX, rotateY }}
        className="transition-shadow duration-300">
        
        <Card className="relative overflow-hidden rounded-2xl border-border/50 ring-1 ring-primary/10 shadow-lg hover:shadow-xl hover:shadow-primary/10 transition-shadow duration-300 aspect-[4/5]">
          {/* Media – fills entire card */}
          {activeMedia && (
            isVideoUrl(activeMedia.src) ? (
              <video
                key={activeMedia.value}
                src={activeMedia.src}
                poster={activeMedia.posterUrl || undefined}
                muted
                autoPlay
                loop
                playsInline
                preload="metadata"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 hover:scale-105" />
            ) : (
              <img
                key={activeMedia.value}
                src={activeMedia.src}
                alt={activeMedia.alt || activeMedia.label}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                loading="eager" />
            )
          )}

          {/* Gradient overlay for depth */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent" />

          {/* Tab controls – glass overlay */}
          {tabs.length > 1 && (
            <div className="absolute bottom-3 left-3 right-3 z-10">
              <TabsList className="w-full justify-start bg-black/30 backdrop-blur-md rounded-xl border border-white/10">
                {tabs.map((t) =>
                  <TabsTrigger
                    key={t.value}
                    value={t.value}
                    onClick={() => setActiveTab(t.value)}
                    className="text-xs rounded-lg text-white/70 data-[state=active]:text-white data-[state=active]:bg-white/20 data-[state=active]:shadow-none">
                    {t.label}
                  </TabsTrigger>
                )}
              </TabsList>
            </div>
          )}
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
      <div className="max-w-5xl mx-auto px-4">
        <Tabs defaultValue={initial} className="flex flex-col gap-10 lg:flex-row lg:items-center lg:gap-12">
          {/* Left column */}
          <div className="flex flex-col justify-center gap-6 flex-1 min-w-0">
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
          <div className="w-full max-w-xs mx-auto lg:w-[340px] lg:max-w-none lg:flex-shrink-0">
            <Showcase3DCard tabs={tabs} initial={initial} />
          </div>
        </Tabs>
      </div>
    </section>);

}