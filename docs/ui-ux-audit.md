# Interface and teaching audit

Date: November 7, 2026

Updated after review against the revised build-explainer skill.

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
| Player | Stable dimensions across every learning rate, preset, playback value, Play/Pause/Replay label, reset, and comparison state. Numeric readouts stay on one line; notes and captions reserve space across the entire supported range. Step and learning rate persist together. Captions announce manual changes without speaking over continuous playback. |
| Large text | Subject cards, metric grids, answer options, long titles, example labels, and navigation names reflow. Tables have their own labeled keyboard-scrollable region. |
| Content | Replaced the abstract practice/score example with a notebook receipt. Defined weight, training, inference, error, loss, gradient, and learning rate where introduced. Broke the worked update into predict, measure, adjust, and check. |
| Visuals | Original notebook/receipt diagram and a calculated quadratic loss curve for the exact lesson fixture. Labels sit above the plotting area, with arrow leaders ending at the exact points. The interactive chart, statistics, captions, and trace share the pure training calculation. |
| Scope | One available lesson; 15 planned AI/ML concepts; five planned subjects. Planned material is never presented as a finished lesson. Roadmap names identify the actual concepts. |

## Teaching checks

The example is quantity x = 2, receipt total y = 4, estimated unit price w = 1, and fixed bias 0. Prediction is wx; loss is half the squared error. At learning rate 0.10, the first update is w = 1.4, prediction = 2.8, loss = 0.72. The second update is w = 1.64, loss = 0.2592. At 0.25 the fit is exact in one update; 0.50 oscillates; 0.60 diverges.

The intuition explains the correspondence between weight, slope, and loss, and states where the hillside analogy stops. The numerical level shows all intermediate calculations. The technical level defines its notation, derives the convergence range for this specific quadratic, and limits the claim to this example. The prediction question supplies the update rule; the transfer question changes the receipt to three notebooks for $6 and derives a different update (1.9).

The lesson explicitly explains why division would solve this toy receipt, why the update rule is still useful to learn, and why fitting one receipt says nothing about performance on unseen data.

References: [3Blue1Brown](https://www.3blue1brown.com/lessons/gradient-descent/), [Google ML Crash Course](https://developers.google.com/machine-learning/crash-course/linear-regression/gradient-descent). The lesson and visuals are original.

## Verification

Production build, lint, five numerical tests, and all 33 browser tests passed in both Chrome and WebKit (66 browser checks). The browser suite includes both light/dark axe scans with no reported violations in the checked states.

Run `npm run build`, serve it with `npm run start -- --hostname 127.0.0.1 --port 3001`, then run `npm run test:browser`. The browser suite uses installed Google Chrome; no browser download is required. A different deployment can be checked with `PLAYWRIGHT_BASE_URL`. To check WebKit, install it with `npx --no-install playwright install webkit` and run `PLAYWRIGHT_BROWSER=webkit npm run test:browser`.

Coverage includes:

- Nine routes at 320, 390, 768, and 1440px, in light and dark: root reflow, one main heading, and runtime errors.
- All routes at 200% root text size on a 320px viewport, the full continuous lesson, internal clipping in the example/workbench, and enlarged navigation.
- Exact logo geometry before/after opening navigation, full-screen bounds, opaque backdrop, Escape focus return, and a header that scrolls away.
- Short-phone navigation, theme persistence, live System theme changes, search groups/empty state/roadmap routing, bookmarks/Undo, quiz feedback, completion, and reading-position resume.
- Every slider stop from 0.02 to 0.60, every update in all three presets, Back, Reset, autoplay/Pause/Replay, comparison on/off, trace expansion/collapse, and persisted rate/step. Relative component positions, metric dimensions, and total panel height are compared across state transitions at 320, 390, and 768px, at normal and 200% text.
- Automated axe checks for WCAG A/AA rules across primary route types and both dialogs in light and dark. Automated results are evidence for the checked states, not a conformance certification.
- Five pure numerical tests for worked values, the exact-fit preset, the stability boundary, divergence, full-precision calculation, and invalid inputs.
- Visual inspection of phone and desktop screenshots, both themes, the receipt diagram, the annotated loss landscape, and the player. Chart-label separation and exact arrow endpoints checked at 320, 390, and 768px. Learning-rate preset labels and values are stacked, with individual bounds checked at those widths, in both themes, at 100% and 200% text.

The audit follows the [Web Interface Guidelines](https://github.com/vercel-labs/web-interface-guidelines). Physical iPhone Safari, VoiceOver, and other assistive technologies still require device-based validation. Chrome and WebKit engine checks cannot verify Safari’s browser chrome or safe-area behavior on hardware.

## Revised build-explainer structure

The former depth tabs interrupted reading and hid parts of the example. They are removed. All explanations are rendered in a single article, with seven navigable sections. The optional mathematical section has a forward link to the final challenge; nothing requires returning to an earlier control.

| Skill principle | Implementation |
| --- | --- |
| Concrete problem and achievable goal | The notebook receipt establishes quantity, target, guessed price, and the goal of tracing one learning update. |
| Intuition before formalism | The actual quadratic curve connects weight, slope, and loss before the worked arithmetic and derivative. Labels are outside the plot; arrows identify the exact start, first update, and minimum. |
| One continuous example | Quantity 2, receipt total 4, and initial price 1 remain the same through every explanation and the shared player. |
| Intermediate states and causal steps | Predict, measure, adjust, and check each show their inputs, operation, and result. |
| Predict before experimenting | The larger-step question precedes the playground and reveals a reasoned answer only after a choice. |
| Manipulable mechanism | The paused player exposes every update, learning-rate variants, a comparison curve, and the full trace. A new rate pauses and returns to the same initial state. |
| Optional technical depth | The exact rule and convergence boundary follow the experiment in the article, with notation, assumptions, and a forward skip link. No depth tabs or depth-dependent player state remain. |
| Transfer and recap | A three-notebook receipt changes the update. Three core takeaways and a clearly planned vectors/matrices topic show what carries forward. |
| Persistence and compatibility | Scrolling through explanation sections preserves the experiment. Old saved depth/section preferences migrate to the intuition section without losing bookmarks or the experiment. |
| Grounding and verification | Original visuals and prose, two linked teaching references, pure numerical checks, browser interaction/reflow tests, and light/dark accessibility scans. |


## Cross-state layout regression

The earlier playback checks started a fresh height baseline after each preset was selected. That missed a height change between the steady and overshooting scenarios. The updated checks retain the original baseline across every slider rate, all three presets and their 12 updates, reset, and comparison toggles. Opening the trace is allowed to expand the panel; closing it must restore the original bounds.

Numeric readouts fit their columns without wrapping or changing displayed precision. A small shared set of reserved text shapes covers the entire supported simulation range instead of being rebuilt per rate. Inline numbers use fixed-width glyphs, preventing a legend wrap difference between values such as 0.10 and 0.11. The reference-line key lives beside the comparison checkbox so enabling it does not add a new legend row.

WebKit testing also exposed Tab leaving the navigation dialog under its keyboard-focus defaults. Both modal dialogs now keep their Tab and Shift+Tab sequence inside the visible controls while retaining native Escape and explicitly returning focus to the opener. Clearing search restores focus to its input.
