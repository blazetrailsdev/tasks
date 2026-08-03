---
title: "Resolve the 12 @noRailsEquivalent tags left dead by @internal on class members"
status: ready
updated: 2026-08-03
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #5964 made `extract-ts-api.ts` honor `@internal` JSDoc on class members
(and on synthesized `__mixin` members / constructors). `@internal` removes a
member from the compared surface before its `@noRailsEquivalent` tag can
match, so any member carrying BOTH tags now leaves a dead tag behind.

`pnpm api:extra` reports the drop directly: the tag line moved from
`99 tag(s), 99 matched` to `99 tag(s), 87 matched` on that merge. Twelve
written `@noRailsEquivalent` tags are now inert — they justify surface that is
no longer scored.

Each of the twelve is a small judgement call, not a mechanical delete: either
the `@internal` is right (drop the now-redundant `@noRailsEquivalent` prose)
or the member is genuinely Rails-facing trails-only surface (drop the
`@internal` instead and keep it scored + allowlisted). The two markers mean
different things — `@internal` says "not part of the compared surface at all",
`@noRailsEquivalent` says "counted, and deliberate".

Find them by diffing the matched-tag set before/after, or by grepping for
declarations whose JSDoc carries both tags.

## Acceptance criteria

- Every member carrying both `@internal` and `@noRailsEquivalent` is resolved
  to exactly one of the two markers, with the choice justified at the call
  site.
- `pnpm api:extra` reports `N tag(s), N matched` again (no unmatched written
  tags).
- Record the extra-surface total delta in the PR body, measured on a fresh
  `pnpm build`.
