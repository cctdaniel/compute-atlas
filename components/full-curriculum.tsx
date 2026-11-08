"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { referenceModules } from "@/lib/lessons/full/catalog";
import { publishedReferenceIds } from "@/lib/lessons/full/published";
import { Icon } from "./icon";
import { useProgress } from "./preferences";

const readHash = () => location.hash;
const emptyHash = () => "";
function subscribeHash(listener: () => void) {
  window.addEventListener("hashchange", listener);
  window.addEventListener("popstate", listener);
  return () => {
    window.removeEventListener("hashchange", listener);
    window.removeEventListener("popstate", listener);
  };
}

export function FullCurriculum() {
  const [track, setTrack] = useState("core");
  const [query, setQuery] = useState("");
  const root = useRef<HTMLElement>(null);
  const { completed } = useProgress();
  const hash = useSyncExternalStore(subscribeHash, readHash, emptyHash);
  const linkedModule = referenceModules.find(
    (module) => `#${module.id}` === hash,
  );
  const activeTrack = linkedModule
    ? linkedModule.lessons[0].sourceId!.startsWith("AP")
      ? "applied"
      : "core"
    : track;
  const searchValue = linkedModule ? "" : query;
  const term = searchValue.trim().toLowerCase();
  useEffect(() => {
    const target = root.current?.querySelector<HTMLDetailsElement>(
      `details[id="${CSS.escape(hash.slice(1))}"]`,
    );
    if (target) {
      target.open = true;
      target.scrollIntoView({ block: "start" });
    }
  }, [hash]);
  function leaveLinkedModule() {
    if (!linkedModule) return;
    setQuery("");
    window.history.replaceState(null, "", "#full-curriculum");
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  }
  const modules = referenceModules
    .map((module) => ({
      ...module,
      lessons: module.lessons.filter(
        (lesson) =>
          (term ||
            activeTrack === "all" ||
            (activeTrack === "applied") ===
              lesson.sourceId!.startsWith("AP")) &&
          `${lesson.sourceId} ${lesson.title}`.toLowerCase().includes(term),
      ),
    }))
    .filter((module) => module.lessons.length);
  return (
    <section
      ref={root}
      id="full-curriculum"
      className="full-curriculum"
      aria-labelledby="full-course-title"
    >
      <div className="section-heading">
        <div>
          <div className="eyebrow">THE COMPLETE CURRICULUM</div>
          <h2 id="full-course-title">AI & ML, from foundations to practice.</h2>
        </div>
      </div>
      <p className="full-course-intro">
        90 core lessons and 100 applied workflows, from mathematical foundations
        to building and evaluating AI systems. Follow the modules in order, or
        find a concept you need.
      </p>
      <p className="course-publication">
        {publishedReferenceIds.length} of 190 reference lessons available. The
        remaining lessons are in development.
      </p>
      <div className="course-controls">
        <div
          role="group"
          aria-label="Choose a curriculum track"
          className="course-tracks"
        >
          {[
            ["core", "Core · 90"],
            ["applied", "Applied · 100"],
            ["all", "Both tracks"],
          ].map(([id, title]) => (
            <button
              key={id}
              aria-pressed={activeTrack === id}
              onClick={() => {
                leaveLinkedModule();
                setTrack(id);
              }}
            >
              {title}
            </button>
          ))}
        </div>
        <label className="course-search">
          Find a lesson by topic or ID
          <input
            type="search"
            value={searchValue}
            onChange={(event) => {
              leaveLinkedModule();
              setQuery(event.target.value);
            }}
            placeholder="e.g. attention or L03"
          />
        </label>
      </div>
      <p className="course-result-count" role="status">
        {term
          ? `${modules.reduce((count, module) => count + module.lessons.length, 0)} matching lessons across both tracks`
          : `${modules.length} modules · Open a module to see its lessons`}
      </p>
      <div className="course-modules">
        {referenceModules.map((module) => {
          const visible = modules.find((item) => item.id === module.id);
          const ready = module.lessons.filter(
            (lesson) => lesson.status === "available",
          ).length;
          return (
            <details
              id={module.id}
              key={`${module.id}-${term ? "search" : activeTrack}`}
              hidden={!visible}
              open={term ? true : undefined}
            >
              <summary>
                <span className="course-module-id">{module.number}</span>
                <span className="course-module-title">
                  <strong>{module.title}</strong>
                  <small>
                    {ready ? `${ready} available · ` : ""}
                    {module.lessons.length} lessons
                    {!ready && " · In development"}
                  </small>
                </span>
                <Icon name="chevron" size={18} />
              </summary>
              <ol>
                {(visible?.lessons || module.lessons).map((lesson) => (
                  <li key={lesson.slug}>
                    {lesson.status === "available" ? (
                      <Link href={`/ai-ml/${lesson.slug}`}>
                        <span className="course-lesson-id">
                          {lesson.sourceId}
                        </span>
                        <span>{lesson.title}</span>
                        <span className="course-lesson-status">
                          {completed.includes(lesson.slug) ? (
                            <>
                              <Icon name="check" size={15} />
                              <span className="sr-only">Understood</span>
                            </>
                          ) : (
                            <>
                              <Icon name="arrow" size={16} />
                              <span className="sr-only">Read lesson</span>
                            </>
                          )}
                        </span>
                      </Link>
                    ) : (
                      <div className="course-lesson-planned">
                        <span className="course-lesson-id">
                          {lesson.sourceId}
                        </span>
                        <span>{lesson.title}</span>
                        <small>In development</small>
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            </details>
          );
        })}
      </div>
      {!modules.length && (
        <p className="course-empty">
          No matching lessons. Try a broader topic or a reference ID such as
          L03.
        </p>
      )}
    </section>
  );
}
