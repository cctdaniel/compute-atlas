import { expect, test, type Page } from "@playwright/test";

const lesson = "/ai-ml/gradient-descent";
const routes = ["/", lesson, "/saved", "/algorithms", "/systems", "/networks", "/databases", "/security", "/missing-page"];

async function ready(page: Page) {
  await page.locator('.topbar button[aria-label="Open navigation"]').waitFor();
  await page.waitForFunction(() => document.documentElement.dataset.preference);
}
async function reflow(page: Page) {
  const sizes = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, content: document.documentElement.scrollWidth }));
  expect(sizes.content, `Page overflow at ${page.url()}`).toBeLessThanOrEqual(sizes.viewport + 1);
}

for (const width of [320, 390, 768, 1440]) {
  for (const theme of ["light", "dark"] as const) {
    test(`${width}px ${theme}: every page reflows and renders one main heading`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme: theme });
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      for (const route of routes) {
        await page.goto(route);
        await expect(page.locator("main h1")).toHaveCount(1);
        await page.evaluate(() => document.fonts.ready);
        await reflow(page);
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      }
      expect(errors).toEqual([]);
    });
  }
}

test("200% text: pages, depth panels and navigation reflow at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  for (const route of routes) {
    await page.goto(route);
    await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
    await reflow(page);
  }
  await page.goto(lesson);
  await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
  for (const label of ["Intuition", "Step by step", "The math"]) {
    await page.getByRole("button", { name: label, exact: true }).click();
    await reflow(page);
    const clipped = await page.locator(".notebook-example, .notebook-data, .simulation-stats > div, .player-caption, .experiment-controls, .math-block").evaluateAll((elements) => elements.filter((e) => e.scrollWidth > e.clientWidth + 2).map((e) => e.className));
    expect(clipped).toEqual([]);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.getByRole("button", { name: "Open navigation" }).click();
  const menu = page.getByRole("dialog", { name: "Navigation", exact: true });
  const sizes = await menu.evaluate((element) => ({ content: element.scrollWidth, width: element.clientWidth }));
  expect(sizes.content).toBeLessThanOrEqual(sizes.width + 1);
  await page.screenshot({ path: "/tmp/compute-atlas-audit/text-200.png", fullPage: false });
});

