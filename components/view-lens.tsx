"use client";

import { useDemo, type ExplanationLens } from "./demo-provider";

const lenses: Array<{ id: ExplanationLens; label: string }> = [
  { id: "simple", label: "Simple" },
  { id: "insurance", label: "Insurance" },
  { id: "evidence", label: "Evidence" },
];

export function ViewLens({ label = "Explanation view" }: { label?: string }) {
  const { lens, setLens } = useDemo();

  return (
    <div className="view-lens" role="tablist" aria-label={label}>
      {lenses.map((item) => (
        <button
          className={lens === item.id ? "active" : ""}
          key={item.id}
          type="button"
          role="tab"
          aria-selected={lens === item.id}
          onClick={() => setLens(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
