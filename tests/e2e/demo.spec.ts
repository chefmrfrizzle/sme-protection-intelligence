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

  if ((page.viewportSize()?.width ?? 0) > 820) {
    await expect(
      page.getByRole("link", { name: "Protection", exact: true }),
    ).toHaveAttribute("aria-current", "page");
  }

  await expect(
    page.getByText("Potential gap", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page
      .getByText(/could not find that address in the insurance schedule/i)
      .first(),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "The item still needs review" }).first(),
  ).toBeVisible();
  await expect(
    page.getByText(/not a coverage determination/i).first(),
  ).toBeVisible();

  await page.getByRole("tab", { name: "Insurance" }).first().click();
  await expect(
    page.getByRole("heading", { name: "SURVIVES" }).first(),
  ).toBeVisible();
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
  await page.getByRole("link", { name: "Open review case" }).click();
  await expect(
    page.getByRole("heading", { name: "Protection Review Case" }),
  ).toBeVisible();
  await expect(page.getByText(/Mock adapter · Not connected/i)).toBeVisible();
  await expect(
    page.getByText("READY FOR PROFESSIONAL REVIEW", { exact: true }),
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

test("scenario selections are reversible and explanation view persists", async ({
  page,
}) => {
  await page.goto("/simulator");
  await page
    .getByRole("main")
    .getByRole("button", { name: "Reset", exact: true })
    .click();

  const addWarehouse = page.getByRole("button", {
    name: /Add New warehouse detected to scenario/i,
  });
  await addWarehouse.click();
  await expect(
    page.getByRole("button", {
      name: /Remove New warehouse detected from scenario/i,
    }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByText("Current v2", { exact: true })).toBeVisible();

  await page
    .getByRole("button", {
      name: /Remove New warehouse detected from scenario/i,
    })
    .click();
  await expect(
    page.getByRole("button", {
      name: /Add New warehouse detected to scenario/i,
    }),
  ).toHaveAttribute("aria-pressed", "false");
  await expect(
    page
      .getByRole("main")
      .getByText("No selected change currently requires review."),
  ).toBeVisible();

  await page.goto("/overview");
  await page.getByRole("tab", { name: "Insurance" }).click();
  await expect(
    page.getByText(/deterministic alignment and evidence completeness/i),
  ).toBeVisible();
  await page.goto("/evidence");
  await expect(
    page.getByText(/policy and business records used in the current/i),
  ).toBeVisible();
  await expect(page.getByRole("tab", { name: "Insurance" })).toHaveAttribute(
    "aria-selected",
    "true",
  );

  await page.goto("/reports");
  await expect(
    page.getByText(/material exposure changes assessed/i),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Evidence" }).click();
  await expect(page.getByText(/source-linked and versioned/i)).toBeVisible();
  await expect(page.getByText("Evidence and audit basis")).toBeVisible();

  await page.goto("/changes");
  await page
    .getByRole("main")
    .getByRole("button", { name: "Reset", exact: true })
    .click();
  await page.getByRole("button", { name: "Run full storyline" }).click();
  await expect(page.getByRole("link", { name: "Open assessment" })).toHaveCount(
    5,
  );
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

test("review endpoint validates the tenant and active finding", async ({
  request,
}) => {
  const payload = {
    organizationId: "org_pacific_components",
    assessmentId: "assessment_v2",
    findingId: "finding_new_location",
    eventIds: ["event_new_warehouse"],
    status: "REVIEWING",
    reviewer: { displayName: "Demo SME user", role: "SME_USER" },
    idempotencyKey: "e2e-review-location",
  };
  const response = await request.post("/api/reviews", { data: payload });
  expect(response.status()).toBe(201);
  await expect(response.json()).resolves.toMatchObject({
    accepted: true,
    persisted: false,
    storageMode: "DEMO_REPLAY",
    review: { findingId: "finding_new_location", status: "REVIEWING" },
  });

  const rejected = await request.post("/api/reviews", {
    data: { ...payload, findingId: "finding_not_active" },
  });
  expect(rejected.status()).toBe(409);
});
