"use client";

import { useMemo, useState } from "react";
import { BookOpenText, ExternalLink, Search, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import {
  glossaryCategories,
  glossaryEntries,
  languageSources,
  type LanguagePerspective,
} from "@/domain/language/insurance-language";

const perspectiveCopy: Record<
  LanguagePerspective,
  { label: string; intro: string; fieldLabel: string }
> = {
  plain: {
    label: "Plain English",
    intro:
      "What the term means for an SME owner without assuming insurance expertise.",
    fieldLabel: "What it means",
  },
  insurance: {
    label: "Insurance",
    intro:
      "More precise working language for broker, insurer, underwriter, and risk-professional review.",
    fieldLabel: "Professional meaning",
  },
  presenter: {
    label: "Presenter cue",
    intro:
      "A short, defensible way to explain the term during the demonstration.",
    fieldLabel: "What to say",
  },
};

export default function GlossaryPage() {
  const [perspective, setPerspective] = useState<LanguagePerspective>("plain");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All terms");

  const matchingEntries = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return glossaryEntries.filter((entry) => {
      const matchesCategory =
        category === "All terms" || entry.category === category;
      const searchable = [
        entry.term,
        entry.abbreviation,
        entry.category,
        entry.plain,
        entry.insurance,
        entry.presenter,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return (
        matchesCategory && (!normalized || searchable.includes(normalized))
      );
    });
  }, [category, query]);

  return (
    <div className="page-stack glossary-page">
      <PageHeader
        eyebrow="Working language standard"
        title="Protection and insurance glossary"
        description="One shared vocabulary for SME users, insurance professionals, and the demo presenter."
        actions={
          <a className="button secondary" href="#authoritative-sources">
            View sources <ExternalLink size={15} />
          </a>
        }
      />

      <section className="language-boundary" aria-label="Language boundary">
        <ShieldAlert aria-hidden="true" size={21} />
        <div>
          <strong>Working definitions, not policy definitions</strong>
          <p>
            These definitions explain how [PRODUCT] uses each term. For any real
            matter, the complete policy wording, schedule, endorsements, facts,
            and professional interpretation control.
          </p>
        </div>
      </section>

      <section className="glossary-controls" aria-label="Glossary controls">
        <div>
          <p className="eyebrow">Choose a perspective</p>
          <div
            className="perspective-tabs"
            role="tablist"
            aria-label="Glossary perspective"
          >
            {(Object.keys(perspectiveCopy) as LanguagePerspective[]).map(
              (item) => (
                <button
                  type="button"
                  role="tab"
                  aria-selected={perspective === item}
                  aria-controls="glossary-language-register"
                  id={`glossary-perspective-${item}`}
                  className={perspective === item ? "active" : ""}
                  key={item}
                  onClick={() => setPerspective(item)}
                >
                  {perspectiveCopy[item].label}
                </button>
              ),
            )}
          </div>
          <p className="perspective-intro">
            {perspectiveCopy[perspective].intro}
          </p>
        </div>
        <label className="glossary-search">
          <span>Search the language guide</span>
          <div>
            <Search aria-hidden="true" size={17} />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Try ‘potential gap’ or ‘BI’"
            />
          </div>
        </label>
      </section>

      <div className="category-filter" aria-label="Filter glossary by category">
        {["All terms", ...glossaryCategories].map((item) => (
          <button
            type="button"
            aria-pressed={category === item}
            className={category === item ? "active" : ""}
            key={item}
            onClick={() => setCategory(item)}
          >
            {item}
          </button>
        ))}
      </div>

      <section
        id="glossary-language-register"
        role="tabpanel"
        aria-labelledby={`glossary-perspective-${perspective}`}
      >
        <div className="section-heading glossary-results-heading">
          <div>
            <p className="eyebrow">Language register</p>
            <h2 id="glossary-results-heading">
              {matchingEntries.length} matching term
              {matchingEntries.length === 1 ? "" : "s"}
            </h2>
          </div>
          <span>{perspectiveCopy[perspective].label} perspective</span>
        </div>

        {matchingEntries.length ? (
          <div className="glossary-grid">
            {matchingEntries.map((entry) => {
              const definition = entry[perspective];
              return (
                <article
                  className="glossary-entry"
                  id={entry.id}
                  key={entry.id}
                >
                  <header>
                    <span>{entry.category}</span>
                    <h3>
                      {entry.term}
                      {entry.abbreviation ? (
                        <small>{entry.abbreviation}</small>
                      ) : null}
                    </h3>
                  </header>
                  <div className="glossary-definition">
                    <span>{perspectiveCopy[perspective].fieldLabel}</span>
                    <p>{definition}</p>
                  </div>
                  <div className="language-guardrail">
                    <strong>Do not imply</strong>
                    <p>{entry.boundary}</p>
                  </div>
                  {entry.sourceIds?.length ? (
                    <div className="entry-sources">
                      <span>Reference basis</span>
                      {entry.sourceIds.map((sourceId) => {
                        const source = languageSources[sourceId];
                        return (
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noreferrer"
                            key={sourceId}
                          >
                            {source.label} <ExternalLink size={11} />
                          </a>
                        );
                      })}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="glossary-empty">
            <BookOpenText aria-hidden="true" size={22} />
            <h2>No matching term</h2>
            <p>Try a broader search or choose All terms.</p>
          </div>
        )}
      </section>

      <section className="source-register" id="authoritative-sources">
        <div>
          <p className="eyebrow">Reference basis</p>
          <h2>Authoritative terminology sources</h2>
          <p>
            Product-specific terms such as Protection Drift and Coverage
            Challenge Pass are clearly marked as [PRODUCT] working concepts.
            Insurance and control terminology is grounded in the sources below.
          </p>
        </div>
        <div className="source-link-grid">
          {Object.entries(languageSources).map(([id, source]) => (
            <a href={source.url} target="_blank" rel="noreferrer" key={id}>
              <span>{source.label}</span>
              <ExternalLink aria-hidden="true" size={15} />
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
