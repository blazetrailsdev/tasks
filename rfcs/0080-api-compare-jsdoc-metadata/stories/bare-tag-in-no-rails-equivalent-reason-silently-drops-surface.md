---
title: "A bare @internal in a @noRailsEquivalent reason silently drops the declaration from extracted surface"
status: done
updated: 2026-07-27
rfc: "0080-api-compare-jsdoc-metadata"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 5393
claim: "2026-07-27T02:21:10Z"
assignee: "bare-tag-in-no-rails-equivalent-reason-silently-drops-surface"
blocked-by: null
closed-reason: null
---

## Context

A `@noRailsEquivalent` reason whose prose contains a bare `@internal` is parsed
by TypeScript as a real `@internal` tag. `extract-ts-api.ts` then marks the
declaration `internal: true`, `extra-surface.ts` step 3 filters it out of TS
surface entirely, and the tag that was supposed to justify it is reported as a
**stale tag** ("no longer flags as extra surface") — a message that points at
Rails gaining the method or a file-mapping change, none of which happened.

Hit for real while writing the `registerModel` / `initializeAssociations` reasons
in #5368: both reasons legitimately discuss why `@internal` is the wrong tool,
and `initializeAssociations` silently vanished from the extracted surface. The
workaround (escaping as `` `\@internal` ``) is invisible at the call site and
was itself reverted for readability; the final text avoids the word's tag form
entirely. Nothing prevents the next author from hitting this.

Any tag name works here, not just `@internal` — `@deprecated`, `@param` and
friends in reason prose have the same effect.

## Acceptance criteria

- `noRailsEquivalentReason` (or the extractor around it) detects a reason whose
  text was truncated by a following JSDoc tag, or a declaration that is BOTH
  `@noRailsEquivalent`-tagged and `internal: true`, and fails loudly with the
  file:line — the same treatment `@noRailsEquivalent` without a reason already
  gets (`extract-ts-api.ts:1273-1285`).
- The stale-tag error text in `extra-surface.ts` gains this cause to its list of
  explanations, so the message matches the most likely reality.
- Regression test in `extract-ts-api.test.ts` covering a reason containing a
  bare tag name.
