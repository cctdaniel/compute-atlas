import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { experiments } from "../../lib/lessons/models";
import { contentBySlug } from "../../lib/lessons/content";

const root = `/tmp/compute-atlas-audit/${process.env.PLAYWRIGHT_BROWSER || "chrome"}/curriculum`;
const slugs = Object.keys(experiments);
async function noOverflow(page: Page, context: string) {
  const result = await page.evaluate(() => ({ width: document.documentElement.clientWidth, content: document.documentElement.scrollWidth, clipped: [...document.querySelectorAll<HTMLElement>('.concept-player select, .concept-metrics > div, .concept-frame, [data-current-scene], .concept-playback button, .concept-rules dd, .takeaway, .concept-worked > li')].filter((el) => el.scrollWidth > el.clientWidth + 2).map((el) => ({ className: el.className, content: el.scrollWidth, width: el.clientWidth })) }));
  expect(result.content, context).toBeLessThanOrEqual(result.width + 1);
  expect(result.clipped, context).toEqual([]);
}
async function geometry(page: Page) {
  return page.locator('.concept-player').evaluate((player) => {
    const panel = player.getBoundingClientRect();
    return ['.concept-stage', '.concept-metrics', '.concept-frame', '.concept-playback', '.concept-trace'].flatMap((selector) => {
      const box = player.querySelector(selector)!.getBoundingClientRect();
      return [box.y - panel.y, box.width, box.height];
    }).concat(panel.height).map((n) => Math.round(n * 10) / 10);
  });
}
for (const slug of slugs) {
  test(`${slug}: every scenario and step keeps its geometry, including 200% text`, async ({ page }) => {
    test.setTimeout(180_000);
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`/ai-ml/${slug}`);
    await page.locator('.concept-player').waitFor();
    await page.evaluate(() => document.fonts.ready);
    for (const [width, size, theme] of [[320, '100%', 'light'], [390, '100%', 'dark'], [320, '200%', 'light'], [768, '100%', 'light'], [1440, '100%', 'dark']] as const) {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme: theme });
      await page.evaluate((value) => { document.documentElement.style.fontSize = value; }, size);
      const initial = await geometry(page);
      for (const scenario of experiments[slug].scenarios) {
        await page.getByRole('combobox', { name: 'Compare a scenario' }).selectOption(scenario.id);
        const count = experiments[slug].build(scenario.id).length;
        for (let step = 0; step < count; step++) {
          if (step) await page.getByRole('button', { name: 'Next step', exact: true }).click();
          await expect(page.locator('.concept-frame-step:visible')).toContainText(`Step ${String(step).padStart(2, '0')}`);
          expect(await geometry(page), `${slug}/${scenario.id}/${step} at ${width}/${size}`).toEqual(initial);
          await noOverflow(page, `${slug}/${scenario.id}/${step} at ${width}/${size}`);
        }
        await expect(page.getByRole('button', { name: 'Next step', exact: true })).toBeDisabled();
      }
      if (width === 390) await page.locator('.concept-player').screenshot({ path: `${root}/${slug}-dark.png`, animations: 'disabled' });
    }
    expect(errors).toEqual([]);
  });
  test(`${slug}: quiz, transfer, headings and accessible contrast in both themes`, async ({ page }) => {
    test.setTimeout(90_000);
    const content = contentBySlug[slug];
    await page.goto(`/ai-ml/${slug}`);
    await page.locator('.concept-player').waitFor();
    await expect(page.locator('main h1')).toHaveCount(1);
    await expect(page.getByRole('tab')).toHaveCount(0);
    await expect(page.locator('.lesson-body > section.lesson-section')).toHaveCount(7);
    await page.getByRole('button', { name: content.prediction.options[content.prediction.correct], exact: true }).click();
    await expect(page.locator('.quiz-answer')).toContainText('Exactly.');
    await page.getByRole('button', { name: 'Reveal the explanation', exact: true }).click();
    await expect(page.locator('.transfer-answer')).toContainText(content.transfer.answer[0].replaceAll('**', ''));
    for (const theme of ['light', 'dark'] as const) {
      await page.emulateMedia({ colorScheme: theme });
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      expect(results.violations.map((v) => ({ rule: v.id, targets: v.nodes.map((n) => n.target) })), `${slug}/${theme}`).toEqual([]);
    }
  });
}

