"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

type SearchResult = { id: string; title: string; detail: string; href: string; kind: string };

export function GlobalSearch() {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const value = query.trim();
    if (value.length < 2) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(value)}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Search failed");
        const data = (await response.json()) as { results: SearchResult[] };
        setResults(data.results);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) setResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 220);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    function closeOnOutside(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", closeOnOutside);
    return () => document.removeEventListener("pointerdown", closeOnOutside);
  }, []);

  function openResult(result: SearchResult) {
    setOpen(false);
    setQuery("");
    router.push(result.href);
  }

  return (
    <div ref={rootRef} className="relative min-w-0 flex-1">
      <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden />
      <Input
        role="combobox"
        aria-label="Search classes, exams, and students"
        aria-expanded={open && query.trim().length >= 2}
        aria-controls="global-search-results"
        autoComplete="off"
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          const value = event.target.value;
          setQuery(value);
          setOpen(true);
          if (value.trim().length < 2) { setResults([]); setLoading(false); }
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
          if (event.key === "Enter" && open && results[0]) openResult(results[0]);
        }}
        placeholder="Search classes, exams, students…"
        className="pl-9 pr-9"
      />
      {query ? (
        <button type="button" className="absolute right-2 top-1/2 z-10 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg text-slate-500 hover:bg-white/10 hover:text-white" aria-label="Clear search" onClick={() => { setQuery(""); setResults([]); setLoading(false); }}>
          <X className="h-4 w-4" aria-hidden />
        </button>
      ) : null}
      {open && query.trim().length >= 2 ? (
        <div id="global-search-results" role="listbox" className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-white/10 bg-[#11182A] p-1.5 shadow-2xl shadow-black/40">
          <p className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Search results</p>
          {loading && results.length === 0 ? <p className="px-3 py-3 text-sm text-slate-400">Searching…</p> : null}
          {!loading && query.trim().length >= 2 && results.length === 0 ? <p className="px-3 py-3 text-sm text-slate-400">No matches. Try another name.</p> : null}
          {results.map((result) => (
            <button key={`${result.kind}-${result.id}`} type="button" role="option" aria-selected="false" onClick={() => openResult(result)} className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-white/[0.07] focus:bg-white/[0.07] focus:outline-none">
              <span className="min-w-0"><span className="block truncate text-sm font-medium text-white">{result.title}</span><span className="mt-0.5 block truncate text-xs text-slate-500">{result.detail}</span></span>
              <span className="shrink-0 rounded-full border border-white/10 px-2 py-1 text-[10px] text-slate-400">{result.kind}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
