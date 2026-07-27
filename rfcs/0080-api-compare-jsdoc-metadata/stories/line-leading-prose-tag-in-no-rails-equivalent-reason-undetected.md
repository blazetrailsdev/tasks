---
title: "Detect a line-leading prose @tag inside a @noRailsEquivalent reason"
status: claimed
updated: 2026-07-27
rfc: "0080-api-compare-jsdoc-metadata"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-07-27T21:28:17Z"
assignee: "line-leading-prose-tag-in-no-rails-equivalent-reason-undetected"
blocked-by: null
closed-reason: null
---

## Context

PR 5393 made `noRailsEquivalentReason` (`scripts/api-compare/extract-ts-api.ts`,
`inlineTagAfter`) throw when a bare `@tag` word inside the reason prose sits
**mid-line**, because TypeScript parses it as a real JSDoc tag and truncates the
reason — silently dropping the declaration from extracted surface when the word
is `@internal`.

The same prose word wrapping onto the **start** of a continuation line is still
undetected: a line-leading tag is textually identical to a deliberate one. The
obvious catch-all (error when a declaration carries both `@noRailsEquivalent`
and `@internal`) was implemented and reverted — it fires on a real, deliberate
pairing at
`packages/activerecord/src/connection-adapters/schema-cache.ts:418`
(`recordTouchedTables`, `@internal` + `@noRailsEquivalent` on separate lines).

Options worth evaluating: require the `@internal` tag to _precede_
`@noRailsEquivalent` in the block (so a line-leading tag after the reason is
provably prose); or have the extractor warn rather than throw for that shape;
or reformat `recordTouchedTables` so the ordering rule holds tree-wide and the
check can be a hard error.

## Acceptance criteria

- A prose `@internal` that wraps onto the start of a continuation line inside a
  `@noRailsEquivalent` reason is reported with `file:line`.
- `recordTouchedTables`' deliberate pairing still extracts without error.
- Regression tests in `scripts/api-compare/extract-ts-api.test.ts` for both.
