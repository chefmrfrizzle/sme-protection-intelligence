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
    page.getByText("Potential protection gap", { exact: true }).first(),
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
    page.getByRole("heading", { name: "Finding remains for review" }).first(),
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
    page.getByText("Professional review in progress", { exact: true }).first(),
  ).toBeVisible();
  await page.getByRole("link", { name: "Open review case" }).click();
  await expect(
    page.getByRole("heading", { name: "Protection Review Case" }),
  ).toBeVisible();
  await expect(page.getByText(/Mock adapter · Not connected/i)).toBeVisible();
  await expect(
    page.getByText("Ready for professional review", { exact: true }),
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

test("rehearsal coach drives the exact reset-to-audit presentation", async ({
  page,
}) => {
  await page.goto("/rehearsal");
  await expect(
    page.getByRole("heading", { name: "Three-minute demo rehearsal" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Start timed rehearsal" }),
  ).toBeVisible();
  await expect(
    page.getByRole("main").getByText("Exact runtime").first(),
  ).toBeVisible();
  await expect(page.getByText("3:00", { exact: true }).first()).toBeVisible();
  await expect(
    page.getByRole("button", { name: /^Open cue \d+:/ }),
  ).toHaveCount(10);

  await page.getByRole("button", { name: "Practice untimed" }).click();
  await expect(page).toHaveURL(/\/overview$/);
  await expect(page.getByTestId("rehearsal-dock")).toBeVisible();
  await expect(
    page.getByTestId("rehearsal-dock").getByText("Reset and frame the problem"),
  ).toBeVisible();
  await page.getByTestId("rehearsal-open-scene").click();
  await expect(
    page
      .getByRole("main")
      .getByRole("heading", { name: "100% evidence-aligned", exact: true })
      .first(),
  ).toBeVisible();

  await page.getByTestId("rehearsal-next").click();
  await page.getByTestId("rehearsal-next").click();
  await expect(
    page.getByTestId("rehearsal-dock").getByText("Apply the warehouse change"),
  ).toBeVisible();
  await page.getByTestId("rehearsal-open-scene").click();
  await expect(
    page
      .getByText("New location may require protection review", { exact: true })
      .first(),
  ).toBeVisible();

  await page.getByTestId("rehearsal-next").click();
  await page.getByTestId("rehearsal-open-scene").click();
  await expect(page).toHaveURL(/\/findings\/finding_new_location$/);
  await expect(
    page.getByText("Potential protection gap", { exact: true }).first(),
  ).toBeVisible();

  await page.getByTestId("rehearsal-next").click();
  await page.getByTestId("rehearsal-open-scene").click();
  await expect(page).toHaveURL(/#evidence-provenance$/);
  await expect(page.getByRole("tab", { name: "Evidence" })).toHaveAttribute(
    "aria-selected",
    "true",
  );

  await page.getByTestId("rehearsal-next").click();
  await page.getByTestId("rehearsal-open-scene").click();
  await expect(page).toHaveURL(/#coverage-challenge$/);
  await expect(page.getByRole("tab", { name: "Insurance" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(
    page.getByRole("heading", { name: "Finding remains for review" }).first(),
  ).toBeVisible();

  await page.getByTestId("rehearsal-next").click();
  await page.getByTestId("rehearsal-open-scene").click();
  await expect(page).toHaveURL(/\/findings\/finding_cloud_dependency$/);
  await expect(
    page.getByText("Evidence incomplete", { exact: true }).first(),
  ).toBeVisible();

  await page.getByTestId("rehearsal-next").click();
  await page.getByTestId("rehearsal-open-scene").click();
  await expect(
    page.getByRole("button", { name: "Expand rehearsal coach" }),
  ).toBeVisible();
  await page.getByTestId("request-review").click();
  await expect(
    page.getByText("Professional review in progress", { exact: true }).first(),
  ).toBeVisible();
  await page.getByRole("link", { name: "Open review case" }).click();
  await expect(
    page.getByRole("heading", { name: "Protection Review Case" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Expand rehearsal coach" }).click();
  await page.getByTestId("rehearsal-next").click();
  await page.getByTestId("rehearsal-open-scene").click();
  await expect(page).toHaveURL(/\/reports$/);
  await expect(page.getByTestId("download-report")).toBeVisible();
  await expect(
    page.getByText("Assessment v3 is source-linked and versioned"),
  ).toBeVisible();

  await page.getByRole("button", { name: "Expand rehearsal coach" }).click();
  await page.getByTestId("rehearsal-next").click();
  await page.getByTestId("rehearsal-open-scene").click();
  await expect(page).toHaveURL(/\/audit$/);
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

test("control centre explains readiness without making live or coverage claims", async ({
  page,
}) => {
  await page.goto("/controls");
  await expect(
    page.getByRole("heading", { name: "Control centre" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Core trust substrate built" }).first(),
  ).toBeVisible();
  await expect(page.getByText("Live claims").first()).toBeVisible();
  await expect(
    page.getByText("Make an insurance or legal decision").first(),
  ).toBeVisible();
  await expect(page.getByText("BN-08").first()).toBeVisible();
});

test("language guide explains terms across three perspectives", async ({
  page,
}) => {
  await page.goto("/glossary");
  await expect(
    page.getByRole("heading", { name: "Protection and insurance glossary" }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("region", { name: "Language boundary" })
      .getByText("Working definitions, not policy definitions", { exact: true })
      .first(),
  ).toBeVisible();

  await page.getByRole("tab", { name: "Presenter cue" }).click();
  await expect(
    page.getByText(/the system tries to prove itself wrong/i),
  ).toBeVisible();

  const glossarySearch = page
    .getByRole("main")
    .getByRole("searchbox", { name: "Search the language guide" })
    .first();
  await glossarySearch.fill("contingent");
  await expect(
    page.getByRole("heading", { name: /Contingent business interruption/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "1 matching term" }),
  ).toBeVisible();

  await glossarySearch.fill("");
  await page.getByRole("button", { name: "Assessment state" }).click();
  await expect(
    page.getByRole("heading", { name: "7 matching terms" }),
  ).toBeVisible();
});
