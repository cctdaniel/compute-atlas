import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("full course: core/applied tracks, search, publication gates and linked roadmap modules work on a phone", async ({
  page,
}) => {
  await page.goto("/");
  const course = page.locator("#full-curriculum");
  await expect(course).toContainText("14 of 190 reference lessons available");
  await expect(course.locator("details:visible")).toHaveCount(14);
  await course
    .getByRole("button", { name: "Applied · 100", exact: true })
    .click();
  await expect(course.locator("details:visible")).toHaveCount(10);
  await expect(course.locator("details:visible a")).toHaveCount(0);
  await course.getByRole("searchbox").fill("L03");
  await expect(course.getByRole("status")).toContainText("1 matching lessons");
  await course.getByRole("link", { name: /L03 Scalars, vectors/ }).click();
  await expect(page).toHaveURL(/\/ai-ml\/l03$/);
  await page.getByRole("combobox").selectOption("narrow");
  await page.getByRole("button", { name: "Next step", exact: true }).click();
  await page.reload();
  await expect(page.getByRole("combobox")).toHaveValue("narrow");
  await expect(page.locator(".concept-frame-step:visible")).toContainText(
    "Step 01",
  );
  await page.goto("/");
  await expect(page.locator(".hero-actions a").first()).toHaveAttribute(
    "href",
    /l03#/,
  );
  await page
    .getByRole("button", { name: "Search lessons", exact: true })
    .click();
  const search = page.getByRole("dialog", {
    name: "Search lessons",
    exact: true,
  });
  await search.getByRole("searchbox").fill("L90");
  await search.getByRole("link").click();
  await expect(page).toHaveURL(/#course-specialized$/);
  await expect(page.locator("#course-specialized")).toBeVisible();
  await expect(page.locator("#course-specialized")).toHaveAttribute("open", "");
  await expect(page.locator("#course-specialized summary")).toBeInViewport();
  await page.goto("/#course-applied-1");
  await expect(
    page.getByRole("button", { name: "Applied · 100", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".course-modules details:visible")).toHaveCount(10);
  await page.getByRole("button", { name: "Core · 90", exact: true }).click();
  await expect(page.locator(".course-modules details:visible")).toHaveCount(14);
  await page.goto("/ai-ml/l14");
  await expect(
    page.getByRole("link", { name: /IN DEVELOPMENT/ }),
  ).toHaveAttribute("href", "/#course-neural");
  await page.goto("/ai-ml/l15");
  await expect(
    page.getByRole("heading", { name: "Page not found.", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".concept-player")).toHaveCount(0);
});

test("full course: enlarged reading and both themes reflow without horizontal clipping", async ({
  page,
}) => {
  await page.goto("/");
  for (const theme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: theme });
    for (const size of ["100%", "200%"]) {
      await page.setViewportSize({ width: 320, height: 844 });
      await page.evaluate((value) => {
        document.documentElement.style.fontSize = value;
      }, size);
      await page.locator("#course-foundations summary").click();
      const dimensions = await page.evaluate(() => ({
        width: document.documentElement.clientWidth,
        content: document.documentElement.scrollWidth,
      }));
      expect(dimensions.content).toBeLessThanOrEqual(dimensions.width + 1);
    }
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      result.violations.map((item) => ({
        rule: item.id,
        targets: item.nodes.map((node) => node.target),
      })),
    ).toEqual([]);
  }
});

test("full course: finishing the starter path continues into the canonical course", async ({ page }) => {
  const { allLessons } = await import("../../lib/curriculum");
  await page.addInitScript((slugs) => localStorage.setItem("compute-atlas-progress-v1", JSON.stringify({ completed: slugs })), allLessons.filter((lesson) => !lesson.sourceId).map((lesson) => lesson.slug));
  await page.goto("/");
  await expect(page.locator(".hero-actions a").first()).toHaveAttribute("href", "/ai-ml/l01");
});
