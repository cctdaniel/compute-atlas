import entries from "./catalog-data.json";
import { publishedReferenceIds } from "./published";
import type { Chapter } from "../../curriculum";

export const referenceCatalog = entries;
export const referenceById = Object.fromEntries(
  entries.map((entry) => [entry.id, entry]),
);
export const referenceBySlug = Object.fromEntries(
  entries.map((entry) => [entry.slug, entry]),
);
const moduleIds = [...new Set(entries.map((entry) => entry.module))];
export const referenceModules: Chapter[] = moduleIds.map((module, index) => {
  const members = entries.filter((entry) => entry.module === module);
  return {
    id: `course-${module}`,
    number: String(index + 1).padStart(2, "0"),
    title: members[0].moduleTitle,
    description:
      members[0].track === "Applied AI"
        ? "Put the mechanisms into a complete, inspectable product workflow."
        : "Build the prerequisites, then trace the mechanism and its limits.",
    icon: members[0].track === "Applied AI" ? "chart" : "network",
    lessons: members.map((entry) => ({
      slug: entry.slug,
      sourceId: entry.id,
      title: entry.title,
      description: `${entry.track} · ${entry.moduleTitle}`,
      minutes: 15,
      status: publishedReferenceIds.includes(entry.id)
        ? "available"
        : "planned",
      tag: `${entry.id} · ${entry.track}`,
    })),
  };
});
