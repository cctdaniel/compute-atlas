import { expect, test, type Page } from "@playwright/test";

const screenshotRoot = `/tmp/compute-atlas-audit/${process.env.PLAYWRIGHT_BROWSER || "chrome"}`;
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

test("200% text: the full lesson and navigation reflow at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  for (const route of routes) {
    await page.goto(route);
    await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
    await reflow(page);
  }
  await page.goto(lesson);
  await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
  await reflow(page);
  const clipped = await page.locator(".notebook-example, .notebook-data, .simulation-stats > div, .player-caption, .experiment-controls, .math-block, .landscape-labels").evaluateAll((elements) => elements.filter((e) => e.scrollWidth > e.clientWidth + 2).map((e) => e.className));
  expect(clipped).toEqual([]);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.getByRole("button", { name: "Open navigation" }).click();
  const menu = page.getByRole("dialog", { name: "Navigation", exact: true });
  const sizes = await menu.evaluate((element) => ({ content: element.scrollWidth, width: element.clientWidth }));
  expect(sizes.content).toBeLessThanOrEqual(sizes.width + 1);
  await page.screenshot({ path: `${screenshotRoot}/text-200.png`, fullPage: false });
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
  await page.screenshot({ path: `${screenshotRoot}/menu-light.png` });
  const focusableCount = await menu.locator("a[href], button").count();
  for (let index = 0; index <= focusableCount; index++) {
    await page.keyboard.press("Tab");
    expect(await menu.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press("Shift+Tab");
  expect(await menu.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Open navigation" })).toBeFocused();
  await page.evaluate(() => window.scrollTo(0, 500));
  await expect.poll(async () => (await page.locator(".topbar").boundingBox())!.y).toBeLessThan(0);
});

test("themes: explicit choices persist and System follows the OS", async ({ page }) => {
  await page.goto("/");
  await ready(page);
  await page.getByRole("button", { name: "Open navigation" }).click();
  const menu = page.getByRole("dialog", { name: "Navigation", exact: true });
  await menu.getByRole("button", { name: "Dark theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.screenshot({ path: `${screenshotRoot}/menu-dark.png`, animations: "disabled" });
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

test("search: all lessons are searchable, empty state recovers, lesson link works", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Search lessons" }).click();
  const search = page.getByRole("dialog", { name: "Search lessons", exact: true });
  await expect(search.getByRole("searchbox")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(search.getByRole("button", { name: "Close search" })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(search.getByRole("searchbox")).toBeFocused();
  await expect(search.getByRole("region", { name: "Available lessons", exact: true })).toBeVisible();
  await search.getByRole("searchbox").fill("no such concept");
  await expect(search.getByRole("heading", { name: "No matching concepts" })).toBeVisible();
  await search.getByRole("button", { name: "Clear search" }).click();
  await expect(search.getByRole("searchbox")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Search lessons", exact: true })).toBeFocused();
  await page.getByRole("button", { name: "Search lessons", exact: true }).click();
  await search.getByRole("searchbox").fill("attention");
  await search.getByRole("link", { name: /Queries, keys & attention/ }).click();
  await expect(page).toHaveURL(/ai-ml\/attention$/);
  await expect(search).not.toBeVisible();
});

test("player: keeps its height through normal and divergent playback", async ({ page }) => {
  await page.goto(lesson);
  await expect(page.getByRole("button", { name: "Play simulation" })).toBeVisible();
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

test("learning flow: experiment and place persist; save, undo and quizzes work", async ({ page }) => {
  await page.goto(lesson);
  await page.getByRole("button", { name: "Save lesson", exact: true }).click();
  await page.getByRole("button", { name: "Exact fit · 0.25", exact: true }).click();
  await page.getByRole("button", { name: "Forward one step" }).click();
  await expect(page.getByTestId("weight")).toHaveText("2.000");
  await page.reload();
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
    await page.screenshot({ path: `${screenshotRoot}/home-${theme}.png`, fullPage: true });
    await page.goto(lesson);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `${screenshotRoot}/lesson-${theme}.png`, fullPage: true });
    await page.locator("#experiment").scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${screenshotRoot}/player-${theme}.png` });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  await page.screenshot({ path: `${screenshotRoot}/desktop-home.png`, fullPage: true });
  await page.goto(lesson);
  await page.screenshot({ path: `${screenshotRoot}/desktop-lesson.png`, fullPage: true });
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


test("continuous lesson: explanations remain in order with no depth controls", async ({ page }) => {
  await page.goto(lesson);
  await expect(page.getByRole("group", { name: "Explanation depth" })).toHaveCount(0);
  const sections = page.locator(".lesson-body > section.lesson-section");
  expect(await sections.evaluateAll((elements) => elements.map((e) => e.id))).toEqual(["the-problem", "intuition", "worked-update", "predict", "experiment", "the-math", "transfer"]);
  for (const id of ["intuition", "worked-update", "the-math"]) {
    await expect(page.locator(`#${id}`)).toBeVisible();
    await expect(page.locator(`#${id} h2`)).toHaveCount(1);
  }
  await page.getByRole("button", { name: "Forward one step" }).click();
  await page.locator("#the-math").scrollIntoViewIfNeeded();
  await page.getByRole("link", { name: "continue to the final challenge" }).click();
  await expect(page).toHaveURL(/#transfer$/);
  await expect(page.getByTestId("weight")).toHaveText("1.400");
  await page.getByRole("button", { name: "Overshoot · 0.60", exact: true }).click();
  await expect(page.getByTestId("weight")).toHaveText("1.000");
});

test("old reading preferences migrate to the continuous lesson", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("compute-atlas-progress-v1", JSON.stringify({ lastDepth: "technical", lastSection: "choose-your-depth", lastStep: 2, lastRate: 0.1, visited: true, saved: ["gradient-descent"], completed: [] })));
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Continue your lesson", exact: true })).toHaveAttribute("href", `${lesson}#intuition`);
  await page.getByRole("link", { name: "Continue your lesson", exact: true }).click();
  await expect(page.getByTestId("weight")).toHaveText("1.640");
  await expect(page.getByRole("button", { name: "Saved", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#worked-update")).toBeVisible();
});

for (const width of [320, 390, 768]) {
  test(`loss curve: ${width}px labels sit above the plot and arrows target exact points`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(lesson);
    await page.evaluate(() => document.fonts.ready);
    const diagram = page.locator(".loss-landscape-diagram");
    await diagram.scrollIntoViewIfNeeded();
    const chart = await diagram.locator("svg.atlas-art").boundingBox();
    for (const point of ["start", "update", "best"]) {
      const label = await diagram.locator(`[data-landscape-label="${point}"]`).boundingBox();
      expect(label!.y + label!.height).toBeLessThanOrEqual(chart!.y);
      const accuracy = await diagram.locator(`path.landscape-leader[data-point="${point}"]`).evaluate((element) => {
        const path = element as SVGPathElement;
        const end = path.getPointAtLength(path.getTotalLength());
        const point = path.parentElement!.querySelector("circle")!;
        return Math.hypot(end.x - Number(point.getAttribute("cx")), end.y - Number(point.getAttribute("cy")));
      });
      expect(accuracy).toBeLessThan(0.01);
    }
    await page.screenshot({ path: `${screenshotRoot}/curve-${width}.png` });
  });
}


for (const width of [320, 390, 768]) {
  test(`rate presets: ${width}px labels stay inside their borders at normal and enlarged text`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(lesson);
    await page.getByRole("button", { name: "Play simulation" }).waitFor();
    for (const theme of ["light", "dark"] as const) {
      await page.emulateMedia({ colorScheme: theme });
      for (const textSize of ["100%", "200%"]) {
        await page.evaluate((size) => { document.documentElement.style.fontSize = size; }, textSize);
        const presets = page.getByRole("group", { name: "Learning rate presets" });
        await presets.scrollIntoViewIfNeeded();
        for (const name of ["Steady · 0.10", "Exact fit · 0.25", "Overshoot · 0.60"]) {
          const button = presets.getByRole("button", { name, exact: true });
          const overflow = await button.evaluate((element) => {
            const border = element.getBoundingClientRect();
            return [...element.children].some((child) => {
              const text = child.getBoundingClientRect();
              return text.left < border.left || text.right > border.right || text.top < border.top || text.bottom > border.bottom || child.scrollWidth > child.clientWidth + 1;
            });
          });
          expect(overflow, `${name} at ${width}px / ${textSize} / ${theme}`).toBe(false);
          await button.click();
          await expect(button).toHaveAttribute("aria-pressed", "true");
          await expect(page.getByTestId("weight")).toHaveText("1.000");
        }
        await reflow(page);
        await presets.scrollIntoViewIfNeeded();
        await page.screenshot({ path: `${screenshotRoot}/presets-${width}-${textSize}-${theme}.png` });
      }
    }
  });
}

for (const width of [320, 390, 768]) {
  for (const textSize of ["100%", "200%"]) {
    test(`player geometry: ${width}px / ${textSize} stays fixed across every rate and control state`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(lesson);
      await page.getByRole("button", { name: "Play simulation" }).waitFor();
      await page.evaluate((size) => { document.documentElement.style.fontSize = size; }, textSize);
      await page.evaluate(() => document.fonts.ready);
      const geometry = () => page.locator(".simulation").evaluate((player) => {
        const panel = player.getBoundingClientRect();
        return [".simulation-stats", ".simulation-stats strong", ".player-caption", ".player-controls", ".experiment-controls", ".trace-details"].flatMap((selector) => [...player.querySelectorAll(selector)].flatMap((element) => {
          const box = element.getBoundingClientRect();
          return [box.y - panel.y, box.width, box.height];
        })).concat(panel.height).map((number) => Math.round(number * 10) / 10);
      });
      const initial = await geometry();
      const slider = page.getByRole("slider", { name: "Learning rate α", exact: true });
      await slider.focus();
      await page.keyboard.press("Home");
      for (let index = 0; index < 59; index++) {
        if (index) await page.keyboard.press("ArrowRight");
        await expect(slider).toHaveValue(String((index + 2) / 100));
        expect(await geometry(), `Rate ${(index + 2) / 100}`).toEqual(initial);
      }
      for (const preset of ["Overshoot · 0.60", "Exact fit · 0.25", "Steady · 0.10"]) {
        await page.getByRole("button", { name: preset, exact: true }).click();
        expect(await geometry(), `${preset} before stepping`).toEqual(initial);
        for (let step = 1; step <= 12; step++) {
          await page.getByRole("button", { name: "Forward one step" }).click();
          expect(await geometry(), `${preset} / step ${step}`).toEqual(initial);
          const wrapped = await page.locator(".simulation-stats strong").evaluateAll((elements) => elements.some((element) => element.scrollWidth > element.clientWidth + 1));
          expect(wrapped).toBe(false);
        }
        await page.getByRole("button", { name: "Reset simulation" }).click();
        expect(await geometry()).toEqual(initial);
      }
      const compare = page.getByRole("checkbox", { name: "Compare with a steady learning rate (0.10)", exact: true });
      await compare.check();
      expect(await geometry()).toEqual(initial);
      await compare.uncheck();
      expect(await geometry()).toEqual(initial);
      await page.locator(".trace-details summary").click();
      await expect(page.getByRole("region", { name: "Training trace" })).toBeVisible();
      await reflow(page);
      await page.locator(".trace-details summary").click();
      expect(await geometry()).toEqual(initial);
      await page.locator(".simulation-stats").scrollIntoViewIfNeeded();
      await page.screenshot({ path: `${screenshotRoot}/stable-stats-${width}-${textSize}.png` });
    });
  }
}
