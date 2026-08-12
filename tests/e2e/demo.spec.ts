import { expect, test } from "@playwright/test";

test("reset-to-report storyline is deterministic and reviewable", async ({
  page,
}) => {
  await page.goto("/overview");
  await page
    .getByRole("main")
    .getByRole("button", { name: "Reset demo" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Pacific Components Pte Ltd" }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("main")
      .getByRole("heading", { name: "100% evidence-aligned", exact: true })
      .first(),
  ).toBeVisible();

  await page.getByTestId("trigger-warehouse").first().click();
  await expect(
    page
      .getByText("New location may require protection review", {
        exact: true,
      })
      .first(),
  ).toBeVisible();
  await page.getByTestId("open-finding").first().click();

  await expect(
    page.getByText("Potential gap", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page
      .getByText(/could not find that address in the insurance schedule/i)
      .first(),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "SURVIVES" }).first(),
  ).toBeVisible();
  await expect(
    page.getByText(/not a coverage determination/i).first(),
  ).toBeVisible();

  await page.getByRole("tab", { name: "Insurance" }).first().click();
  await expect(
    page.getByText(/possible scheduled-location mismatch/i).first(),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Evidence" }).first().click();
  await expect(
    page
      .getByText(/source artifacts support this structured assessment/i)
      .first(),
  ).toBeVisible();

  await page.getByTestId("request-review").first().click();
  await expect(
    page.getByText("REVIEWING", { exact: true }).first(),
  ).toBeVisible();

  await page.goto("/changes");
  const cloudCard = page
    .locator("article")
    .filter({ hasText: "New cloud dependencies detected" });
  await cloudCard
    .getByRole("button", { name: /Apply change/ })
    .first()
    .click();
  await page.goto("/protection");
  await expect(
    page.getByText("Evidence incomplete", { exact: true }).first(),
  ).toBeVisible();

  await page.goto("/reports");
  const downloadPromise = page.waitForEvent("download");
  await page.getByTestId("download-report").first().click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(
    /PRODUCT_Protection_Alignment_assessment_v3\.pdf/,
  );

  await page.goto("/audit");
  await expect(
    page.getByRole("heading", { name: "Audit trail" }),
  ).toBeVisible();
  await expect(
    page.getByText("Profile v3", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByText("CHALLENGE PASS COMPLETED", { exact: true }).first(),
  ).toBeVisible();
});

test("canonical event endpoint validates input without persisting it", async ({
  request,
}) => {
  const response = await request.post("/api/events", {
    data: {
      organizationId: "org_pacific_components",
      eventType: "LOCATION_ADDED",
      observedAt: "2026-07-01T02:00:00.000Z",
      source: { type: "sandbox", name: "asset-system" },
      payload: { locationId: "loc_b", country: "SG" },
      evidenceReferences: ["ev_lease_b"],
    },
  });
  expect(response.status()).toBe(200);
  await expect(response.json()).resolves.toMatchObject({
    accepted: true,
    persisted: false,
    demoMode: true,
  });
});
