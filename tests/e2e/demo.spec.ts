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
    page.getByRole("heading", { name: "Protection review queue" }),
  ).toBeVisible();
  await expect(
    page.getByText(/External adapters · Not connected/i),
  ).toBeVisible();
  await expect(
    page.getByText("Recorded renewal context", { exact: true }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Exposure" }).click();
  await expect(page.getByRole("heading", { name: "Property" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Business interruption" }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Export" }).click();
  await expect(
    page.getByText(/Future Zurich eXchange mapping preview/i),
  ).toBeVisible();
  await expect(page.getByText(/Nothing is sent to Zurich/i)).toBeVisible();

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

test("professional actions use clear states and the dense pages stay readable", async ({
  page,
}) => {
  await page.goto("/overview");
  await page
    .getByRole("main")
    .getByRole("button", { name: "Reset demo" })
    .click();
  await page.getByTestId("trigger-warehouse").first().click();
  await page.goto("/review-case");

  await page.getByRole("button", { name: "Start review" }).click();
  await expect(page.getByText("Professional review started.")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Review in progress" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Start review" }),
  ).toBeDisabled();

  const rationale = page.getByLabel("Decision rationale");
  await page.getByRole("button", { name: "Confirm for review" }).click();
  await expect(
    page.getByText("Add a short rationale before recording this decision."),
  ).toBeVisible();
  await rationale.fill("The supplied evidence supports professional review.");
  await page.getByRole("button", { name: "Confirm for review" }).click();
  await expect(
    page.getByText("Finding confirmed for the professional workflow."),
  ).toBeVisible();

  await page.getByRole("button", { name: "Request evidence" }).click();
  await expect(
    page.getByText("Minimum evidence request recorded."),
  ).toBeVisible();

  await rationale.fill("A specialist should interpret the remaining wording.");
  await page.getByRole("button", { name: "Escalate" }).click();
  await expect(
    page.getByText("Finding escalated to a specialist reviewer."),
  ).toBeVisible();

  const hasNoHorizontalOverflow = () =>
    page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    );
  await expect(hasNoHorizontalOverflow()).resolves.toBe(true);

  if ((page.viewportSize()?.width ?? 0) > 820) {
    const renewalSummary = await page
      .locator(".review-workspace-summary")
      .boundingBox();
    expect(renewalSummary?.width ?? 0).toBeGreaterThan(700);
  }

  await page.goto("/reports");
  await expect(hasNoHorizontalOverflow()).resolves.toBe(true);
  if ((page.viewportSize()?.width ?? 0) > 820) {
    const reportPreview = await page.locator(".report-preview").boundingBox();
    expect(reportPreview?.width ?? 0).toBeGreaterThan(760);
  }

  await page.goto("/audit");
  await expect(hasNoHorizontalOverflow()).resolves.toBe(true);
  if ((page.viewportSize()?.width ?? 0) > 820) {
    await expect(page.locator(".audit-version-card")).toHaveCSS(
      "position",
      "static",
    );
    const auditTimeline = await page.locator(".audit-timeline").boundingBox();
    expect(auditTimeline?.width ?? 0).toBeGreaterThan(760);
  }
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

test("review activity endpoint validates case scope and stays replayable", async ({
  request,
}) => {
  const payload = {
    organizationId: "org_pacific_components",
    assessmentId: "assessment_v2",
    caseId: "case_assessment_v2",
    findingId: "finding_new_location",
    eventIds: ["event_new_warehouse"],
    activityType: "COMMENT_ADDED",
    visibility: "PROFESSIONAL_ONLY",
    message: "Please validate the current endorsement pack.",
    author: { displayName: "Demo reviewer", role: "BROKER_RISK_ADVISOR" },
    idempotencyKey: "e2e-comment-location",
  };
  const response = await request.post("/api/review-activity", {
    data: payload,
  });
  expect(response.status()).toBe(201);
  await expect(response.json()).resolves.toMatchObject({
    accepted: true,
    persisted: false,
    storageMode: "DEMO_REPLAY",
    activity: {
      caseId: "case_assessment_v2",
      visibility: "PROFESSIONAL_ONLY",
    },
  });

  const rejected = await request.post("/api/review-activity", {
    data: { ...payload, caseId: "case_assessment_v9" },
  });
  expect(rejected.status()).toBe(403);
});

test("public demo exposes optional sign-in without exposing a session", async ({
  page,
  request,
}) => {
  const session = await request.get("/api/auth/session");
  expect(session.status()).toBe(200);
  await expect(session.json()).resolves.toEqual({ authenticated: false });

  await page.goto("/sign-in");
  await expect(
    page.getByRole("heading", { name: "Sign in to save review activity" }),
  ).toBeVisible();
  await expect(page.getByLabel("Email address")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Email me a sign-in link" }),
  ).toBeVisible();
  await expect(page.getByText("No password is stored")).toBeVisible();
});
