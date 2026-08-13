import { createHash } from "node:crypto";
import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";
import type { Assessment, Finding } from "../types";
import { brand } from "../brand";
import { demoCompany } from "@/demo/company";
import { evidenceArtifacts } from "@/demo/evidence";
import { eventPresentation } from "@/demo/events";
import {
  protectionDomainLabel,
  reviewStatusLabel,
  stateLabel,
} from "../language/insurance-language";

const PAGE = { width: 595.28, height: 841.89, margin: 52 };
const colors = {
  ink: rgb(0.08, 0.12, 0.14),
  muted: rgb(0.35, 0.4, 0.42),
  line: rgb(0.86, 0.88, 0.87),
  pale: rgb(0.95, 0.97, 0.96),
  accent: rgb(0.06, 0.46, 0.43),
  warning: rgb(0.7, 0.38, 0.05),
  white: rgb(1, 1, 1),
};

type Context = {
  pdf: PDFDocument;
  regular: PDFFont;
  bold: PDFFont;
  page: PDFPage;
  y: number;
  pageNumber: number;
};

function clean(text: string) {
  return text
    .replaceAll("→", "to")
    .replaceAll("–", "-")
    .replaceAll("—", "-")
    .replaceAll("✓", "Yes");
}

function wrap(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
): string[] {
  const words = clean(text).split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) line = candidate;
    else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function footer(context: Context, assessment: Assessment) {
  const { page, regular, pageNumber } = context;
  page.drawLine({
    start: { x: PAGE.margin, y: 38 },
    end: { x: PAGE.width - PAGE.margin, y: 38 },
    thickness: 0.6,
    color: colors.line,
  });
  page.drawText(
    `${brand.wordmark} | ${assessment.id} | Synthetic demonstration`,
    {
      x: PAGE.margin,
      y: 23,
      size: 7.5,
      font: regular,
      color: colors.muted,
    },
  );
  page.drawText(String(pageNumber), {
    x: PAGE.width - PAGE.margin - 6,
    y: 23,
    size: 8,
    font: regular,
    color: colors.muted,
  });
}

function newPage(context: Context, assessment: Assessment): Context {
  footer(context, assessment);
  const page = context.pdf.addPage([PAGE.width, PAGE.height]);
  return {
    ...context,
    page,
    y: PAGE.height - PAGE.margin,
    pageNumber: context.pageNumber + 1,
  };
}

function ensure(
  context: Context,
  assessment: Assessment,
  height: number,
): Context {
  return context.y - height < 58 ? newPage(context, assessment) : context;
}

function heading(
  context: Context,
  assessment: Assessment,
  title: string,
  eyebrow?: string,
): Context {
  const next = ensure(context, assessment, eyebrow ? 54 : 38);
  if (eyebrow) {
    next.page.drawText(eyebrow.toUpperCase(), {
      x: PAGE.margin,
      y: next.y,
      size: 7.5,
      font: next.bold,
      color: colors.accent,
    });
    next.y -= 16;
  }
  next.page.drawText(title, {
    x: PAGE.margin,
    y: next.y,
    size: 17,
    font: next.bold,
    color: colors.ink,
  });
  next.y -= 27;
  return next;
}

function paragraph(
  context: Context,
  assessment: Assessment,
  text: string,
  options: {
    size?: number;
    color?: typeof colors.ink;
    indent?: number;
    gap?: number;
  } = {},
): Context {
  const size = options.size ?? 9.5;
  const indent = options.indent ?? 0;
  const maxWidth = PAGE.width - PAGE.margin * 2 - indent;
  const lines = wrap(text, context.regular, size, maxWidth);
  const next = ensure(
    context,
    assessment,
    lines.length * (size + 4) + (options.gap ?? 8),
  );
  for (const line of lines) {
    next.page.drawText(line, {
      x: PAGE.margin + indent,
      y: next.y,
      size,
      font: next.regular,
      color: options.color ?? colors.ink,
    });
    next.y -= size + 4;
  }
  next.y -= options.gap ?? 8;
  return next;
}

function findingBlock(
  context: Context,
  assessment: Assessment,
  finding: Finding,
): Context {
  const next = ensure(context, assessment, 102);
  const blockHeight = 92;
  next.page.drawRectangle({
    x: PAGE.margin,
    y: next.y - blockHeight + 11,
    width: PAGE.width - PAGE.margin * 2,
    height: blockHeight,
    color: colors.pale,
    borderColor: colors.line,
    borderWidth: 0.5,
  });
  next.page.drawText(stateLabel(finding.state).toUpperCase(), {
    x: PAGE.margin + 14,
    y: next.y - 5,
    size: 7.5,
    font: next.bold,
    color: finding.state === "POTENTIAL_GAP" ? colors.warning : colors.accent,
  });
  next.page.drawText(clean(finding.title), {
    x: PAGE.margin + 14,
    y: next.y - 23,
    size: 11,
    font: next.bold,
    color: colors.ink,
  });
  const lines = wrap(
    finding.simpleExplanation,
    next.regular,
    8.5,
    PAGE.width - PAGE.margin * 2 - 28,
  ).slice(0, 3);
  lines.forEach((line, index) => {
    next.page.drawText(line, {
      x: PAGE.margin + 14,
      y: next.y - 40 - index * 12,
      size: 8.5,
      font: next.regular,
      color: colors.muted,
    });
  });
  next.y -= blockHeight + 8;
  return next;
}

