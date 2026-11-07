# Interface and teaching audit

Date: November 7, 2026

## Design intent

A quiet reference book with a small, inspectable workbench. Reading is the primary activity. Serif prose, a limited line length, restrained colors, and consistent utility controls give the explanation priority. Visuals describe the mechanism rather than decorate the page.

## Changes made

| Area | Findings addressed |
| --- | --- |
| Reading | Consistent 18px phone / 20px larger-screen prose, relative type sizes, 640px maximum reading column, readable section labels, short paragraphs, and clear heading hierarchy. |
| Mobile shell | 56px header scrolls away. Full-screen navigation shares the header’s logo and button geometry, includes safe-area padding, and uses an opaque theme-matched backdrop. The logo is also a full-height touch target. |
| Navigation | Accurate subject selection, labeled planned subjects, section-aware lesson contents, contents that collapse after navigation, and a Continue action that returns to the saved section. |
| Search | Named dialog, focused and labeled search field, available/planned groups, result count, recoverable empty state, keyboard shortcut, Escape, and roadmap destinations for planned material. |
| Reading list | Clear empty and populated states, descriptive remove buttons, explicit local storage scope, removal feedback, Undo, and deliberate focus restoration. |
| Player | Stable dimensions through all playback values, Play/Pause/Replay label changes, all three explanation depths, and divergent trajectories. Depth, step, and learning rate persist together. Captions announce manual changes without speaking over continuous playback. |
| Large text | Subject cards, metric grids, answer options, depth controls, long titles, example labels, and navigation names reflow. Tables have their own labeled keyboard-scrollable region. |
| Content | Replaced the abstract practice/score example with a notebook receipt. Defined weight, training, inference, error, loss, gradient, and learning rate where introduced. Broke the worked update into predict, measure, adjust, and check. |
| Visuals | Original notebook/receipt diagram and a calculated quadratic loss curve for the exact lesson fixture. The interactive chart, statistics, captions, and trace share the pure training calculation. |
| Scope | One available lesson; 15 planned AI/ML concepts; five planned subjects. Planned material is never presented as a finished lesson. Roadmap names identify the actual concepts. |

## Teaching checks

The example is quantity x = 2, receipt total y = 4, estimated unit price w = 1, and fixed bias 0. Prediction is wx; loss is half the squared error. At learning rate 0.10, the first update is w = 1.4, prediction = 2.8, loss = 0.72. The second update is w = 1.64, loss = 0.2592. At 0.25 the fit is exact in one update; 0.50 oscillates; 0.60 diverges.

The intuition explains the correspondence between weight, slope, and loss, and states where the hillside analogy stops. The numerical level shows all intermediate calculations. The technical level defines its notation, derives the convergence range for this specific quadratic, and limits the claim to this example. The prediction question supplies the update rule; the transfer question changes the receipt to three notebooks for $6 and derives a different update (1.9).

The lesson explicitly explains why division would solve this toy receipt, why the update rule is still useful to learn, and why fitting one receipt says nothing about performance on unseen data.

References: [3Blue1Brown](https://www.3blue1brown.com/lessons/gradient-descent/), [Google ML Crash Course](https://developers.google.com/machine-learning/crash-course/linear-regression/gradient-descent). The lesson and visuals are original.

## Verification

Production build, lint, five numerical tests, and all 21 browser tests passed. The browser suite includes both light/dark axe scans with no reported violations in the checked states.

Run `npm run build`, serve it with `npm run start -- --hostname 127.0.0.1 --port 3001`, then run `npm run test:browser`. The browser suite uses installed Google Chrome; no browser download is required. A different deployment can be checked with `PLAYWRIGHT_BASE_URL`.

Coverage includes:

- Nine routes at 320, 390, 768, and 1440px, in light and dark: root reflow, one main heading, and runtime errors.
- All routes at 200% root text size on a 320px viewport, all three explanation panels, internal clipping in the example/workbench, and enlarged navigation.
- Exact logo geometry before/after opening navigation, full-screen bounds, opaque backdrop, Escape focus return, and a header that scrolls away.
- Short-phone navigation, theme persistence, live System theme changes, search groups/empty state/roadmap routing, bookmarks/Undo, quiz feedback, completion, and reading-position resume.
- Normal and divergent traces at every depth, all 12 forward steps, Back, Reset, autoplay/Pause/Replay, and persisted rate/depth/step.
- Automated axe checks for WCAG A/AA rules across primary route types and both dialogs in light and dark. Automated results are evidence for the checked states, not a conformance certification.
- Five pure numerical tests for worked values, the exact-fit preset, the stability boundary, divergence, full-precision calculation, and invalid inputs.
- Visual inspection of phone and desktop screenshots, both themes, the receipt diagram, the loss landscape, and the player.

The audit follows the [Web Interface Guidelines](https://github.com/vercel-labs/web-interface-guidelines). Physical iPhone Safari, VoiceOver, and other assistive technologies still require device-based validation. Chrome emulation cannot verify Safari’s browser chrome or safe-area behavior on hardware.
