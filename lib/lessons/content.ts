import { foundationLessons } from "./foundations";
import { machineLearningLessons } from "./machine-learning";
import { neuralNetworkLessons } from "./neural-networks";
import { languageModelLessons } from "./language-models";

export const conceptLessons = [...foundationLessons, ...machineLearningLessons, ...neuralNetworkLessons, ...languageModelLessons];
export const contentBySlug = Object.fromEntries(conceptLessons.map((lesson) => [lesson.slug, lesson]));
