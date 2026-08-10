---
title: "Re-audit cadence still names the now-gated unclassified count as a trigger"
status: done
updated: 2026-07-31
rfc: "0080-api-compare-jsdoc-metadata"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: 5722
claim: "2026-07-31T17:09:04Z"
assignee: "retire-unclassified-as-a-re-audit-trigger"
blocked-by: null
closed-reason: null
---

## Context

PR #5712 turned `tagged.classification.unclassified` into a hard gate: a
`@noRailsEquivalent` reason opening with neither PERMANENT nor CONVERGEABLE
now fails `parity:api:extra`.

That makes the metric permanently 0 on `main` — which silently retires it as a
re-audit trigger. `docs/infrastructure/api-build-stub-generation-plan.md`
("Re-audit cadence") still names it as one:

> the trigger is checkable from the `parity:api:extra` JSON report alone —
> `tagged.total`, which the stats DB already ingests, plus
> `tagged.classification.unclassified`.

Post-#5712 the second half of that sentence can never fire. The cadence now
rests on `tagged.total` growth alone, and the doc should say so rather than
pointing a reader at a dead signal.

Worth considering as the replacement signal: `tagged.classification.convergeable`
growth. A CONVERGEABLE tag is a placeholder for registered work, so a rising
count is exactly the re-accumulation the audit cadence exists to catch — and
unlike `unclassified` it is not gated to 0.

## Acceptance criteria

- The "Re-audit cadence" section stops naming `unclassified` as a trigger and
  states why (the gate pins it at 0).
- A replacement trigger is chosen and documented — prefer `convergeable`
  growth alongside the existing `tagged.total` threshold, or justify keeping
  `tagged.total` alone.
- No change to the JSON report shape; the stats DB already ingests both fields.
