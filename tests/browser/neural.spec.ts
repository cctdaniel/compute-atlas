import { expect, test } from "@playwright/test";

test("backpropagation keeps parameters unchanged until a separate optimizer action", async ({
  page,
}) => {
  await page.goto("/ai-ml/l16");
  const next = page.getByRole("button", { name: "Next step", exact: true });
  for (let i = 0; i < 6; i++) await next.click();
  await expect(page.locator(".concept-frame-step:visible")).toContainText(
    "Step 06",
  );
  await expect(next).toContainText("Update");
  const values = () =>
    page
      .locator(
        ".concept-metrics:visible > div > strong > .stable-copy > .stable-current",
      )
      .allTextContents();
  expect((await values()).map((v) => v.trim())).toEqual(["1", "0", "2"]);
  await next.click();
  await expect(page.locator(".concept-metrics:visible")).toContainText(
    "Cached loss",
  );
  expect((await values()).map((v) => v.trim())).toEqual([
    "1.4000",
    "0.2000",
    "2",
  ]);
  await next.click();
  await expect(page.locator(".concept-frame-step:visible")).toContainText(
    "Step 08",
  );
  await expect(page.locator("[data-current-scene]:visible")).toContainText(
    "New forward pass",
  );
  expect((await values()).map((v) => v.trim())).toEqual([
    "1.4000",
    "0.2000",
    "0.5000",
  ]);
  await page.getByRole("combobox").selectOption("inference");
  await expect(page.locator("[data-current-scene]:visible")).toContainText(
    "No backward pass",
  );
  await expect(page.locator(".concept-frame-step:visible")).toContainText(
    "Step 00",
  );
});
