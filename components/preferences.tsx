"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

type LessonProgress = { step: number; scenario: string; section: string };
const sectionIds = ["the-problem", "intuition", "worked-update", "the-math", "experiment", "predict", "transfer", "sources"];

type Preferences = {
  lessonProgress: Record<string, LessonProgress>;
  lastLesson: string;
  saved: string[];
  completed: string[];
  lastStep: number;
  lastRate: number;
  lastSection: string;
  visited: boolean;
};
const initial: Preferences = {
  lessonProgress: {}, lastLesson: "",
  saved: [], completed: [], lastStep: 0, lastRate: 0.1,
  lastSection: "the-problem", visited: false,
};
type ProgressContext = Preferences & {
  ready: boolean;
  toggleSaved: (slug: string) => void;
  toggleCompleted: (slug: string) => void;
  saveExperiment: (step: number, rate: number) => void;
  saveSection: (section: string) => void;
  recordVisit: () => void;
  visitLesson: (slug: string) => void;
  saveLessonExperiment: (slug: string, step: number, scenario: string) => void;
  saveLessonSection: (slug: string, section: string) => void;
};
const Context = createContext<ProgressContext>({
  ...initial, ready: false, toggleSaved: () => {}, toggleCompleted: () => {},
  saveExperiment: () => {}, saveSection: () => {}, recordVisit: () => {},
  visitLesson: () => {}, saveLessonExperiment: () => {}, saveLessonSection: () => {},
});

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState(initial);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("compute-atlas-progress-v1") || "null");
      // Restore browser preferences once, after the server-rendered article hydrates.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored) setData({
        lessonProgress: stored.lessonProgress && typeof stored.lessonProgress === "object" && !Array.isArray(stored.lessonProgress) ? Object.fromEntries(Object.entries(stored.lessonProgress).filter(([slug, value]) => /^[a-z][a-z0-9-]+$/.test(slug) && value && typeof value === "object").map(([slug, raw]) => {
          const value = raw as Partial<LessonProgress>;
          return [slug, { step: typeof value.step === "number" && Number.isInteger(value.step) ? Math.max(0, Math.min(100, value.step)) : 0, scenario: typeof value.scenario === "string" ? value.scenario : "", section: value.section && sectionIds.includes(value.section) ? value.section : "the-problem" }];
        })) : {},
        lastLesson: typeof stored.lastLesson === "string" ? stored.lastLesson : stored.visited || stored.lastStep > 0 ? "gradient-descent" : "",
        saved: Array.isArray(stored.saved) ? stored.saved.filter((x: unknown) => typeof x === "string") : [],
        completed: Array.isArray(stored.completed) ? stored.completed.filter((x: unknown) => typeof x === "string") : [],
        lastStep: Number.isInteger(stored.lastStep) ? Math.max(0, Math.min(12, stored.lastStep)) : 0,
        lastRate: typeof stored.lastRate === "number" && Number.isFinite(stored.lastRate) && stored.lastRate >= 0.02 && stored.lastRate <= 0.6 ? stored.lastRate : 0.1,
        lastSection: stored.lastSection === "choose-your-depth" ? "intuition" : ["the-problem", "intuition", "worked-update", "the-math", "experiment", "predict", "transfer", "sources"].includes(stored.lastSection) ? stored.lastSection : "the-problem",
        visited: stored.visited === true || stored.lastStep > 0,
      });
    } catch { /* Unavailable storage falls back to session state. */ }
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) try { localStorage.setItem("compute-atlas-progress-v1", JSON.stringify(data)); } catch { /* Keep learning without persistent storage. */ }
  }, [data, ready]);

  function toggle(key: "saved" | "completed", slug: string) {
    setData((previous) => ({ ...previous, [key]: previous[key].includes(slug) ? previous[key].filter((item) => item !== slug) : [...previous[key], slug] }));
  }
  const saveExperiment = useCallback((lastStep: number, lastRate: number) => setData((previous) => previous.lastStep === lastStep && previous.lastRate === lastRate ? previous : { ...previous, lastStep, lastRate }), []);
  const saveSection = useCallback((lastSection: string) => setData((previous) => previous.lastSection === lastSection ? previous : { ...previous, lastSection }), []);
  const recordVisit = useCallback(() => setData((previous) => previous.visited && previous.lastLesson === "gradient-descent" ? previous : { ...previous, visited: true, lastLesson: "gradient-descent" }), []);
  const visitLesson = useCallback((slug: string) => setData((previous) => previous.lastLesson === slug ? previous : { ...previous, lastLesson: slug }), []);
  const saveLessonExperiment = useCallback((slug: string, step: number, scenario: string) => setData((previous) => {
    const progress = previous.lessonProgress[slug];
    return progress?.step === step && progress.scenario === scenario ? previous : { ...previous, lessonProgress: { ...previous.lessonProgress, [slug]: { section: progress?.section || "the-problem", step, scenario } } };
  }), []);
  const saveLessonSection = useCallback((slug: string, section: string) => setData((previous) => {
    const progress = previous.lessonProgress[slug];
    return progress?.section === section ? previous : { ...previous, lessonProgress: { ...previous.lessonProgress, [slug]: { step: progress?.step || 0, scenario: progress?.scenario || "", section } } };
  }), []);

  return <Context.Provider value={{
    ...data, ready, toggleSaved: (slug) => toggle("saved", slug), toggleCompleted: (slug) => toggle("completed", slug),
    saveExperiment, saveSection, recordVisit, visitLesson, saveLessonExperiment, saveLessonSection,
  }}>{children}</Context.Provider>;
}

export const useProgress = () => useContext(Context);
