"use client";

import type { ReactNode } from "react";
import { BorderBeam } from "border-beam";
import { ThinkingOrb, type OrbState } from "thinking-orbs";
import { MetalFx } from "metal-fx";
import { cn } from "@/lib/utils";

export function PremiumBeam({
  children,
  className,
  active = true,
  variant = "ocean",
}: {
  children: ReactNode;
  className?: string;
  active?: boolean;
  variant?: "ocean" | "sunset" | "ice" | "gold" | "colorful";
}) {
  return (
    <BorderBeam
      active={active}
      borderRadius={20}
      className={cn("block h-full", className)}
      colorVariant={variant}
      size="pulse-inner"
      strength={0.42}
      theme="dark"
    >
      {children}
    </BorderBeam>
  );
}

export function AiThinkingOrb({
  label,
  state = "working",
  size = 32,
  className,
}: {
  label?: string;
  state?: OrbState;
  size?: 20 | 32 | 64;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <ThinkingOrb aria-label={label ?? "AI is working"} color="#a78bfa" size={size} state={state} theme="dark" />
      {label ? <span>{label}</span> : null}
    </span>
  );
}

export function PremiumAction({ children, active = true }: { children: ReactNode; active?: boolean }) {
  return (
    <MetalFx disableGlow={!active} innerShadow paused={!active} preset="chromatic" strength={0.42} theme="dark">
      {children}
    </MetalFx>
  );
}
