---
title: "Lint JSDoc tag blocks detached from the declaration they document"
status: done
updated: 2026-07-30
rfc: "0080-api-compare-jsdoc-metadata"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 5668
claim: "2026-07-30T19:59:19Z"
assignee: "lint-detached-jsdoc-tag-blocks"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while writing PR #5654
(`synthesized-mixin-members-report-zero-params`).

The first commit inserted a new helper function between `memberVisibility`'s
JSDoc block and its `function memberVisibility(...)` signature in
`scripts/api-compare/extract-ts-api.ts`. TypeScript then binds that JSDoc to
the INSERTED function, and `memberVisibility` is left undocumented — silently.
It was caught by eye during self-review, not by any check.

The same shape is a known extractor hazard in ported source: a comment (or any
node) between a `/** @internal */` block and the declaration it was written
for detaches the tag, so `hasInternalJsDocTag` / `noRailsEquivalentReason`
return nothing and the member reads as unjustified public surface — or, worse,
the tag silently lands on the neighbouring declaration and excuses surface it
was never written for. Nothing in CI reports either outcome; both look exactly
like "no tag was written".

## Acceptance criteria

- Add a lint that flags a JSDoc block carrying an api-compare-significant tag
  (`@internal`, `@noRailsEquivalent`) that is NOT attached to the declaration
  immediately following it in source order — i.e. detect the detached-doc
  shape rather than trusting the resolved binding.
- Decide and document the narrower variant too: a JSDoc block whose bound
  declaration is not the one directly beneath it textually (the insertion case
  above), which is the same defect seen from the other side.
- Run it over the current tree and report how many existing detachments it
  finds; if any are real, fix them or register them.
- Wire it into whatever job already runs the api-compare lints, and test it.
