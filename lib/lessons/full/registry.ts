import { fullFoundationLessons } from "./foundations-content.ts";
import { fullFoundationExperiments } from "./foundations-models.ts";

import { classicalLessons } from "./classical-content.ts";
import { classicalExperiments } from "./classical-models.ts";

export const referenceLessons = [...fullFoundationLessons, ...classicalLessons];
export const referenceExperiments = [
  ...fullFoundationExperiments,
  ...classicalExperiments,
];
