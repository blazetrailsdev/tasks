---
title: "Gate unclassified @noRailsEquivalent reasons once the population is classified"
status: done
updated: 2026-07-31
rfc: "0080-api-compare-jsdoc-metadata"
cluster: null
deps:
  - classify-existing-no-rails-equivalent-tag-reasons
deps-rfc: []
est-loc: 90
priority: null
pr: 5712
claim: "2026-07-31T15:30:07Z"
assignee: "gate-unclassified-no-rails-equivalent-tag-reasons"
blocked-by: null
closed-reason: null
---

## Context

PR #5648 (RFC 0080) landed the permanence-claim signal as **advisory**:
`parity:api:extra` reports `tagged.classification.unclassified` but never fails on
it. That was deliberate — 76 tags existed at merge and 74 predate the
convention, so a gate would have blocked every unrelated PR.

Once `classify-existing-no-rails-equivalent-tag-reasons` brings the
unclassified count to 0, nothing stops the next batch of unclassified tags
from merging quietly, which is the exact re-accumulation this RFC's closing
finding was about.

Blocked until the population is classified — the gate is meaningless before
then and hostile during.

## Acceptance criteria

- `parity:api:extra` fails when a `@noRailsEquivalent` reason states no permanence
  claim, alongside the existing stale-tag and empty-reason failures.
- Decide and document whether it is a hard gate (unclassified = 0 forever) or
  a ratchet on the count; prefer the hard gate if the population is at 0, since
  a ratchet re-admits the debt it exists to stop.
- The JSON report shape stays stable for the stats-DB consumer.
- Update `docs/infrastructure/api-build-stub-generation-plan.md`, which
  currently records the signal as advisory and the gate as a follow-up.
