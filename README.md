# Compute Atlas

A mobile-first, visual field guide to computer science. The first subject is AI & machine learning: a 16-lesson starter path, plus an expanding reference course with all 190 topics organized into 24 modules. Canonical lessons L01–L14 are implemented; the other 176 remain in development.

## Run locally

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Use `npm run build` for the production build, `npm run lint` for linting, and `npm test` for the numerical checks. `npm run preflight` runs lint, numerical tests, and a production build.

## What is ready

- A responsive atlas, searchable roadmap, and future subject pages.
- **16 introductory AI/ML lessons** and **14 canonical reference lessons**, each with intuition, a worked numerical example, a prediction, a concept-specific experiment, optional mathematics, a transfer challenge, and sources in one continuous article.
- The canonical course adds tensors, information theory, data provenance/leakage, classical algorithms, geometric methods, causality, and interval coverage: 62 scenarios and 369 computed frames.
- A gradient-descent workbench with learning-rate controls and comparison, plus a shared semantic player for the other 15 concepts: 47 scenarios and 290 computed frames, with back, step, play/pause, replay, reset, scenario selection, and an auditable trace.
- Predict-before-reveal and transfer questions with worked answers.
- Light, dark, and system themes. System mode follows OS changes; the selected preference persists.
- Bookmarks, completion, and per-lesson reading position, scenario, and simulation step stored in this browser. The original gradient-descent rate and progress migrate unchanged. No account, backend, or cross-device sync.

Algorithms, systems, networks, databases, and security remain explicitly planned subject areas. Their navigation entries and topic structures are ready for future curricula.

The reference document contains 190 AI/ML lesson entries (90 core and 100 applied). Fourteen canonical entries are implemented in addition to the supplementary starter path. The full 190-entry implementation is still incomplete. See [reference coverage and gaps](docs/ai-ml-reference-coverage.md) before treating the starter path as the full curriculum.

## Extend the atlas

`lib/curriculum.ts` is the content registry. Chapters contain typed lesson metadata and availability. Domains contain a slug, name, icon, description, and planned topic groups. Add a domain to `domains` to give it a navigation entry and a statically generated placeholder at `/<domain>`. Register subject chapters in `curricula`, add the finished `/<domain>/<lesson>` route, then mark that lesson available. Search and saved-lesson links derive from the domain and lesson slugs. The first domain has a custom overview; future domains start with the shared placeholder and can grow their own overview when content is ready.

`lib/gradient-descent.ts` contains pure simulation rules; rendering and playback are separate in `components/gradient-player.tsx`. The fixture uses x = 2, y = 4, initial w = 1, fixed bias 0, and L = ½(wx − y)². All displayed experiment values derive from this trace. Rounding happens only at display time.

`lib/lessons/` separates typed lesson content, numerical models, and semantic frames. The dynamic `app/ai-ml/[lesson]/page.tsx` prerenders the additional lessons and passes only the requested content/trace to `components/lessons/`. Each diagram represents its own mechanism; playback does not implement the numerical rules. Scenario and caption reserves keep the player geometry stable across its supported states, including enlarged text.

Shared shell, preference persistence, and SVG icons live in `components/`. Base design tokens live in `app/globals.css`; `app/editorial.css` defines the reading typography, a 640px maximum prose column, spacing, and responsive navigation. Long-form text uses self-hosted Source Serif 4 at 18px on phones and 20px on larger screens (relative `rem` sizes), with Lora headings and DM Sans controls. `app/concepts.css` adds the responsive workbench and concept diagrams. Mobile navigation fills the viewport and the compact page header scrolls away while reading. Typography is self-hosted in `app/fonts/` with its open-source licenses, so builds do not fetch Google Fonts. The interface uses ordinary CSS and SVG without a charting or animation dependency.

Run `npm run audit:curriculum` for the strict completion inventory. It exits unsuccessfully while any of the 190 entries lacks a published article and experiment. At this checkpoint it reports 14/190, with 176 remaining. This inventory check does not replace content review or browser verification. See [implementation record](docs/implementation/ai-ml-190.md).

## Interface and teaching verification

See [the original interface audit](docs/ui-ux-audit.md) and [the starter-path audit](docs/curriculum-audit.md) for the design changes, teaching checks, coverage, and limits. The browser suite uses installed Google Chrome:

```sh
npm run build
npm run start -- --hostname 127.0.0.1 --port 3001
# In a second terminal:
npm run test:browser
```

Use `PLAYWRIGHT_BASE_URL` to target another running deployment. The same suite can run in WebKit with `PLAYWRIGHT_BROWSER=webkit npm run test:browser` after `npx --no-install playwright install webkit`. Test artifacts are ignored by Git. Browser tooling is a development dependency and is not shipped to readers.

## Vercel

This is a standard Next.js App Router project, using the repository's installed Next.js 16.4.5 documentation. Vercel can run the default `npm run build`; there are no required environment variables or database migrations.

The Vercel plugin inspection on November 7, 2026 identified the current repository's project as `prj_NVqLZp6L3jQmPW8wfrm5XFYrKkaI` (`compute-atlas`), with the alias `compute-atlas-pi.vercel.app`. PR #1 was merged to main at `8118bb1`, and its production deployment was verified `READY`. For the current branch preview and build status, check the pull request’s Vercel deployment. Older similarly named projects also exist; verify the target before publishing.

## Teaching references

The curriculum document is a topic reference rather than an implementation contract. Each lesson links its own primary references. The original first lesson uses:

- [3Blue1Brown: Gradient descent](https://www.3blue1brown.com/lessons/gradient-descent/)
- [Google ML Crash Course: Gradient descent](https://developers.google.com/machine-learning/crash-course/linear-regression/gradient-descent)
