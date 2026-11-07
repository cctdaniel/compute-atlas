import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const theme of ["light", "dark"] as const) {
  test(`${theme}: semantic and contrast audit across page and modal states`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme });
    for (const route of ["/", "/ai-ml/gradient-descent", "/saved", "/databases", "/missing-page"]) {
      await page.goto(route);
      await page.evaluate(() => document.fonts.ready);
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
      expect(results.violations, `${route}: ${JSON.stringify(results.violations.map((v) => ({ rule: v.id, nodes: v.nodes.map((n) => ({ target: n.target, why: n.failureSummary })) })))}`).toEqual([]);
    }
    await page.goto("/");
    await page.getByRole("button", { name: "Open navigation" }).click();
    expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Search lessons" }).click();
    expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  });
}
