"use client";

import { useState } from "react";
import Link from "next/link";
import { Globe, Mail, Share2 } from "lucide-react";
import { BrandMark } from "@/components/marketing/ui";

export function MarketingFooter() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  return (
    <footer id="contact" className="border-t border-white/10 bg-[#05060f] px-4 py-16 md:px-6">
      <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <BrandMark />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
            AI-powered assessment and exam management platform built for smarter learning and better outcomes.
          </p>
          <div className="mt-6 flex gap-3 text-slate-400">
            <a href="https://x.com" className="rounded-full border border-white/10 p-2 hover:text-white" aria-label="Social">
              <Share2 className="h-4 w-4" />
            </a>
            <a href="mailto:hello@eduassess.ai" className="rounded-full border border-white/10 p-2 hover:text-white" aria-label="Email">
              <Mail className="h-4 w-4" />
            </a>
            <a href="/" className="rounded-full border border-white/10 p-2 hover:text-white" aria-label="Website">
              <Globe className="h-4 w-4" />
            </a>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Product</p>
          <ul className="mt-4 space-y-2 text-sm text-slate-400">
            <li><Link href="/#features">Features</Link></li>
            <li><Link href="/#ai-generation">AI Question Generation</Link></li>
            <li><Link href="/#features">Exam Management</Link></li>
            <li><Link href="/#analytics">Analytics</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Company</p>
          <ul className="mt-4 space-y-2 text-sm text-slate-400">
            <li><Link href="/about">About Us</Link></li>
            <li><Link href="/about">Careers</Link></li>
            <li><Link href="/about">Blog</Link></li>
            <li><Link href="/#contact">Contact Us</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Support</p>
          <ul className="mt-4 space-y-2 text-sm text-slate-400">
            <li><Link href="/about">Help Center</Link></li>
            <li><Link href="/about">Privacy Policy</Link></li>
            <li><Link href="/about">Terms & Conditions</Link></li>
          </ul>
          <p className="mt-8 text-sm font-semibold text-white">Stay Updated</p>
          {done ? (
            <p className="mt-3 text-sm text-violet-300">Thanks — we’ll keep you posted.</p>
          ) : (
            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (email.includes("@")) setDone(true);
              }}
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-slate-500 focus:border-violet-400/50"
              />
              <button
                type="submit"
                className="rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-3 py-2 text-sm font-semibold"
              >
                Subscribe
              </button>
            </form>
          )}
        </div>
      </div>
      <p className="mx-auto mt-12 max-w-7xl text-xs text-slate-500">© 2026 EduAssess AI. All rights reserved.</p>
    </footer>
  );
}
