"use client";

import * as React from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Clock, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductMediaHero } from "./product-media-hero";

export interface InteractiveProduct3DCardProps {
  title: string;
  price: number | string;
  currency?: string;
  priceUnit?: string;
  description: string;
  imageUrl: string;
  videoUrl?: string;
  mediaType?: "image" | "video" | null;
  coverageText?: string;
  deliverableText?: string;
  isHighlighted?: boolean;
  highlightLabel?: string;
  actionText: string;
  href?: string;
  onActionClick: () => void;
  className?: string;
}

export const InteractiveProduct3DCard = React.forwardRef<
  HTMLDivElement,
  InteractiveProduct3DCardProps
>(
(
    {
      title,
      price,
      currency = "USD",
      priceUnit = "per night",
      description,
      imageUrl,
      videoUrl,
      mediaType,
      coverageText = "",
      deliverableText = "",
      isHighlighted = false,
      highlightLabel = "Special Deal",
      actionText,
      href,
      onActionClick,
      className,
    },
    ref
  ) => {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

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

    const formatPrice = () => {
      const currencySymbol = currency === "USD" ? "$" : currency;
      const priceValue = typeof price === "number" ? price.toLocaleString() : price;
      return `${currencySymbol}${priceValue}`;
    };

    return (
      <div
        ref={ref}
        className={cn("perspective-1000 w-full max-w-sm", className)}
        style={{ perspective: "1000px" }}
      >
        <motion.div
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ rotateX, rotateY }}
          className={cn(
            "relative overflow-hidden rounded-2xl bg-card shadow-lg transition-shadow duration-300 hover:shadow-xl",
            isHighlighted 
              ? "border-2 border-primary ring-1 ring-primary/20" 
              : "border border-border"
          )}
        >
          {/* Highlight Badge */}
          {isHighlighted && (
            <div className="absolute top-3 left-3 z-10">
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-gradient px-3 py-1 text-xs font-semibold text-white shadow-md">
                {highlightLabel}
              </span>
            </div>
          )}

          {/* Product Media (Image or Video) */}
          <div className="aspect-[4/3] w-full overflow-hidden">
            <ProductMediaHero
              imageUrl={imageUrl}
              videoUrl={videoUrl}
              mediaType={mediaType}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
            />
          </div>

          {/* Card Content */}
          <div className="flex flex-col gap-3 p-5">
            {/* Title */}
            <h3 className="text-xl font-bold text-foreground">{title}</h3>

            {/* Price */}
            <p className="text-lg font-semibold text-foreground">
              {formatPrice()}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                {priceUnit}
              </span>
            </p>

            {/* Description */}
            <p className="text-sm text-muted-foreground line-clamp-2">
              {description}
            </p>

            {/* Micro Stats - Coverage & Deliverable */}
            <div className="flex gap-3">
              {coverageText && (
                <div className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-muted px-3 py-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    {coverageText}
                  </span>
                </div>
              )}
              {deliverableText && (
                <div className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-muted px-3 py-2">
                  <Package className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    {deliverableText}
                  </span>
                </div>
              )}
            </div>

            {/* CTA Button */}
            <button
              onClick={onActionClick}
              className="mt-2 w-full rounded-xl bg-brand-gradient py-3 text-center font-semibold text-white shadow-md transition-all hover:opacity-90 hover:shadow-lg"
            >
              {actionText}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }
);

InteractiveProduct3DCard.displayName = "InteractiveProduct3DCard";
