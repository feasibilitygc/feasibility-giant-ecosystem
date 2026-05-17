"use client";

import { Card, CardProps } from "@heroui/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface FgCardProps extends CardProps {
  isGlass?: boolean;
  product?: "corporate" | "finder" | "finance" | "threed";
}

export const FgCard = ({ 
  className, 
  isGlass = false, 
  product = "corporate", 
  children, 
  ...props 
}: FgCardProps) => {
  
  const productGradients = {
    corporate: "hover:bg-[radial-gradient(ellipse_80%_80%_at_50%_0%,rgba(26,79,139,0.15)_0%,transparent_70%)]",
    finder: "hover:bg-[radial-gradient(ellipse_80%_80%_at_50%_0%,rgba(31,175,90,0.15)_0%,transparent_70%)]",
    finance: "hover:bg-[radial-gradient(ellipse_80%_80%_at_50%_0%,rgba(201,162,39,0.15)_0%,transparent_70%)]",
    "threed": "hover:bg-[radial-gradient(ellipse_80%_80%_at_50%_0%,rgba(0,123,255,0.15)_0%,transparent_70%)]",
  };

  const glassStyles = isGlass ? 
    "bg-white/5 backdrop-blur-md border-white/10 shadow-2xl" : 
    "bg-dark-bg border-white/5 shadow-xl";

  return (
    <Card
      className={cn(
        "rounded-[20px] border relative overflow-hidden transition-all duration-400 cubic-bezier(0.25,0.46,0.45,0.94) hover:-translate-y-1",
        glassStyles,
        productGradients[product],
        className
      )}
      {...props}
    >
      <div className="relative z-10">{children}</div>
    </Card>
  );
};

export const FgGlassCard = (props: FgCardProps) => (
  <FgCard isGlass {...props} />
);
