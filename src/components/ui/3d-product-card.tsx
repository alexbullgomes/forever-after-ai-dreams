"use client";

import * as React from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Calendar, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export interface InteractiveProduct3DCardProps {
  title: string;
  price: number | string;
  currency?: string;
  priceUnit?: string;
  description: string;
  imageUrl: string;
  days?: number;
  rating?: number;
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
      days = 0,
      rating = 0,
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
          className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-lg transition-shadow duration-300 hover:shadow-xl"
        >
          {/* Product Image */}
          <div className="aspect-[4/3] w-full overflow-hidden">
            <img
              src={imageUrl}
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

            {/* Micro Stats */}
            <div className="flex gap-3">
              <div className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-muted px-3 py-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">
                  {days} Days
                </span>
              </div>
              <div className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-muted px-3 py-2">
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                <span className="text-sm font-medium text-foreground">
                  {rating.toFixed(1)}
                </span>
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={onActionClick}
              className="mt-2 w-full rounded-xl bg-foreground py-3 text-center font-semibold text-background shadow-md transition-all hover:opacity-90 hover:shadow-lg"
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
