# [PRODUCT] Insurance Language Guide

This is the working language standard for the synthetic demonstration. It is
not legal advice and does not replace the definitions, terms, schedules, or
endorsements in an applicable insurance contract.

## The rule to remember

Describe what the supplied evidence supports. Never describe an insurance
outcome the system is not authorised to make.

| Avoid                           | Use instead                                                    | Why                                                                         |
| ------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Covered                         | Available evidence supports alignment for the checks completed | Coverage depends on the complete contract and facts                         |
| Not covered / excluded          | Potential protection gap or policy interpretation required     | The system does not decide contract application                             |
| The finding is correct          | The finding remains for professional review                    | The challenge pass can test evidence, not make a binding decision           |
| We know this is a gap           | Current evidence indicates a plausible mismatch                | A potential gap still requires professional confirmation                    |
| No evidence means no protection | Evidence incomplete                                            | Absence of evidence is not evidence of absence                              |
| AI score                        | Protection Alignment                                           | The indicator is deterministic completeness and alignment, not underwriting |
| The system approved it          | A human reviewer recorded a disposition                        | Professional decisions have named human owners                              |
| Abstain                         | Record as unresolved / system abstention                       | Plain language explains that the system deliberately did not guess          |

## The seven assessment states

| State                          | Plain English                                                              | Insurance perspective                                                                          | Presenter cue                                                                                                 |
| ------------------------------ | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Evidence aligned               | Supplied information supports alignment for the checks completed           | Available evidence supports alignment across evaluated exposure and programme-evidence checks  | “For the checks we ran, the evidence lines up. This is not confirmation of every possible coverage question.” |
| Review recommended             | A meaningful change should be reviewed by a professional                   | A material exposure change met a configured threshold                                          | “Something important changed, so the system recommends broker or insurer review.”                             |
| Potential protection gap       | Business records and supplied protection evidence do not appear to line up | A plausible exposure-to-protection mismatch requires professional confirmation                 | “The records appear not to match, but a professional still confirms the position.”                            |
| Evidence incomplete            | Important information is missing, so the check cannot be completed         | A material evidence checklist input is missing; no protection conclusion is produced           | “The system says ‘I do not know’ and asks for the smallest evidence set that could resolve it.”               |
| Evidence conflict              | Important supplied records disagree                                        | Contradictory material facts are retained with chronology and provenance for human resolution  | “The system does not silently choose a number.”                                                               |
| Policy interpretation required | Relevant wording exists, but a professional needs to interpret it          | Wording, schedule, or endorsement context is not suitable for an automated coverage conclusion | “The system finds the clause; it does not decide the legal effect.”                                           |
| Not assessed                   | The issue was outside the current information or scope                     | No assessment was performed because scope, evidence, or rule coverage was unavailable          | “Unassessed does not mean low risk or aligned.”                                                               |

## Core product terms

### Protection drift

- Plain: the distance that can develop between how a business operates now and
  what its supplied insurance records show.
- Insurance: a material exposure change not yet reconciled with current
  evidenced protection.
- Boundary: a [PRODUCT] concept, not a standard policy term.

### Protection Alignment

- Plain: how closely supplied business information supports alignment with the
  protection records checked.
- Insurance: a deterministic completeness-and-alignment indicator across
  evaluated domains.
- Boundary: not an underwriting score, risk rating, pricing indication,
  probability of loss, or probability of claim acceptance.

### Coverage Challenge Pass

- Plain: a second check that searches for information that could disprove or
  resolve a candidate finding.
- Insurance: an adversarial verification step across schedules, endorsements,
  later versions, declarations, and conflicting evidence.
- Boundary: the word “coverage” names the context of the search; the pass does
  not determine coverage.

### Evidence provenance

- Plain: the record of exactly where a fact came from.
- Insurance: the retained document, version, page, section, excerpt, extraction
  method, timestamp, confidence, and source hash.
- Boundary: provenance proves traceability, not the truth of a source by itself.

### System abstention

- Plain: the system deliberately leaves an issue unresolved when it cannot
  support a reliable conclusion.
