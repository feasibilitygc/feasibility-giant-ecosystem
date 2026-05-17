"use client";

import { Button, ButtonProps } from "@heroui/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface FgButtonProps extends ButtonProps {
  product?: "corporate" | "finder" | "finance" | "threed";
}

export const FgButton = ({ 
  className, 
  product = "corporate", 
  variant = "primary", 
  ...props 
}: FgButtonProps) => {
  const productStyles = {
    corporate: "bg-gradient-to-br from-blue to-navy text-white shadow-[0_8px_30px_rgba(26,79,139,0.4)] hover:shadow-[0_12px_40px_rgba(26,79,139,0.5)]",
    finder: "bg-green text-white shadow-[0_8px_30px_rgba(31,175,90,0.4)] hover:bg-green-dark hover:shadow-[0_12px_40px_rgba(31,175,90,0.5)]",
    finance: "bg-gold text-white shadow-[0_8px_30px_rgba(201,162,39,0.4)] hover:bg-gold-light hover:shadow-[0_12px_40px_rgba(201,162,39,0.5)]",
    "threed": "bg-gradient-to-r from-blue to-green text-white shadow-[0_8px_30px_rgba(0,123,255,0.4)] hover:shadow-[0_12px_40px_rgba(0,123,255,0.5)]",
  };

  const variantStyles = variant === "outline" ? "bg-transparent border-content3 border-2" : "";

  return (
    <Button
      variant={variant}
      className={cn(
        "rounded-[--fg-radius-md] transition-all duration-300 active:scale-95",
        variant === "primary" && productStyles[product],
        variantStyles,
        className
      )}
      {...props}
    />
  );
};
