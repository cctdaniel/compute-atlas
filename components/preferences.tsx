"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

type Preferences = {
  saved: string[];
  completed: string[];
  lastStep: number;
  lastRate: number;
  lastSection: string;
  visited: boolean;
};
const initial: Preferences = {
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
};
const Context = createContext<ProgressContext>({
  ...initial, ready: false, toggleSaved: () => {}, toggleCompleted: () => {},
  saveExperiment: () => {}, saveSection: () => {}, recordVisit: () => {},
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
  const recordVisit = useCallback(() => setData((previous) => previous.visited ? previous : { ...previous, visited: true }), []);

  return <Context.Provider value={{
    ...data, ready, toggleSaved: (slug) => toggle("saved", slug), toggleCompleted: (slug) => toggle("completed", slug),
    saveExperiment, saveSection, recordVisit,
  }}>{children}</Context.Provider>;
}

export const useProgress = () => useContext(Context);
