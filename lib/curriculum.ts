export type Lesson = {
  slug: string;
  title: string;
  description: string;
  minutes: number;
  status: "available" | "planned";
  tag: string;
};

export type Chapter = {
  id: string;
  number: string;
  title: string;
  description: string;
  icon: "seed" | "chart" | "network" | "sparkles";
  lessons: Lesson[];
};

export const chapters: Chapter[] = [
  {
    id: "foundations", number: "01", title: "The foundations", icon: "seed",
    description: "Start small. See what it actually means for a machine to learn.",
    lessons: [
      { slug: "gradient-descent", title: "How machines learn", description: "Use a notebook receipt to follow a model through prediction, loss, and a gradient descent update.", minutes: 12, status: "available", tag: "Gradient descent" },
      { slug: "vectors-and-matrices", title: "Vectors & matrices", description: "Turn pictures, words, and measurements into numbers a model can use.", minutes: 10, status: "planned", tag: "Linear algebra" },
      { slug: "probability", title: "Probability & uncertainty", description: "Probability, conditional probability, and updating a belief.", minutes: 14, status: "planned", tag: "Probability" },
      { slug: "data-and-splits", title: "Training, validation & test data", description: "Features, labels, and keeping training separate from testing.", minutes: 10, status: "planned", tag: "Data" },
    ],
  },
  {
    id: "machine-learning", number: "02", title: "Learning from data", icon: "chart",
    description: "Make predictions. Measure mistakes. Learn what carries over.",
    lessons: [
      { slug: "linear-regression", title: "Linear regression", description: "Fit a simple model to a small dataset, one prediction at a time.", minutes: 14, status: "planned", tag: "Regression" },
      { slug: "classification", title: "Classification", description: "From a score to a decision: logistic regression and classification.", minutes: 14, status: "planned", tag: "Classification" },
      { slug: "overfitting", title: "Overfitting & generalization", description: "Watch training error fall while unseen examples tell another story.", minutes: 12, status: "planned", tag: "Generalization" },
      { slug: "evaluation", title: "Precision, recall & evaluation", description: "Precision, recall, and the mistakes an average can hide.", minutes: 12, status: "planned", tag: "Evaluation" },
    ],
  },
  {
    id: "neural-networks", number: "03", title: "Inside a neural network", icon: "network",
    description: "Follow the numbers through layers, then send the gradients back.",
    lessons: [
      { slug: "neurons", title: "Neurons & activation functions", description: "Weights, biases, and why an activation function matters.", minutes: 12, status: "planned", tag: "Neural networks" },
      { slug: "backpropagation", title: "How backpropagation works", description: "A small, worked example of the chain rule and backpropagation.", minutes: 18, status: "planned", tag: "Backpropagation" },
      { slug: "embeddings", title: "Embeddings & similarity", description: "Explore learned representations and similarity in an embedding space.", minutes: 12, status: "planned", tag: "Embeddings" },
      { slug: "optimizers", title: "Momentum & adaptive optimizers", description: "Compare plain gradient descent, momentum, and adaptive steps.", minutes: 14, status: "planned", tag: "Optimization" },
    ],
  },
  {
    id: "language-models", number: "04", title: "Language, attention & beyond", icon: "sparkles",
    description: "Connect the foundations to the models and systems we use today.",
    lessons: [
      { slug: "tokenization", title: "Tokenization", description: "See how text becomes tokens and tokens become model inputs.", minutes: 10, status: "planned", tag: "Tokenization" },
      { slug: "attention", title: "Queries, keys & attention", description: "Trace queries, keys, and values through one small attention head.", minutes: 18, status: "planned", tag: "Attention" },
      { slug: "transformers", title: "The transformer architecture", description: "Follow a token through attention, residuals, and feed-forward layers.", minutes: 18, status: "planned", tag: "Transformers" },
      { slug: "retrieval-and-agents", title: "Retrieval & tool use", description: "Give models context and tools, then evaluate the whole system.", minutes: 16, status: "planned", tag: "RAG & agents" },
    ],
  },
];

export const domains = [
  { slug: "ai-ml", title: "AI & Machine learning", short: "AI & ML", icon: "network" as const, description: "Understand how models learn, make predictions, and work with language.", topics: ["Foundations", "Machine learning", "Neural networks", "Language models"] },
  { slug: "algorithms", title: "Algorithms & data structures", short: "Algorithms", icon: "branches" as const, description: "Find the patterns behind efficient problem solving.", topics: ["Data structures", "Searching & sorting", "Graphs", "Complexity"] },
  { slug: "systems", title: "Computer systems", short: "Systems", icon: "layers" as const, description: "Follow a program all the way down to the machine.", topics: ["Architecture", "Operating systems", "Memory", "Concurrency"] },
  { slug: "networks", title: "Networks & the internet", short: "Networks", icon: "globe" as const, description: "Understand what happens between here and there.", topics: ["Protocols", "Routing", "TCP & reliability", "The web"] },
  { slug: "databases", title: "Databases & storage", short: "Databases", icon: "database" as const, description: "Explore how information is stored, found, and kept consistent.", topics: ["Data modeling", "Indexes", "Transactions", "Distributed data"] },
  { slug: "security", title: "Security & cryptography", short: "Security", icon: "shield" as const, description: "Build an intuition for trust, secrets, and secure systems.", topics: ["Cryptography", "Authentication", "Web security", "Threat modeling"] },
];

export const lessonHref = (domain: string, lesson: string) => `/${domain}/${lesson}`;

/** Add a subject's chapters here as its lessons become ready. Navigation stays data-driven. */
export const curricula: Record<string, Chapter[]> = { "ai-ml": chapters };
export const allLessons = Object.entries(curricula).flatMap(([domain, subjectChapters]) => subjectChapters.flatMap((chapter) => chapter.lessons.map((lesson) => ({
  ...lesson,
  domain,
  chapter: chapter.title,
  chapterId: chapter.id,
  href: lessonHref(domain, lesson.slug),
  roadmapHref: `${domain === "ai-ml" ? "/" : `/${domain}`}#${chapter.id}`,
}))));
export const firstLesson = allLessons[0];
