# Compute Atlas

A mobile-first, visual field guide to computer science. The first expedition is AI & machine learning: a four-chapter roadmap and one complete, interactive lesson on gradient descent.

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
- Bookmarks, completion, and the last simulation step stored in this browser. No account, backend, or cross-device sync.

The remaining 15 AI/ML concepts and the other subjects are explicitly marked as planned. They are not published lessons.

## Extend the atlas

`lib/curriculum.ts` is the content registry. Chapters contain typed lesson metadata and availability. Domains contain a slug, name, icon, description, and planned topic groups. Add a domain to `domains` to give it a navigation entry and a statically generated placeholder at `/<domain>`. Register subject chapters in `curricula`, add the finished `/<domain>/<lesson>` route, then mark that lesson available. Search and saved-lesson links derive from the domain and lesson slugs. The first domain has a custom overview; future domains start with the shared placeholder and can grow their own overview when content is ready.

`lib/gradient-descent.ts` contains pure simulation rules; rendering and playback are separate in `components/gradient-player.tsx`. The fixture uses x = 2, y = 4, initial w = 1, fixed bias 0, and L = ½(wx − y)². All displayed experiment values derive from this trace. Rounding happens only at display time.

Shared shell, preference persistence, SVG icons, and design tokens live in `components/` and `app/globals.css`. Typography is self-hosted in `app/fonts/` with its open-source licenses, so builds do not fetch Google Fonts. The interface uses ordinary CSS and SVG without a charting or animation dependency.

## Vercel

This is a standard Next.js App Router project, using the repository's installed Next.js 16.4.5 documentation. Vercel can run the default `npm run build`; there are no required environment variables or database migrations.

The Vercel plugin inspection on November 7, 2026 identified the current repository's project as `prj_NVqLZp6L3jQmPW8wfrm5XFYrKkaI` (`compute-atlas`), with the alias `compute-atlas-pi.vercel.app`. Its existing starter deployment was `READY` at commit `a0a2e2275f5ac47c252f567b0fc2d102facd94a8`. For the current branch preview and build status, check the pull request’s Vercel deployment. Older similarly named projects also exist; verify the target before publishing.

## Teaching references

The curriculum document is a topic reference rather than an implementation contract. The original first lesson uses these teaching references:

- [3Blue1Brown: Gradient descent](https://www.3blue1brown.com/lessons/gradient-descent/)
- [Google ML Crash Course: Gradient descent](https://developers.google.com/machine-learning/crash-course/linear-regression/gradient-descent)
