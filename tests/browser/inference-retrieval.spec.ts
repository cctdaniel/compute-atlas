import { expect, test } from "@playwright/test";
test("inference: cached output agrees with recomputation and a window changes its retained state", async ({
  page,
}) => {
  await page.goto("/ai-ml/l35");
  const next = page.getByRole("button", { name: "Next step", exact: true }),
    scene = page.locator("[data-current-scene]:visible");
  while (await next.isEnabled()) await next.click();
  const cached = await scene
    .locator(".training-readouts dd")
    .nth(2)
    .innerText();
  await page.getByRole("combobox").selectOption("recompute");
  while (await next.isEnabled()) await next.click();
  await expect(scene.locator(".training-readouts dd").nth(2)).toHaveText(
    cached,
  );
  await page.getByRole("combobox").selectOption("window");
  while (await next.isEnabled()) await next.click();
  expect(
    await scene.locator(".training-readouts dd").nth(2).innerText(),
  ).not.toEqual(cached);
  await expect(scene.locator(".cache-slots")).toContainText("Evicted");
});
test("inference: numeric-format details and integer quantizer remain readable at 200% text", async ({
  page,
}) => {
  await page.goto("/ai-ml/l36");
  await page.setViewportSize({ width: 320, height: 844 });
  await page.evaluate(() => (document.documentElement.style.fontSize = "200%"));
  await page.getByRole("combobox").selectOption("int4");
  const scene = page.locator("[data-current-scene]:visible");
  await scene.locator("summary").click();
  await expect(scene.locator(".format-list")).toContainText("BF16");
  await expect(scene.locator(".quantized-values li")).toHaveCount(4);
  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth + 1,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Next step", exact: true }).click();
  await expect(scene.locator("details")).toHaveAttribute("open", "");
});
test("inference: corrected speculative output mass differs from blindly accepted draft mass", async ({
  page,
}) => {
  await page.goto("/ai-ml/l37");
  const next = page.getByRole("button", { name: "Next step", exact: true }),
    scene = page.locator("[data-current-scene]:visible");
  await page.getByRole("combobox").selectOption("speculate");
  while (await next.isEnabled()) await next.click();
  await expect(
    scene.locator(".spec-distributions li").first().locator("dd").last(),
  ).toHaveText("60.0%");
  await expect(
    scene.locator(".spec-distributions li").last().locator("dd").last(),
  ).toHaveText("40.0%");
  await page.getByRole("combobox").selectOption("naive");
  while (await next.isEnabled()) await next.click();
  await expect(
    scene.locator(".spec-distributions li").last().locator("dd").last(),
  ).toHaveText("80.0%");
});
test("retrieval: joint reranking changes shortlist order and corpus details preserve exact product codes", async ({
  page,
}) => {
  await page.goto("/ai-ml/l39");
  const next = page.getByRole("button", { name: "Next step", exact: true }),
    scene = page.locator("[data-current-scene]:visible");
  await page.getByRole("combobox").selectOption("paraphrase-hybrid");
  while (await next.isEnabled()) await next.click();
  await expect(scene.locator(".ranked-documents li").first()).toContainText(
    "D4",
  );
  await page.getByRole("combobox").selectOption("rerank");
  while (await next.isEnabled()) await next.click();
  await expect(scene.locator(".ranked-documents li").first()).toContainText(
    "D3",
  );
  await scene.locator("summary").click();
  await expect(scene.locator(".retrieval-corpus li")).toHaveCount(8);
  await expect(scene.locator(".retrieval-corpus li").first()).toContainText(
    "ZX-17",
  );
});
test("retrieval: missing RAG evidence leads to insufficiency and unsupported shipping stays marked", async ({
  page,
}) => {
  await page.goto("/ai-ml/l40");
  const next = page.getByRole("button", { name: "Next step", exact: true }),
    scene = page.locator("[data-current-scene]:visible");
  await page.getByRole("combobox").selectOption("missing");
  while (await next.isEnabled()) await next.click();
  await expect(scene.locator(".grounded-answer")).toContainText(
    "Insufficient retrieved evidence",
  );
  await page.getByRole("combobox").selectOption("unsupported");
  while (await next.isEnabled()) await next.click();
  await expect(scene.locator(".grounded-answer")).toContainText(
    "[unsupported]",
  );
  await expect(scene.locator(".claim-support li").last()).toContainText(
    "Unsupported",
  );
});
