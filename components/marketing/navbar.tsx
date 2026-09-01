"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { BrandMark } from "@/components/marketing/ui";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/#home", label: "Home" },
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/#solutions", label: "Solutions" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About Us" },
];

export function MarketingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 12);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition duration-300",
        scrolled
          ? "border-white/10 bg-[#050814]/80 backdrop-blur-xl"
          : "border-transparent bg-white/5 backdrop-blur-md",
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <Link href="/#home" className="shrink-0" aria-label="EduAssess AI home">
          <BrandMark />
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex" aria-label="Primary">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="transition hover:text-white">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/auth/login"
            className="rounded-xl border border-white/20 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-violet-300/50 hover:bg-white/5"
          >
            Login
          </Link>
          <Link
            href="/auth/login"
            className="rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_24px_rgba(139,108,255,0.35)] transition hover:brightness-110"
          >
            Get Started
          </Link>
        </div>
        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-xl border border-white/15 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open ? (
        <div className="border-t border-white/10 bg-[#050814]/95 px-4 py-4 md:hidden">
          <nav className="grid gap-3 text-sm" aria-label="Mobile">
            {LINKS.map((link) => (
              <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="py-1 text-slate-200">
                {link.label}
              </Link>
            ))}
            <Link href="/auth/login" className="mt-2 rounded-xl border border-white/20 px-4 py-2 text-center">
              Login
            </Link>
            <Link
              href="/auth/login"
              className="rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-2 text-center font-semibold"
            >
              Get Started
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
