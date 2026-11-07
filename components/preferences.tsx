"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

type Preferences = { saved: string[]; completed: string[]; lastStep: number };
const initial: Preferences = { saved: [], completed: [], lastStep: 0 };
type ProgressContext = Preferences & { ready: boolean; toggleSaved: (slug: string) => void; toggleCompleted: (slug: string) => void; saveStep: (step: number) => void };
const Context = createContext<ProgressContext>({ ...initial, ready: false, toggleSaved: () => {}, toggleCompleted: () => {}, saveStep: () => {} });

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState(initial);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("compute-atlas-progress-v1") || "null");
      // Browser storage is unavailable to the server. Restore it once after hydration.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored) setData({
        saved: Array.isArray(stored.saved) ? stored.saved.filter((x: unknown) => typeof x === "string") : [],
        completed: Array.isArray(stored.completed) ? stored.completed.filter((x: unknown) => typeof x === "string") : [],
        lastStep: Number.isInteger(stored.lastStep) ? Math.max(0, Math.min(12, stored.lastStep)) : 0,
      });
    } catch { /* Storage may be unavailable; learning still works. */ }
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) try { localStorage.setItem("compute-atlas-progress-v1", JSON.stringify(data)); } catch { /* Session-only fallback. */ }
  }, [data, ready]);
  function toggle(key: "saved" | "completed", slug: string) {
    setData((previous) => ({ ...previous, [key]: previous[key].includes(slug) ? previous[key].filter((item) => item !== slug) : [...previous[key], slug] }));
  }
  const saveStep = useCallback((lastStep: number) => setData((previous) => previous.lastStep === lastStep ? previous : { ...previous, lastStep }), []);
  return <Context.Provider value={{ ...data, ready, toggleSaved: (slug) => toggle("saved", slug), toggleCompleted: (slug) => toggle("completed", slug), saveStep }}>{children}</Context.Provider>;
}

export const useProgress = () => useContext(Context);
