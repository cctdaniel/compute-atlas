import { expect, test } from "@playwright/test";
test("adaptation: JSON shape and receipt fact checks remain independent", async ({
  page,
}) => {
  await page.goto("/ai-ml/l26");
  const scene = page.locator("[data-current-scene]:visible"),
    next = page.getByRole("button", { name: "Next step", exact: true });
  await page.getByRole("combobox").selectOption("false");
  for (let i = 0; i < 3; i++) await next.click();
  await expect(scene.locator(".contract-checks li").nth(0)).toContainText(
    "Pass",
  );
  await expect(scene.locator(".contract-checks li").nth(1)).toContainText(
    "Pass",
  );
  await expect(scene.locator(".contract-checks li").nth(2)).toContainText(
    "Fail",
  );
  await page.getByRole("combobox").selectOption("quoted");
  for (let i = 0; i < 3; i++) await next.click();
  await expect(scene.locator(".contract-checks li").nth(2)).toContainText(
    "Pass",
  );
});
test("adaptation: fitting context does not restore a lost identifier", async ({
  page,
}) => {
  await page.goto("/ai-ml/l27");
  const scene = page.locator("[data-current-scene]:visible"),
    next = page.getByRole("button", { name: "Next step", exact: true });
  await page.getByRole("combobox").selectOption("summary");
  while (await next.isEnabled()) await next.click();
  await expect(scene.locator(".context-facts li strong")).toHaveText([
    "Available",
    "Available",
    "Available",
  ]);
  await page.getByRole("combobox").selectOption("lost-detail");
  while (await next.isEnabled()) await next.click();
  await expect(scene.locator(".context-facts li strong")).toHaveText([
    "Available",
    "Missing",
    "Available",
  ]);
});
test("adaptation: beam preserves B1 and an exact verifier rejects correlated wrong candidates", async ({
  page,
}) => {
  await page.goto("/ai-ml/l28");
  let next = page.getByRole("button", { name: "Next step", exact: true });
  await page.getByRole("combobox").selectOption("beam");
  while (await next.isEnabled()) await next.click();
  await expect(
    page.locator("[data-current-scene]:visible .beam-branches li").first(),
  ).toContainText("B1");
  await expect(
    page.locator("[data-current-scene]:visible .beam-branches li").first(),
  ).toContainText("0.3960");
  await page.goto("/ai-ml/l29");
  next = page.getByRole("button", { name: "Next step", exact: true });
  await page.getByRole("combobox").selectOption("correlated");
  while (await next.isEnabled()) await next.click();
  await expect(
    page.locator("[data-current-scene]:visible .training-readouts dd").last(),
  ).toHaveText("None");
  await expect(
    page.locator("[data-current-scene]:visible .training-readouts dd").first(),
  ).toHaveText("10 / 10");
});
test("adaptation: adapter Update recomputes values while the base matrix stays fixed", async ({
  page,
}) => {
  await page.goto("/ai-ml/l33");
  const scene = page.locator("[data-current-scene]:visible"),
    next = page.getByRole("button", { name: "Next step", exact: true });
  const base = await scene.locator(".adapter-matrix").first().innerText();
  const a = await scene.locator(".adapter-matrix").nth(1).innerText();
  for (let i = 0; i < 4; i++) await next.click();
  expect(await scene.locator(".adapter-matrix").first().innerText()).toEqual(
    base,
  );
  expect(await scene.locator(".adapter-matrix").nth(1).innerText()).not.toEqual(
    a,
  );
  await expect(scene).toContainText("recomputed after one simultaneous update");
});
