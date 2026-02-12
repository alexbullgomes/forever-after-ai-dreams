"use client";

import * as React from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

const isVideoUrl = (url: string) => /\.(mp4|webm)(\?.*)?$/i.test(url);

export interface InteractiveTravelCardProps {
  title: string;
  subtitle: string;
  imageUrl: string;
  videoUrl?: string | null;
  actionText: string;
  href: string;
  onActionClick: () => void;
  className?: string;
}

export const InteractiveTravelCard = React.forwardRef<
  HTMLDivElement,
  InteractiveTravelCardProps
>(
  (
    { title, subtitle, imageUrl, videoUrl, actionText, href, onActionClick, className },
    ref
  ) => {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);
    const videoRef = React.useRef<HTMLVideoElement>(null);
    const [videoFailed, setVideoFailed] = React.useState(false);

    const hasVideo = !!videoUrl && isVideoUrl(videoUrl) && !videoFailed;

    const springConfig = { damping: 15, stiffness: 150 };
    const springX = useSpring(mouseX, springConfig);
    const springY = useSpring(mouseY, springConfig);

    const rotateX = useTransform(springY, [-0.5, 0.5], ["10.5deg", "-10.5deg"]);
    const rotateY = useTransform(springX, [-0.5, 0.5], ["-10.5deg", "10.5deg"]);

    const handleMouseMove = (e: React.MouseEvent) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const { width, height, left, top } = rect;
      const mouseXVal = e.clientX - left;
      const mouseYVal = e.clientY - top;
      const xPct = mouseXVal / width - 0.5;
      const yPct = mouseYVal / height - 0.5;
      mouseX.set(xPct);
      mouseY.set(yPct);
    };

    const handleMouseLeave = () => {
      mouseX.set(0);
      mouseY.set(0);
    };

    return (
      <div
        ref={ref}
        className={cn("perspective-1000", className)}
        style={{ perspective: "1000px" }}
      >
        <motion.div
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ rotateX, rotateY }}
          className="relative h-80 w-full overflow-hidden rounded-2xl border border-border bg-card shadow-lg transition-shadow duration-300 hover:shadow-xl"
        >
          {/* Background Media */}
          {hasVideo ? (
            <video
              ref={videoRef}
              src={videoUrl!}
              poster={imageUrl}
              muted
              autoPlay
              loop
              playsInline
              preload="metadata"
              onError={() => setVideoFailed(true)}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${imageUrl})` }}
            />
          )}
          
          {/* Darkening overlay for better text contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

          {/* Card Content */}
          <div className="relative z-10 flex h-full flex-col justify-between p-6">
            {/* Header section */}
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white drop-shadow-md">
                  {title}
                </h3>
                <p className="text-sm text-white/80 drop-shadow-sm">
                  {subtitle}
                </p>
              </div>

              <a
                href={href}
                onClick={(e) => {
                  e.preventDefault();
                  onActionClick();
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-colors hover:bg-white/30"
              >
                <ArrowUpRight className="h-5 w-5 text-white" />
              </a>
            </div>

            {/* Footer Button */}
            <button
              onClick={onActionClick}
              className="w-full rounded-xl bg-brand-gradient py-3 text-center font-semibold text-white shadow-md transition-all hover:opacity-90 hover:shadow-lg"
            >
              {actionText}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }
);

InteractiveTravelCard.displayName = "InteractiveTravelCard";
