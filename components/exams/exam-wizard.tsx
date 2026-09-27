"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { AiThinkingOrb, PremiumAction, PremiumBeam } from "@/components/effects/library-effects";

const STEPS = ["Select Content", "Configure Questions", "Paper Variations", "Review & Schedule"];
const AI_STAGES = [
  "Analyzing syllabus",
  "Understanding topics",
  "Generating questions",
  "Checking difficulty",
  "Validating questions",
  "Checking duplicates",
  "Creating question set",
];

type Source = "syllabus" | "topic" | "image" | "document" | "bank";

function defaultStart() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(10, 0, 0, 0);
  return toLocal(date);
}

function defaultEnd() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(11, 0, 0, 0);
  return toLocal(date);
}

function toLocal(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const fieldClass =
  "h-28 w-full rounded-xl border border-white/10 bg-[#0B1020] p-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-violet-400/50";

export function ExamWizard({
  classId,
  className,
  strength,
  syllabuses,
  portal = "/admin",
  initialSource = "syllabus",
  initialTopic = "",
}: {
  classId: string;
  className: string;
  strength: number;
  syllabuses: Array<{ id: string; title: string }>;
  portal?: "/admin" | "/teacher";
  initialSource?: Source;
  initialTopic?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [source, setSource] = useState<Source>(initialSource);
  const [syllabusId, setSyllabusId] = useState(syllabuses[0]?.id ?? "");
  const [topicText, setTopicText] = useState(initialTopic);
  const [content, setContent] = useState("");
  const [topics, setTopics] = useState<string[]>([]);
  const [title, setTitle] = useState(`${className} Mock Test`);
  const [questionCount, setQuestionCount] = useState(20);
  const [customCount, setCustomCount] = useState(30);
  const [difficulty, setDifficulty] = useState<"EASY" | "MEDIUM" | "HARD" | "MIXED">("MIXED");
  const [variationCount, setVariationCount] = useState(Math.min(5, Math.max(3, Math.ceil(strength / 15) || 3)));
  const [duration, setDuration] = useState(60);
  const [startAt, setStartAt] = useState(defaultStart);
  const [endAt, setEndAt] = useState(defaultEnd);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [stage, setStage] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [reviewed, setReviewed] = useState(false);

  const count = questionCount === 0 ? customCount : questionCount;
  const summary = useMemo(
    () => `${count} MCQs · ${difficulty.toLowerCase()} · ${variationCount} papers · ${strength} students`,
    [count, difficulty, variationCount, strength],
  );

  async function upload(file: File) {
    setUploading(true);
    setError(""); setReviewed(false);
    try {
      const form = new FormData(); form.set("file", file);
      const res = await fetch("/api/uploads", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setContent(data.content ?? "");
    } catch (e) { setError(e instanceof Error ? e.message : "Upload failed. Please retry."); }
    finally { setUploading(false); }
  }

  async function analyze() {
    if (content.trim().length < 8) return;
    setAnalyzing(true);
    try {
    const res = await fetch("/api/ai/analyze-syllabus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rawText: content }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Analysis failed");
    setTopics((data.topics ?? []).map((topic: { name: string }) => topic.name));
    } catch (e) { setError(e instanceof Error ? e.message : "Analysis failed"); }
    finally { setAnalyzing(false); }
  }

  async function submit() {
    setError("");
    if (source === "syllabus" && !syllabusId) { setError("Select a syllabus or choose another source"); return; }
    if (source === "topic" && topicText.trim().length < 8) { setError("Enter a topic or syllabus of at least 8 characters"); return; }
    if ((source === "image" || source === "document") && (!reviewed || content.trim().length < 8)) { setError("Review the extracted content and confirm it before scheduling"); return; }
    setPending(true);
    setStage(0);
    const timer = setInterval(() => setStage((s) => Math.min(s + 1, AI_STAGES.length - 1)), 700);
    try {
    const res = await fetch("/api/exams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        classId,
        title,
        syllabusId: source === "syllabus" ? syllabusId : undefined,
        topicText: source === "topic" ? topicText : undefined,
        content:
          source === "image" || source === "document" || source === "topic" ? content || topicText : undefined,
        questionCount: count,
        difficulty: difficulty === "MIXED" ? undefined : difficulty,
        mixed: difficulty === "MIXED",
        variationCount,
        durationMinutes: duration,
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
      }),
    });
    clearInterval(timer);
    setStage(AI_STAGES.length - 1);
    const data = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(data.error ?? "Could not create exam");
      return;
    }
    router.push(`${portal}/exams/${data.id}`);
    router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not create exam. Please retry."); }
    finally { clearInterval(timer); setPending(false); }
  }

  const pill = (active: boolean) =>
    cn(
      "rounded-full px-3 py-1 text-sm capitalize transition",
      active ? "bg-gradient-to-r from-[#7C3AED] to-[#4F6BFF] text-white" : "bg-white/8 text-slate-300",
    );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex gap-2">
        {STEPS.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => setStep(i)}
            className={cn(
              "relative flex-1 overflow-hidden rounded-2xl border px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide transition",
              i === step
                ? "border-violet-400/50 bg-violet-500/20 text-white"
                : "border-white/8 bg-white/4 text-slate-500",
            )}
          >
            <span className="block text-[10px] opacity-70">Step {i + 1}</span>
            {label}
            {i < step ? <Check className="absolute right-2 top-2 h-3.5 w-3.5 text-cyan-300" /> : null}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.22 }}
        >
          {step === 0 ? (
            <Card className="space-y-4">
              <h2 className="text-lg font-semibold text-white">Select content</h2>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {(
                  [
                    ["syllabus", "From syllabus"],
                    ["topic", "From topic"],
                    ["image", "From image"],
                    ["document", "From document"],
                    ["bank", "Question bank"],
                  ] as const
                ).map(([item, label]) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setSource(item)}
                    className={cn(
                      "rounded-xl border px-3 py-3 text-sm transition hover:-translate-y-0.5",
                      source === item
                        ? "border-violet-400/50 bg-violet-500/15 text-white"
                        : "border-white/8 bg-[#0B1020] text-slate-300",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {source === "syllabus" ? (
                <select
                  className="w-full rounded-xl border border-white/10 bg-[#0B1020] px-3 py-2.5 text-sm text-slate-100"
                  value={syllabusId}
                  onChange={(e) => setSyllabusId(e.target.value)}
                >
                  {syllabuses.length === 0 ? <option value="">No syllabus yet</option> : null}
                  {syllabuses.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>
              ) : null}
              {source === "topic" ? (
                <textarea
                  className={fieldClass}
                  placeholder="Indian Constitution — Fundamental Rights"
                  value={topicText}
                  onChange={(e) => setTopicText(e.target.value)}
                />
              ) : null}
              {source === "image" || source === "document" ? (
                <div className="space-y-3">
                  <Input
                    type="file"
                    accept={source === "image" ? ".jpg,.jpeg,.png,.webp" : ".pdf"}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void upload(file);
                    }}
                  />
                  {uploading ? (
                    <div className="overflow-hidden rounded-xl border border-violet-400/20 bg-violet-500/10 p-3 text-sm text-violet-100">
                      <AiThinkingOrb className="font-medium" label="Extracting text from your file…" size={20} state="searching" />
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                        <motion.div
                          className="h-full bg-gradient-to-r from-[#7C3AED] to-[#4F6BFF]"
                          animate={{ x: ["-100%", "100%"] }}
                          transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                          style={{ width: "40%" }}
                        />
                      </div>
                    </div>
                  ) : null}
                  <textarea
                    className={`${fieldClass} h-36`}
                    value={content}
                    onChange={(e) => { setContent(e.target.value); setReviewed(false); }}
                    placeholder="Extracted text appears here. You can edit it before analysis."
                  />
                  <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={reviewed} onChange={(e) => setReviewed(e.target.checked)} /> I reviewed the extracted text for accuracy</label>
                  <PremiumAction active={analyzing}>
                    <Button variant="secondary" onClick={() => void analyze()} disabled={analyzing || content.length < 8}>
                      {analyzing ? <AiThinkingOrb label="Analyzing…" size={20} state="solving" /> : "Analyze with AI"}
                    </Button>
                  </PremiumAction>
                  {topics.length ? (
                    <div className="flex flex-wrap gap-2">
                      {topics.map((topic) => (
                        <span key={topic} className="rounded-full bg-violet-500/15 px-3 py-1 text-xs text-violet-200">
                          {topic}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
              {source === "bank" ? (
                <p className="text-sm text-slate-400">
                  Use saved class questions, prioritizing less-used items. If there are too few matching questions, an AI provider is required to fill the gap.
                </p>
              ) : null}
            </Card>
          ) : null}

          {step === 1 ? (
            <Card className="space-y-4">
              <h2 className="text-lg font-semibold text-white">Configure questions</h2>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              <div className="flex flex-wrap gap-2">
                {[10, 20, 25, 50, 100, 0].map((n) => (
                  <button key={n} type="button" onClick={() => setQuestionCount(n)} className={pill(questionCount === n)}>
                    {n === 0 ? "Custom" : n}
                  </button>
                ))}
              </div>
              {questionCount === 0 ? (
                <Input type="number" min={1} value={customCount} onChange={(e) => setCustomCount(Number(e.target.value))} />
              ) : null}
              <div className="flex flex-wrap gap-2">
                {(["EASY", "MEDIUM", "HARD", "MIXED"] as const).map((item) => (
                  <button key={item} type="button" onClick={() => setDifficulty(item)} className={pill(difficulty === item)}>
                    {item.toLowerCase()}
                  </button>
                ))}
              </div>
              <p className="text-sm text-slate-400">Question type: MCQ · Shuffle options per student</p>
              <div className="rounded-xl border border-white/8 bg-[#0B1020] p-4 text-sm text-slate-300">{summary}</div>
            </Card>
          ) : null}

          {step === 2 ? (
            <Card className="space-y-4">
              <h2 className="text-lg font-semibold text-white">Generate multiple question papers</h2>
              <p className="text-sm text-slate-400">
                Class strength: <strong className="text-white">{strength} students</strong>. Shuffle questions and MCQ
                options and randomly distribute paper versions across students.
              </p>
              <label className="text-sm text-slate-400">Paper versions</label>
              <Input
                type="number"
                min={1}
                max={8}
                value={variationCount}
                onChange={(e) => setVariationCount(Number(e.target.value))}
              />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: Math.max(0, Math.min(8, variationCount || 0)) }).map((_, i) => (
                  <span key={i} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-200">
                    Paper {String.fromCharCode(65 + i)}
                  </span>
                ))}
              </div>
            </Card>
          ) : null}

          {step === 3 ? (
            <Card className="space-y-4">
              <h2 className="text-lg font-semibold text-white">Schedule exam</h2>
              <label className="text-sm text-slate-400">Start</label>
              <Input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
              <label className="text-sm text-slate-400">End</label>
              <Input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
              <label className="text-sm text-slate-400">Duration (minutes)</label>
              <Input type="number" min={5} value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
              {error ? <p className="text-sm text-red-400">{error}</p> : null}
              {pending ? (
                <PremiumBeam variant="ocean">
                <div className="rounded-2xl bg-violet-500/[0.07] p-4">
                  <AiThinkingOrb className="mb-4 text-sm font-semibold text-violet-100" label="AI is building your question papers" size={32} state="composing" />
                  <ol className="space-y-2">
                  {AI_STAGES.map((label, i) => (
                    <li key={label} className="flex items-center gap-2 text-sm text-slate-300">
                      <span
                        className={cn(
                          "grid h-6 w-6 place-items-center rounded-full text-xs transition",
                          i <= stage
                            ? "bg-gradient-to-r from-[#7C3AED] to-[#4F6BFF] text-white"
                            : "bg-white/10 text-slate-500",
                        )}
                      >
                        {i < stage ? <Check className="h-3 w-3" /> : i + 1}
                      </span>
                      {label}
                    </li>
                  ))}
                  </ol>
                </div>
                </PremiumBeam>
              ) : null}
            </Card>
          ) : null}
        </motion.div>
      </AnimatePresence>

      {error ? <p role="alert" className="text-sm text-red-300">{error}</p> : null}
      <div className="flex justify-between">
        <Button variant="secondary" disabled={step === 0} onClick={() => setStep(step - 1)}>
          Back
        </Button>
        {step < 3 ? (
          <Button onClick={() => setStep(step + 1)}>Continue</Button>
        ) : (
          <PremiumAction active={!pending}>
            <Button onClick={() => void submit()} disabled={pending || !startAt || !endAt}>
              {pending ? <AiThinkingOrb label="Generating…" size={20} state="composing" /> : "Generate Question Papers"}
            </Button>
          </PremiumAction>
        )}
      </div>
    </div>
  );
}
