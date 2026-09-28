"use client";

import dynamic from "next/dynamic";
import { Component, useEffect, useRef, useState, type ReactNode, type Ref } from "react";
import type { ImageGenerationHandle } from "img-fx";
import { StudentAvatar } from "@/components/students/student-avatar";
import { cn } from "@/lib/utils";

const ImageGeneration = dynamic(() => import("img-fx").then((mod) => mod.ImageGeneration), { ssr: false });

type Variant = "card" | "profile";

const frames: Record<Variant, string> = {
  card: "h-44 w-full",
  profile: "h-48 w-36",
};

export function StudentImageReveal({
  src,
  alt,
  variant,
}: {
  src?: string | null;
  alt: string;
  variant: Variant;
}) {
  const frame = frames[variant];
  if (!src) {
    return (
      <div className={cn("grid place-items-center bg-[#151D31]", frame)}>
        <StudentAvatar name={alt} size={variant === "profile" ? "lg" : "md"} />
      </div>
    );
  }
  return (
    <RevealBoundary fallback={<Photo src={src} alt={alt} frame={frame} />}>
      <RevealPhoto src={src} alt={alt} frame={frame} />
    </RevealBoundary>
  );
}

function RevealPhoto({ src, alt, frame }: { src: string; alt: string; frame: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const fxRef = useRef<ImageGenerationHandle>(null);
  const started = useRef(false);
  const [inView, setInView] = useState(false);
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [failed, setFailed] = useState(false);
  const [hold, setHold] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const frameId = window.requestAnimationFrame(() => {
      if (cancelled) return;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      setWebgl(!reduce && supportsWebGL());
    });
    const image = new Image();
    image.onerror = () => {
      if (!cancelled) setFailed(true);
    };
    image.src = src;
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frameId);
    };
  }, [src]);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "120px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView || webgl !== true || failed || started.current) return;
    started.current = true;
    const timer = window.setTimeout(() => {
      try {
        fxRef.current?.triggerReveal({ hold: "manual" });
      } catch {
        setFailed(true);
      }
    }, 60);
    return () => window.clearTimeout(timer);
  }, [failed, inView, webgl]);

  if (webgl === null) {
    return <div className={cn("bg-[#151D31]", frame)} aria-hidden />;
  }

  if (failed || !webgl) {
    return <Photo src={failed ? "" : src} alt={alt} frame={frame} />;
  }

  return (
    <div ref={rootRef} className={cn("overflow-hidden bg-[#151D31]", frame)}>
      {inView ? (
        <ImageGeneration
          ref={fxRef as Ref<ImageGenerationHandle>}
          preset="pixels-organic"
          theme="dark"
          cardBg="#151D31"
          images={[src]}
          revealInitialDelay={0}
          paused={hold}
          onCycle={(event) => {
            if (event.phase === "visible") setHold(true);
          }}
          className="h-full w-full"
          borderRadius={variantRadius(frame)}
        >
          <div role="img" aria-label={alt} className="h-full w-full bg-[#151D31]" />
        </ImageGeneration>
      ) : (
        <div className="h-full w-full bg-[#151D31]" aria-hidden />
      )}
    </div>
  );
}

function Photo({ src, alt, frame }: { src: string; alt: string; frame: string }) {
  const [broken, setBroken] = useState(!src);
  if (broken) {
    return (
      <div className={cn("grid place-items-center bg-[#151D31]", frame)}>
        <StudentAvatar name={alt} size="md" />
      </div>
    );
  }
  return (
    // Authenticated student photos are served by our API, not the image optimizer.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      onError={() => setBroken(true)}
      className={cn("object-cover opacity-0 transition-opacity duration-500", frame)}
      onLoad={(event) => event.currentTarget.classList.remove("opacity-0")}
    />
  );
}

function variantRadius(frame: string) {
  return frame.includes("w-36") ? 16 : 0;
}

function supportsWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

class RevealBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
