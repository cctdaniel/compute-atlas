import { fullFoundationLessons } from "./foundations-content.ts";
import { fullFoundationExperiments } from "./foundations-models.ts";

import { classicalLessons } from "./classical-content.ts";
import { classicalExperiments } from "./classical-models.ts";

import { neuralLessons } from "./neural-content.ts";
import { neuralExperiments } from "./neural-models.ts";

import { sequenceLessons } from "./sequence-content.ts";
import { sequenceExperiments } from "./sequence-models.ts";

export const referenceLessons = [
  ...fullFoundationLessons,
  ...classicalLessons,
  ...neuralLessons,
  ...sequenceLessons,
];
export const referenceExperiments = [
  ...fullFoundationExperiments,
  ...classicalExperiments,
  ...neuralExperiments,
  ...sequenceExperiments,
];