test('cross-lesson progress, resume, saved list, next/previous and completion filters', async ({ page }) => {
  await page.goto('/ai-ml/attention');
  await page.getByRole('button', { name: 'Save lesson', exact: true }).click();
  await page.getByRole('combobox').selectOption('causal');
  await page.getByRole('button', { name: 'Next step', exact: true }).click();
  await page.getByRole('button', { name: 'Next step', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('combobox')).toHaveValue('causal');
  await expect(page.locator('.concept-frame-step:visible')).toContainText('Step 02');
  await page.goto('/');
  await expect(page.locator('.hero-actions a').first()).toHaveAttribute('href', /attention#/);
  await expect(page.locator('.featured-link')).toHaveAttribute('href', /gradient-descent/);
  await page.goto('/ai-ml/tokenization');
  await expect(page.locator('.concept-frame-step:visible')).toContainText('Step 00');
  await page.getByRole('button', { name: 'Mark as understood', exact: true }).click();
  await page.getByRole('link', { name: /NEXT LESSON Queries, keys & attention/ }).click();
  await expect(page.locator('.concept-frame-step:visible')).toContainText('Step 02');
  await page.getByRole('button', { name: 'Mark as understood', exact: true }).click();
  await page.goto('/saved');
  await expect(page.locator('.saved-list')).toContainText('Queries, keys & attention');
  await expect(page.locator('.saved-list')).toContainText('Completed');
  await page.goto('/');
  await page.getByRole('button', { name: /To learn/ }).click();
  await expect(page.locator('.chapter-lessons a')).toHaveCount(14);
  await expect(page.locator('.path-note').first()).toContainText('2 of 16 understood');
});

test('play, pause, back, replay, reset and trace are consistent with keyboard and reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/ai-ml/attention');
  await page.locator('.concept-player').waitFor();
  await page.clock.install();
  const initial = await geometry(page);
  await page.getByRole('button', { name: 'Play experiment', exact: true }).click();
  await page.clock.runFor(2601);
  await expect(page.locator('.concept-frame-step:visible')).toContainText('Step 01');
  await page.getByRole('button', { name: 'Pause experiment', exact: true }).click();
  await page.clock.runFor(10_000);
  await expect(page.locator('.concept-frame-step:visible')).toContainText('Step 01');
  await page.getByRole('button', { name: 'Previous step', exact: true }).click();
  await expect(page.locator('.concept-frame-step:visible')).toContainText('Step 00');
  await page.getByRole('button', { name: 'Play experiment', exact: true }).click();
  for (let step = 1; step <= 7; step++) {
    await page.clock.runFor(2601);
    await expect(page.locator('.concept-frame-step:visible')).toContainText(`Step ${String(step).padStart(2, '0')}`);
  }
  await expect(page.getByRole('button', { name: 'Replay experiment', exact: true })).toBeVisible();
  expect(await geometry(page)).toEqual(initial);
  await page.getByRole('button', { name: 'Replay experiment', exact: true }).click();
  await expect(page.locator('.concept-frame-step:visible')).toContainText('Step 00');
  await page.getByRole('combobox').selectOption('causal');
  await expect(page.getByRole('button', { name: 'Play experiment', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Reset experiment', exact: true }).click();
  await expect(page.getByRole('combobox')).toHaveValue('first');
  await page.locator('.concept-trace summary').click();
  const target = page.getByRole('button', { name: 'Go to step 4: Normalize allowed scores', exact: true });
  await target.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.concept-frame-step:visible')).toContainText('Step 04');
});

test('vector annotations stay separate from candidate points on small phones', async ({ page }) => {
  await page.goto('/ai-ml/embeddings');
  await page.locator('.concept-player').waitFor();
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    for (const scenario of experiments.embeddings.scenarios) {
      await page.getByRole('combobox').selectOption(scenario.id);
      const overlaps = await page.locator('[data-current-scene] .scene-vectors svg').evaluate((svg) => {
        const points = [...svg.querySelectorAll('[data-candidate-point]')].map((p) => p.getBoundingClientRect());
        const labels = [...svg.querySelectorAll('[data-candidate-label]')].map((p) => p.getBoundingClientRect());
        const intersects = (a: DOMRect, b: DOMRect) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
        return labels.some((label, i) => points.some((point) => intersects(label, point)) || labels.some((other, j) => i !== j && intersects(label, other)));
      });
      expect(overlaps).toBe(false);
    }
  }
});