export async function createAssessmentPdf(
  assessment: Assessment,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`${brand.wordmark} ${brand.reportTitle}`);
  pdf.setAuthor(brand.wordmark);
  pdf.setSubject("Synthetic SME protection alignment assessment");
  pdf.setKeywords(["synthetic", "protection drift", "evidence alignment"]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const page = pdf.addPage([PAGE.width, PAGE.height]);
  let context: Context = {
    pdf,
    regular,
    bold,
    page,
    y: PAGE.height - PAGE.margin,
    pageNumber: 1,
  };

  context.page.drawRectangle({
    x: 0,
    y: PAGE.height - 190,
    width: PAGE.width,
    height: 190,
    color: colors.ink,
  });
  context.page.drawText(brand.wordmark, {
    x: PAGE.margin,
    y: PAGE.height - 70,
    size: 12,
    font: bold,
    color: colors.white,
  });
  context.page.drawText(brand.reportTitle, {
    x: PAGE.margin,
    y: PAGE.height - 108,
    size: 24,
    font: bold,
    color: colors.white,
  });
  context.page.drawText(demoCompany.name, {
    x: PAGE.margin,
    y: PAGE.height - 136,
    size: 12,
    font: regular,
    color: rgb(0.79, 0.85, 0.84),
  });
  context.page.drawText("SYNTHETIC DEMONSTRATION", {
    x: PAGE.width - PAGE.margin - 135,
    y: PAGE.height - 68,
    size: 7.5,
    font: bold,
    color: rgb(0.5, 0.82, 0.78),
  });
  context.y = PAGE.height - 226;

  context = heading(
    context,
    assessment,
    "Executive Summary",
    "Current assessment",
  );
  const potentialGaps = assessment.findings.filter(
    (finding) => finding.state === "POTENTIAL_GAP",
  ).length;
  const reviewItems = assessment.findings.filter(
    (finding) => finding.state === "REVIEW_RECOMMENDED",
  ).length;
  const incomplete = assessment.findings.filter(
    (finding) => finding.state === "EVIDENCE_INCOMPLETE",
  ).length;
  context = paragraph(
    context,
    assessment,
    `${assessment.appliedEventIds.length} material operating change${assessment.appliedEventIds.length === 1 ? " has" : "s have"} occurred since the baseline assessment. ${potentialGaps} potential protection gap${potentialGaps === 1 ? " has" : "s have"} been identified, ${reviewItems} exposure item${reviewItems === 1 ? " requires" : "s require"} review, and ${incomplete} assessment${incomplete === 1 ? " remains" : "s remain"} incomplete because supporting evidence was not available.`,
    { size: 11, gap: 18 },
  );

  const barX = PAGE.margin;
  const barWidth = PAGE.width - PAGE.margin * 2;
  context.page.drawText("PROTECTION ALIGNMENT", {
    x: barX,
    y: context.y,
    size: 7.5,
    font: bold,
    color: colors.muted,
  });
  context.page.drawText(`${assessment.alignment}% evidence-aligned`, {
    x: barX,
    y: context.y - 25,
    size: 20,
    font: bold,
    color: colors.ink,
  });
  context.page.drawRectangle({
    x: barX,
    y: context.y - 46,
    width: barWidth,
    height: 7,
    color: colors.line,
  });
  context.page.drawRectangle({
    x: barX,
    y: context.y - 46,
    width: barWidth * (assessment.alignment / 100),
    height: 7,
    color: colors.accent,
  });
  context.y -= 78;

  context = heading(
    context,
    assessment,
    "Current Protection Alignment",
    "Domain state",
  );
  for (const domain of assessment.domains) {
    context = ensure(context, assessment, 40);
    context.page.drawText(protectionDomainLabel(domain.domain).toUpperCase(), {
      x: PAGE.margin,
      y: context.y,
      size: 9,
      font: bold,
      color: colors.ink,
    });
    context.page.drawText(stateLabel(domain.state).toUpperCase(), {
      x: PAGE.margin + 175,
      y: context.y,
      size: 8,
      font: bold,
      color: colors.accent,
    });
    context.page.drawText(
      `${domain.evidencePresent}/${domain.evidenceRequired} evidence | ${domain.score}%`,
      {
        x: PAGE.width - PAGE.margin - 120,
        y: context.y,
        size: 8,
        font: regular,
        color: colors.muted,
      },
    );
    context.y -= 18;
  }
  context.y -= 8;
  context = paragraph(
    context,
    assessment,
    "The alignment indicator is deterministic evidence completeness and alignment across evaluated domains. It is not an underwriting score, probability of loss, claim outcome, pricing indication, credit score, or insurer risk rating.",
    { size: 8.5, color: colors.muted },
  );

  context = newPage(context, assessment);
  context = heading(
    context,
    assessment,
    "Material Exposure Changes",
    "Protection drift",
  );
  if (!assessment.appliedEventIds.length) {
    context = paragraph(
      context,
      assessment,
      "No material change events are applied in this baseline assessment.",
    );
  } else {
    for (const eventId of assessment.appliedEventIds) {
      const presentation = eventPresentation[eventId];
      context = paragraph(
        context,
        assessment,
        `${presentation.title}: ${presentation.diff}. ${presentation.detail}`,
        { indent: 8, gap: 6 },
      );
    }
  }

  context = heading(
    context,
    assessment,
    "Findings and Evidence Uncertainty",
    "Decision support",
  );
  if (!assessment.findings.length) {
    context = paragraph(
      context,
      assessment,
      "Available evidence supports current alignment for the evaluated baseline scope.",
    );
  } else {
    for (const finding of assessment.findings)
      context = findingBlock(context, assessment, finding);
  }

  context = heading(
    context,
    assessment,
    "Risk Mitigation / Recommended Actions",
  );
  const actions = Array.from(
    new Set(assessment.findings.flatMap((finding) => finding.resolutionSteps)),
  );
  if (!actions.length)
    context = paragraph(
      context,
      assessment,
      "Maintain current evidence and reconcile material operating changes when they occur.",
    );
  for (const [index, action] of actions.entries()) {
    context = paragraph(context, assessment, `${index + 1}. ${action}`, {
      indent: 6,
      gap: 4,
    });
  }

  context = newPage(context, assessment);
  context = heading(
    context,
    assessment,
    "Evidence Register",
    "Source provenance",
  );
  for (const artifact of evidenceArtifacts) {
    context = ensure(context, assessment, 34);
    context.page.drawText(artifact.title, {
      x: PAGE.margin,
      y: context.y,
      size: 8.5,
      font: bold,
      color: colors.ink,
    });
    context.page.drawText(`v${artifact.version} | ${artifact.sourceHash}`, {
      x: PAGE.margin + 230,
      y: context.y,
      size: 7,
      font: regular,
      color: colors.muted,
    });
    context.y -= 14;
  }
  context.y -= 10;

  context = heading(
    context,
    assessment,
    "Assessment Method",
    "Controlled orchestration",
  );
  context = paragraph(
    context,
    assessment,
    "Validated replay extraction -> schema validation -> provenance check -> conflict detection -> evidence completeness -> deterministic reconciliation -> materiality check -> candidate finding -> Coverage Challenge Pass -> explicit assessment state -> human review -> versioned snapshot -> report.",
  );

  context = heading(context, assessment, "Human Review Status");
  context = paragraph(
    context,
    assessment,
    assessment.findings.length
      ? assessment.findings
          .map(
            (finding) =>
              `${finding.title}: ${reviewStatusLabel(finding.reviewStatus)}`,
          )
          .join(". ")
      : "No open finding requires professional disposition in the baseline assessment.",
  );

  context = heading(context, assessment, "Limitations");
  context = paragraph(
    context,
    assessment,
    "This report uses synthetic data and selected synthetic evidence only. Findings are decision-support outputs and do not constitute coverage determinations. Confirmation should be obtained from the appropriate insurer, broker, or professional adviser. Complete wording, schedules, endorsements, facts, law, and circumstances may affect any professional interpretation.",
    { size: 8.5 },
  );

  context = heading(context, assessment, "Audit Information");
  const auditLines = [
    `Report ID: report_${assessment.id}`,
    `Assessment version: ${assessment.version}`,
    `Generated at: ${assessment.snapshotAt}`,
    `Evidence snapshot ID: ${assessment.evidenceSnapshotId}`,
    `Ruleset version: ${assessment.rulesetVersion}`,
    `Assessment receipt: ${assessment.receiptHash}`,
  ];
  for (const line of auditLines)
    context = paragraph(context, assessment, line, { size: 8, gap: 2 });

  footer(context, assessment);
  const bytes = await pdf.save({ useObjectStreams: false });
  return bytes;
}

export function reportContentHash(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}
