"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";

const TOUR_STORAGE_KEY = "resort-portfolio-tour-seen-v1";

const STEPS = [
  {
    target: "demo-status",
    title: "A safe portfolio sandbox",
    text: "Everything here is fictional. Your changes stay in this browser and never reach the live resort.",
  },
  {
    target: "date-navigation",
    title: "Move through the calendar",
    text: "Use the arrows to move by date range, or jump straight back to today.",
  },
  {
    target: "zoom-controls",
    title: "Adjust the timeline",
    text: "Zoom in to read booking names or zoom out for a wider availability overview.",
  },
  {
    target: "new-reservation",
    title: "Create a reservation",
    text: "Choose New, or click any empty room-and-date cell, to add a fictional booking.",
  },
  {
    target: "room-rack",
    title: "Explore the room rack",
    text: "Rooms are grouped by category. Coloured bars show bookings and payment status; select one to edit it.",
  },
  {
    target: "demo-menu",
    title: "Try the management tools",
    text: "Open the menu to manage simulated users and rooms, inspect the audit log, or view version history.",
  },
  {
    target: "reset-demo",
    title: "Start over whenever you like",
    text: "Reset restores the original fictional rooms and bookings after you finish experimenting.",
  },
] as const;

type TourMode = "hidden" | "intro" | "tour";

interface Highlight {
  top: number;
  left: number;
  width: number;
  height: number;
  tooltipTop: number;
  tooltipLeft: number;
}

export default function GuidedTour() {
  const [mode, setMode] = useState<TourMode>("hidden");
  const [step, setStep] = useState(0);
  const [highlight, setHighlight] = useState<Highlight | null>(null);

  const rememberChoice = useCallback(() => {
    try {
      window.localStorage.setItem(TOUR_STORAGE_KEY, "true");
    } catch {
      // The tour still works when storage is blocked; it may be offered again later.
    }
  }, []);

  const closeTour = useCallback(() => {
    rememberChoice();
    setMode("hidden");
    setHighlight(null);
  }, [rememberChoice]);

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(TOUR_STORAGE_KEY)) setMode("intro");
    } catch {
      setMode("intro");
    }

    function restartTour() {
      setStep(0);
      setMode("intro");
    }
    window.addEventListener("resort-demo-tour-start", restartTour);
    return () => window.removeEventListener("resort-demo-tour-start", restartTour);
  }, []);

  const positionStep = useCallback(() => {
    if (mode !== "tour") return;
    const element = document.querySelector<HTMLElement>(`[data-tour="${STEPS[step].target}"]`);
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const padding = 6;
    const width = Math.min(320, window.innerWidth - 24);
    const tooltipHeight = 190;
    const below = rect.bottom + 14;
    const above = rect.top - tooltipHeight - 14;
    const tooltipTop = below + tooltipHeight <= window.innerHeight
      ? below
      : Math.max(12, above);
    const tooltipLeft = Math.min(
      Math.max(12, rect.left + rect.width / 2 - width / 2),
      window.innerWidth - width - 12
    );

    setHighlight({
      top: Math.max(4, rect.top - padding),
      left: Math.max(4, rect.left - padding),
      width: Math.min(rect.width + padding * 2, window.innerWidth - 8),
      height: Math.min(rect.height + padding * 2, window.innerHeight - 8),
      tooltipTop,
      tooltipLeft,
    });
  }, [mode, step]);

  useLayoutEffect(() => {
    positionStep();
    window.addEventListener("resize", positionStep);
    window.addEventListener("scroll", positionStep, true);
    return () => {
      window.removeEventListener("resize", positionStep);
      window.removeEventListener("scroll", positionStep, true);
    };
  }, [positionStep]);

  useEffect(() => {
    if (mode === "hidden") return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") closeTour();
      if (mode === "tour" && event.key === "ArrowRight") {
        if (step === STEPS.length - 1) closeTour();
        else setStep((current) => current + 1);
      }
      if (mode === "tour" && event.key === "ArrowLeft") setStep((current) => Math.max(0, current - 1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeTour, mode, step]);

  if (mode === "hidden") return null;

  if (mode === "intro") {
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="tour-title">
        <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
          <div className="bg-gradient-to-br from-cyan-500 to-blue-700 px-6 py-7 text-white">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-2xl">✦</div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-100">Interactive portfolio</p>
            <h2 id="tour-title" className="mt-2 text-2xl font-bold">Would you like a quick demo?</h2>
            <p className="mt-2 text-sm leading-6 text-cyan-50">Take a short guided tour of the room rack, reservations, and management tools.</p>
          </div>
          <div className="flex items-center gap-3 p-5">
            <button onClick={closeTour} className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">No thanks</button>
            <button onClick={() => { setStep(0); setMode("tour"); }} className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">Next</button>
          </div>
        </div>
      </div>
    );
  }

  const current = STEPS[step];

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label="Guided application tour">
      {highlight && (
        <>
          <div
            className="pointer-events-none fixed rounded-xl border-2 border-cyan-300 transition-all duration-200"
            style={{
              top: highlight.top,
              left: highlight.left,
              width: highlight.width,
              height: highlight.height,
              boxShadow: "0 0 0 9999px rgba(2, 6, 23, 0.72), 0 0 0 5px rgba(34, 211, 238, 0.2)",
            }}
          />
          <div
            className="fixed w-[min(320px,calc(100vw-24px))] rounded-2xl bg-white p-5 shadow-2xl"
            style={{ top: highlight.tooltipTop, left: highlight.tooltipLeft }}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Step {step + 1} of {STEPS.length}</span>
              <button onClick={closeTour} className="text-xs font-medium text-slate-400 hover:text-slate-700">Skip tour</button>
            </div>
            <h3 className="mt-2 text-lg font-bold text-slate-900">{current.title}</h3>
            <p className="mt-1 text-sm leading-5 text-slate-600">{current.text}</p>
            <div className="mt-4 flex items-center gap-2">
              <button onClick={() => setStep((currentStep) => Math.max(0, currentStep - 1))} disabled={step === 0} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-600 disabled:opacity-30">Back</button>
              <button
                onClick={() => step === STEPS.length - 1 ? closeTour() : setStep((currentStep) => currentStep + 1)}
                className="ml-auto rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                {step === STEPS.length - 1 ? "Finish" : "Next"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
