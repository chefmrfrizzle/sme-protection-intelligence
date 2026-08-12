export const brand = {
  wordmark: process.env.NEXT_PUBLIC_PRODUCT_WORDMARK || "[PRODUCT]",
  mark: "P",
  reportTitle: "SME Protection Alignment Report",
  accent: "#0f766e",
  accentDark: "#115e59",
  disclaimer:
    "Decision-support output only. This does not constitute a coverage determination, legal advice, a claim decision, or an insurer endorsement.",
} as const;