- Insurance: a controlled non-conclusion caused by missing or conflicting
  evidence, interpretation requirements, or scope limits.
- Boundary: not dismissal, confirmation, or a negative coverage conclusion.

## Insurance and exposure terms for the demo

### Policy schedule

Lists policy-specific particulars such as the insured, policy period, limits,
locations, or values. It must be read with the applicable wording and
endorsements.

### Policy wording

Contains the contract terms, definitions, exclusions, conditions, and other
provisions. [PRODUCT] may locate relevant wording but does not decide how it
applies to a real event.

### Endorsement

A document that changes, adds, removes, or clarifies policy wording or scheduled
particulars. Its version and effective date matter.

### Limit and sublimit

A limit is a maximum amount stated for a policy or section, subject to the
contract. A sublimit is a smaller limit applying to a particular category.
Neither is a guaranteed claim payment.

### Deductible / excess

The contractually stated amount retained by the insured or applying before or
alongside an insurer payment. It cannot be used alone to calculate a claim
outcome.

### Property damage

Physical property exposure involving premises, stock, equipment, machinery, or
other assets, as the applicable policy defines it.

### Business interruption (BI)

Defined financial loss following an insured trigger, subject to the basis,
period, limits, and conditions in the policy. In the demo, BI is treated mainly
as a consequence and dependency layer.

### Contingent business interruption (CBI)

Dependency-based interruption associated with damage or another defined trigger
at a third party, such as a supplier. The exact trigger and scheduled-dependency
treatment depend on the wording.

### Indemnity period

The policy-defined period during which covered business interruption loss is
measured. It is not the same as a technical Recovery Time Objective.

### Recovery Time Objective (RTO)

The planned recovery duration for a system or process before business impact
becomes unacceptable. It is an operational resilience target, not an insurance
promise.

### Multi-factor authentication (MFA)

Authentication using more than one distinct factor category. A single MFA
statement does not prove complete deployment or operating effectiveness.

## Recommended two-minute language sequence

1. “SMEs change every day. Their protection records may not. We call the
   resulting difference Protection Drift.”
2. “The platform turns supplied business and policy records into versioned,
   source-linked facts.”
3. “Deterministic rules compare those facts. The AI does not decide the rule
   outcome.”
4. “Here, Warehouse B appears in the lease and asset register but not in the
   supplied property location schedule, so the state is Potential protection
   gap—not ‘uncovered’.”
5. “Before surfacing that item, the Coverage Challenge Pass searches for later
   schedules, endorsements, or contradictions that could prove it wrong.”
6. “When evidence is missing, the system abstains. It says Evidence incomplete
   and asks only for the information capable of resolving the uncertainty.”
7. “A broker, insurer, underwriter, or other qualified professional owns the
   decision. The platform provides the shared evidence and audit trail.”

## Reference basis

- [Zurich Singapore — Property](https://www.zurich.com.sg/corporate-solutions/our-products/property)
- [Zurich Singapore — Financial Lines](https://www.zurich.com.sg/corporate-solutions/our-products/financial-lines)
- [Zurich — Contingent business interruption](https://www.nordic.zurich.com/en/news-and-risk-insights/articles/contingent-business-interruption)
- [Zurich — Cyber risk](https://www.zurich.com/en/commercial-insurance/products/cyber)
- [Zurich Singapore — My Zurich](https://www.zurich.com.sg/customer-support/tools-and-guides/my-zurich)
- [MoneySense Singapore — General insurance](https://www.moneysense.gov.sg/introduction-to-general-insurance/)
- [MoneySense Singapore — Insurance documents](https://www.moneysense.gov.sg/interpreting-your-insurance-documents/)
- [NIST — Recovery Time Objective](https://csrc.nist.gov/glossary/term/Recovery_Time_Objective)
- [NIST — Multi-Factor Authentication](https://csrc.nist.gov/glossary/term/Multi_Factor_Authentication)
- [NIST — Privileged Account](https://csrc.nist.gov/glossary/term/privileged_account)
