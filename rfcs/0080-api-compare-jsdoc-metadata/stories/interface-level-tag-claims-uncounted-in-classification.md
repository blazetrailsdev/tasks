---
title: "Interface-level @noRailsEquivalent tags carry claims the classification tally never counts"
status: done
updated: 2026-07-30
rfc: "0080-api-compare-jsdoc-metadata"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 5653
claim: "2026-07-30T19:41:20Z"
assignee: "interface-level-tag-claims-uncounted-in-classification"
blocked-by: null
closed-reason: null
---

## Context

Found while classifying every `@noRailsEquivalent` reason (PR #5652, story
`classify-existing-no-rails-equivalent-tag-reasons`).

`buildReport` classifies only _written_ tags —
`const written = tagged.filter((e) => !e.inherited)` at
`scripts/api-compare/extra-surface.ts:1326` — and an **interface-level** tag
reaches the comparator only as `inherited` entries spread onto the interface's
members (the rule PR #5467 chose for
`extra-surface-skip-duck-typed-interface-members`). The declaration itself is
never in `written`, so its permanence claim is never counted.

Observable today on `globalid/locator.ts`'s `LocatorModel`: the tag carries a
PERMANENT claim, but `pnpm parity:api:extra` reports `39 PERMANENT, 39 CONVERGEABLE`
against 79 tag comments on disk (40 / 39 by grep). Both numbers are correct for
their population, which is exactly the problem — a verifier reconciling a hand
grep against the report finds a one-tag gap with no signal explaining it.

This matters more once `gate-unclassified-no-rails-equivalent-tag-reasons`
(blocked, RFC 0080) turns the advisory count into a gate: an unclassified
interface-level tag would pass the gate silently, which is the same
"tag hides the work" failure the 2026-07-27 tag audit exists to prevent.

## Acceptance criteria

- Decide and record the rule: either count the interface DECLARATION's own tag
  in `written` (spreading it to members only for the allow decision), or keep
  it out and report interface-level tags as their own line in the
  classification block so the two populations reconcile.
- Whichever is chosen, `classifyReason` must see every reason a human can see
  in the source — no tag can carry an unclassified reason that the report
  cannot name.
- Report or test proves the reconciliation: the classification totals plus any
  separately-reported bucket equal the on-disk tag-comment count.
- Cover the rule with a case in `extra-surface.test.ts`.
