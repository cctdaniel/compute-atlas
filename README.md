# Compute Atlas

A mobile-first, visual field guide to computer science. The first subject is AI & machine learning: a four-chapter roadmap and one complete, interactive lesson on gradient descent.

## Run locally

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Use `npm run build` for the production build, `npm run lint` for linting, and `npm test` for the numerical checks.

## What is ready

- A responsive atlas, searchable roadmap, and future subject pages.
- **How machines learn** at `/ai-ml/gradient-descent`, with intuition, step-by-step, and technical explanations of the same example.
- One shared player with back, step, play/pause, reset, a learning-rate slider, presets, trajectory comparison, and an auditable trace.
- Predict-before-reveal and transfer questions with worked answers.
- Light, dark, and system themes. System mode follows OS changes; the selected preference persists.
- Bookmarks, completion, reading position, explanation depth, learning rate, and simulation step stored in this browser. No account, backend, or cross-device sync.

The remaining 15 AI/ML concepts and the other subjects are explicitly marked as planned. They are not published lessons.

## Extend the atlas

`lib/curriculum.ts` is the content registry. Chapters contain typed lesson metadata and availability. Domains contain a slug, name, icon, description, and planned topic groups. Add a domain to `domains` to give it a navigation entry and a statically generated placeholder at `/<domain>`. Register subject chapters in `curricula`, add the finished `/<domain>/<lesson>` route, then mark that lesson available. Search and saved-lesson links derive from the domain and lesson slugs. The first domain has a custom overview; future domains start with the shared placeholder and can grow their own overview when content is ready.

`lib/gradient-descent.ts` contains pure simulation rules; rendering and playback are separate in `components/gradient-player.tsx`. The fixture uses x = 2, y = 4, initial w = 1, fixed bias 0, and L = ½(wx − y)². All displayed experiment values derive from this trace. Rounding happens only at display time.

Shared shell, preference persistence, and SVG icons live in `components/`. Base design tokens live in `app/globals.css`; `app/editorial.css` defines the reading typography, a 640px maximum prose column, spacing, and responsive navigation. Long-form text uses self-hosted Source Serif 4 at 18px on phones and 20px on larger screens (relative `rem` sizes), with Lora headings and DM Sans controls. Mobile navigation fills the viewport and the compact page header scrolls away while reading. Typography is self-hosted in `app/fonts/` with its open-source licenses, so builds do not fetch Google Fonts. The interface uses ordinary CSS and SVG without a charting or animation dependency.

## Interface and teaching verification

See [the audit record](docs/ui-ux-audit.md) for the design changes, teaching checks, coverage, and limits. The browser suite uses installed Google Chrome:

```sh
npm run build
npm run start -- --hostname 127.0.0.1 --port 3001
# In a second terminal:
npm run test:browser
```

Use `PLAYWRIGHT_BASE_URL` to target another running deployment. Test artifacts are ignored by Git. Browser tooling is a development dependency and is not shipped to readers.

## Vercel

This is a standard Next.js App Router project, using the repository's installed Next.js 16.4.5 documentation. Vercel can run the default `npm run build`; there are no required environment variables or database migrations.

The Vercel plugin inspection on November 7, 2026 identified the current repository's project as `prj_NVqLZp6L3jQmPW8wfrm5XFYrKkaI` (`compute-atlas`), with the alias `compute-atlas-pi.vercel.app`. Its existing starter deployment was `READY` at commit `a0a2e2275f5ac47c252f567b0fc2d102facd94a8`. For the current branch preview and build status, check the pull request’s Vercel deployment. Older similarly named projects also exist; verify the target before publishing.

## Teaching references

The curriculum document is a topic reference rather than an implementation contract. The original first lesson uses these teaching references:

- [3Blue1Brown: Gradient descent](https://www.3blue1brown.com/lessons/gradient-descent/)
- [Google ML Crash Course: Gradient descent](https://developers.google.com/machine-learning/crash-course/linear-regression/gradient-descent)
