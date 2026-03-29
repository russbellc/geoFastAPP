"use client";

import { useState, useEffect } from "react";

interface Step {
  target: string;
  title: string;
  description: string;
  position: "top" | "bottom" | "left" | "right";
}

const STEPS: Step[] = [
  {
    target: '[data-onboarding="sidebar"]',
    title: "Navigation",
    description: "Use the sidebar to navigate between Intelligence, Territories, Leads, Health Niche, Analytics, and Settings.",
    position: "right",
  },
  {
    target: '[data-onboarding="new-scan"]',
    title: "Launch a Scan",
    description: "Click 'New Scan' to scan a territory. Define a radius or draw a polygon on the map to discover businesses.",
    position: "right",
  },
  {
    target: '[data-onboarding="search"]',
    title: "AI Semantic Search",
    description: "Search businesses using natural language. Try: 'clinics in Lima with no website' or 'restaurants near Miraflores'.",
    position: "bottom",
  },
  {
    target: '[data-onboarding="opportunities"]',
    title: "Opportunities Panel",
    description: "Browse discovered businesses with their Opportunity Score (0-100). Filter by category or score threshold.",
    position: "right",
  },
  {
    target: '[data-onboarding="map"]',
    title: "Interactive Map",
    description: "Explore businesses on the map with dark CARTO tiles. Click markers for details. Use the legend to understand density.",
    position: "left",
  },
];

const STORAGE_KEY = "geointel_onboarding_complete";

export default function OnboardingOverlay() {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [highlight, setHighlight] = useState<DOMRect | null>(null);

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) {
      setTimeout(() => setVisible(true), 1500);
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    const el = document.querySelector(STEPS[step]?.target || "");
    if (el) {
      const rect = el.getBoundingClientRect();
      setHighlight(rect);
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      setHighlight(null);
    }
  }, [step, visible]);

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = () => {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, "true");
  };

  if (!visible) return null;

  const currentStep = STEPS[step];
  const isLast = step === STEPS.length - 1;

  // Calculate tooltip position
  const tooltipStyle: React.CSSProperties = { position: "fixed", zIndex: 10001 };
  if (highlight) {
    switch (currentStep.position) {
      case "right":
        tooltipStyle.top = highlight.top + highlight.height / 2 - 60;
        tooltipStyle.left = highlight.right + 16;
        break;
      case "left":
        tooltipStyle.top = highlight.top + highlight.height / 2 - 60;
        tooltipStyle.right = window.innerWidth - highlight.left + 16;
        break;
      case "bottom":
        tooltipStyle.top = highlight.bottom + 16;
        tooltipStyle.left = highlight.left;
        break;
      case "top":
        tooltipStyle.bottom = window.innerHeight - highlight.top + 16;
        tooltipStyle.left = highlight.left;
        break;
    }
  } else {
    tooltipStyle.top = "50%";
    tooltipStyle.left = "50%";
    tooltipStyle.transform = "translate(-50%, -50%)";
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9999] bg-black/60 transition-opacity duration-300"
        onClick={handleFinish}
      />

      {/* Highlight cutout */}
      {highlight && (
        <div
          className="fixed z-[10000] rounded-xl ring-2 ring-primary ring-offset-2 ring-offset-transparent transition-all duration-300"
          style={{
            top: highlight.top - 4,
            left: highlight.left - 4,
            width: highlight.width + 8,
            height: highlight.height + 8,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.6)",
            pointerEvents: "none",
          }}
        />
      )}

      {/* Tooltip */}
      <div style={tooltipStyle} className="w-80">
        <div className="bg-surface-container-low border border-outline-variant/20 rounded-2xl p-6 shadow-2xl">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-4">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? "w-6 bg-primary" : i < step ? "w-3 bg-primary/40" : "w-3 bg-surface-container-highest"
                }`}
              />
            ))}
            <span className="ml-auto text-[10px] text-on-surface-variant font-bold">
              {step + 1}/{STEPS.length}
            </span>
          </div>

          <h3 className="font-headline font-bold text-on-surface text-lg mb-2">
            {currentStep.title}
          </h3>
          <p className="text-on-surface-variant text-sm leading-relaxed mb-6">
            {currentStep.description}
          </p>

          <div className="flex justify-between items-center">
            <button
              onClick={handleFinish}
              className="text-on-surface-variant text-xs font-bold hover:text-on-surface transition-colors"
            >
              Skip Tour
            </button>
            <button
              onClick={handleNext}
              className="gradient-primary text-on-primary-fixed px-5 py-2 rounded-lg font-bold text-sm transition-all hover:opacity-90"
            >
              {isLast ? "Get Started" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
