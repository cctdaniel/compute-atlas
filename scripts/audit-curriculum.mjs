import { readFileSync } from "node:fs";
import {
  referenceLessons,
  referenceExperiments,
} from "../lib/lessons/full/registry.ts";
import { publishedReferenceIds } from "../lib/lessons/full/published.ts";
const entries = JSON.parse(
  readFileSync(
    new URL("../lib/lessons/full/catalog-data.json", import.meta.url),
  ),
);
const ready = entries.filter(
  (entry) =>
    publishedReferenceIds.includes(entry.id) &&
    referenceLessons.some((lesson) => lesson.sourceId === entry.id) &&
    referenceExperiments.some((model) => model.id === entry.slug),
);
const missing = entries.filter((entry) => !ready.includes(entry));
console.log(
  `${ready.length}/190 reference lessons implemented; ${missing.length} remaining.`,
);
if (missing.length) {
  console.log(missing.map((entry) => `${entry.id}: ${entry.title}`).join("\n"));
  process.exitCode = 1;
}