test("menu: logo stays in place, opaque full-screen surface, Escape restores focus", async ({ page }) => {
  await page.goto("/");
  await ready(page);
  await page.evaluate(() => document.fonts.ready);
  const before = await page.locator(".mobile-brand .brand").boundingBox();
  await page.getByRole("button", { name: "Open navigation" }).click();
  const menu = page.getByRole("dialog", { name: "Navigation", exact: true });
  await expect(menu).toBeVisible();
  const after = await menu.locator(".brand").boundingBox();
  expect(after).toEqual(before);
  expect(await menu.boundingBox()).toEqual({ x: 0, y: 0, width: 390, height: 844 });
  expect(await menu.evaluate((element) => getComputedStyle(element, "::backdrop").backgroundColor)).toBe("rgb(250, 249, 246)");
  await page.screenshot({ path: "/tmp/compute-atlas-audit/menu-light.png" });
  await page.keyboard.press("Tab");
  expect(await menu.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Open navigation" })).toBeFocused();
  await page.evaluate(() => window.scrollTo(0, 500));
  expect((await page.locator(".topbar").boundingBox())!.y).toBeLessThan(0);
});

test("themes: explicit choices persist and System follows the OS", async ({ page }) => {
  await page.goto("/");
  await ready(page);
  await page.getByRole("button", { name: "Open navigation" }).click();
  const menu = page.getByRole("dialog", { name: "Navigation", exact: true });
  await menu.getByRole("button", { name: "Dark theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.screenshot({ path: "/tmp/compute-atlas-audit/menu-dark.png", animations: "disabled" });
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await menu.getByRole("button", { name: "System theme" }).click();
  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await menu.getByRole("button", { name: "Close navigation" }).click();
});

test("search: available and planned are distinct, empty state recovers, roadmap link works", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Search lessons" }).click();
  const search = page.getByRole("dialog", { name: "Search lessons", exact: true });
  await expect(search.getByRole("searchbox")).toBeFocused();
  await expect(search.getByRole("region", { name: "Available lessons", exact: true })).toBeVisible();
  await search.getByRole("searchbox").fill("no such concept");
  await expect(search.getByRole("heading", { name: "No matching concepts" })).toBeVisible();
  await search.getByRole("button", { name: "Clear search" }).click();
  await search.getByRole("searchbox").fill("attention");
  await search.getByRole("link", { name: /Queries, keys & attention/ }).click();
  await expect(page).toHaveURL(/#language-models$/);
  await expect(search).not.toBeVisible();
});

for (const depth of ["Intuition", "Step by step", "The math"]) {
  test(`player: ${depth} keeps its height through normal and divergent playback`, async ({ page }) => {
    await page.goto(lesson);
    await expect(page.getByRole("button", { name: "Play simulation" })).toBeVisible();
    await page.getByRole("button", { name: depth, exact: true }).click();
    const player = page.locator(".simulation");
    for (const preset of ["Steady · 0.10", "Overshoot · 0.60"]) {
      await page.getByRole("button", { name: preset, exact: true }).click();
      await page.getByRole("button", { name: "Reset simulation" }).click();
      const initial = await player.boundingBox();
      for (let i = 1; i <= 12; i++) {
        await page.getByRole("button", { name: "Forward one step" }).click();
        const current = await player.boundingBox();
        expect(current!.height).toBeCloseTo(initial!.height, 1);
        expect(current!.width).toBeCloseTo(initial!.width, 1);
      }
      await expect(page.getByRole("button", { name: "Forward one step" })).toBeDisabled();
    }
    await page.getByRole("button", { name: "Steady · 0.10", exact: true }).click();
    await page.getByRole("button", { name: "Reset simulation" }).click();
    const initial = await player.boundingBox();
    await page.clock.install();
    await page.getByRole("button", { name: "Play simulation", exact: true }).click();
    await expect(page.getByRole("button", { name: "Pause simulation" })).toBeVisible();
    await page.clock.runFor(13_000);
    await expect(page.getByRole("button", { name: "Replay simulation" })).toBeVisible();
    expect((await player.boundingBox())!.height).toBeCloseTo(initial!.height, 1);
    await page.getByRole("button", { name: "Back one step" }).click();
    await page.getByRole("button", { name: "Reset simulation" }).click();
    await expect(page.getByTestId("weight")).toHaveText("1.000");
  });
}

test("learning flow: experiment, depth and place persist; save, undo and quizzes work", async ({ page }) => {
  await page.goto(lesson);
  await page.getByRole("button", { name: "Save lesson", exact: true }).click();
  await page.getByRole("button", { name: "The math", exact: true }).click();
  await page.getByRole("button", { name: "Exact fit · 0.25", exact: true }).click();
  await page.getByRole("button", { name: "Forward one step" }).click();
  await expect(page.getByTestId("weight")).toHaveText("2.000");
  await page.reload();
  await expect(page.getByRole("button", { name: "The math", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("weight")).toHaveText("2.000");
  await expect(page.getByRole("slider", { name: "Learning rate α", exact: true })).toHaveValue("0.25");
  await page.locator("#predict").scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: "1.25", exact: true }).click();
  await expect(page.getByText("Let’s trace the update together.")).toBeVisible();
  await page.getByRole("button", { name: "2.00", exact: true }).click();
  await expect(page.getByText("Exactly. One step to the target.")).toBeVisible();
  await page.getByRole("button", { name: "Reveal the reasoning" }).click();
  await expect(page.locator(".transfer-answer")).toContainText("1.9");
  await page.getByRole("button", { name: "Mark as understood" }).click();
  await page.goto("/saved");
  await expect(page.locator(".saved-list")).toContainText("Completed");
  await page.getByRole("button", { name: "Remove How machines learn from saved lessons" }).click();
  await expect(page.getByRole("heading", { name: "No saved lessons yet." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Undo" })).toBeFocused();
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.locator(".saved-list")).toContainText("How machines learn");
});

test("screenshots: the primary reading surfaces in both themes", async ({ page }) => {
  for (const theme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: theme });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `/tmp/compute-atlas-audit/home-${theme}.png`, fullPage: true });
    await page.goto(lesson);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `/tmp/compute-atlas-audit/lesson-${theme}.png`, fullPage: true });
    await page.locator("#experiment").scrollIntoViewIfNeeded();
    await page.screenshot({ path: `/tmp/compute-atlas-audit/player-${theme}.png` });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await page.screenshot({ path: "/tmp/compute-atlas-audit/desktop-home.png", fullPage: true });
  await page.goto(lesson);
  await page.screenshot({ path: "/tmp/compute-atlas-audit/desktop-lesson.png", fullPage: true });
});

test("short phone: navigation scrolls to every control; keyboard search closes cleanly", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open navigation" }).click();
  const menu = page.getByRole("dialog", { name: "Navigation", exact: true });
  await menu.getByRole("button", { name: "Dark theme" }).click();
  await expect(menu.getByRole("button", { name: "Dark theme" })).toBeVisible();
  await menu.getByRole("link", { name: "Security Planned" }).click();
  await expect(page).toHaveURL(/\/security$/);
  await page.keyboard.press("ControlOrMeta+k");
  const search = page.getByRole("dialog", { name: "Search lessons", exact: true });
  await expect(search).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(search).not.toBeVisible();
});

test("resume: continue returns to the saved section and contents links close on selection", async ({ page }) => {
  await page.goto(lesson);
  await page.getByRole("button", { name: "Play simulation" }).waitFor();
  await page.locator("#predict").scrollIntoViewIfNeeded();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("compute-atlas-progress-v1") || "{}").lastSection)).toBe("predict");
  await page.goto("/");
  await page.getByRole("link", { name: "Continue your lesson", exact: true }).click();
  await expect(page).toHaveURL(/#predict$/);
  await page.locator(".reader-contents summary").click();
  await page.locator(".reader-contents").getByRole("link", { name: /The question/ }).click();
  await expect(page.locator(".reader-contents")).not.toHaveAttribute("open", "");
});
