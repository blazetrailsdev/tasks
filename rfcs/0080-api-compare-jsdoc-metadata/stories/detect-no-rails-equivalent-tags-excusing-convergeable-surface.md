---
title: "Detect @noRailsEquivalent tags that excuse convergeable surface"
status: done
updated: 2026-07-30
rfc: "0080-api-compare-jsdoc-metadata"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 5648
claim: "2026-07-30T15:02:23Z"
assignee: "detect-no-rails-equivalent-tags-excusing-convergeable-surface"
blocked-by: null
closed-reason: null
---

## Context

Closing finding of the `@noRailsEquivalent` tag audit (PR #5465, RFC 0080 —
see `rfcs/0080-api-compare-jsdoc-metadata/tag-audit.md`).

`parity:api:extra` enforces exactly one direction: a **stale** tag — one on a name
that no longer flags as extra surface — fails the run. That is what caught
`NullConfig`. Nothing catches the inverse: a tag on surface that still flags
and **should not exist at all**.

That inverse is the failure mode the audit was created to find, and it was
common. Of 79 tags, 42 (53%) described convergeable surface — unfinished
porting, a fixable collision, a comparator gap — not a language- or
runtime-level fact. Every one passed `parity:api:extra` cleanly the whole time,
because each reason was factually accurate about its mechanism and merely drew
"therefore permanent" from it.

The audit only happened because a story was written for it. Nothing schedules
the next one, so a batch of tags added at once re-accumulates the same debt
silently.

## Acceptance criteria

- Decide the mechanism. Two candidates, not mutually exclusive:
  - Require a permanence classification token in the reason (the two
    `schemaStatements` tags now open with `PERMANENT`), so a tag that never
    states a permanence claim is visible as unclassified rather than assumed
    fine.
  - Report tag counts per package with a ratchet, so a batch addition has to
    be acknowledged rather than merging quietly.
- Whichever lands, `parity:api:extra` must keep its current exit-code contract:
  invalid justifications and stale entries fail; the report itself stays
  advisory, and the JSON report shape stays stable for the stats-DB consumer.
- Do NOT convert this into a hard gate that fails on unclassified tags in one
  step — 76 tags exist today and most predate any convention. Land the signal
  first; a ratchet or gate is a follow-up once the population is classified.
- Record in the RFC how often a re-audit should run, so the next batch has an
  owner.
