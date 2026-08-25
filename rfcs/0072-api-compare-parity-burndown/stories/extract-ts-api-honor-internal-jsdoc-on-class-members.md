---
title: "extract-ts-api: honor @internal JSDoc on class members"
status: done
updated: 2026-08-03
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 5964
claim: "2026-08-03T12:44:05Z"
assignee: "extract-ts-api-honor-internal-jsdoc-on-class-members"
blocked-by: null
closed-reason: null
---

## Context

`extract-ts-api.ts` honors an `@internal` JSDoc tag for exported file
functions (`hasInternalJsDocTag(node)` at line 655), for interface members
(line 857), and for object-literal module members (line 1723). It does NOT
honor it for **class members**: the class walker at line 1889 computes
`const internal = visibility !== "public"` from `memberVisibility(member)`
(line 2710), which only reads `private` / `protected` / `#`-field, and never
consults JSDoc.

Found while doing `mark-column-method-names-internal` (PR #5953): marking the
three `columnMethodNames` declarations `/** @internal */` left them fully
scored on the compared surface. The story shipped by falling back to the
`_`-prefix marker `extra-surface.ts` filters on
(`extra-surface.ts:658`), which worked — but the two markers should not
disagree by declaration kind. The existing `/** @internal */` JSDoc already
sprinkled across `abstract-adapter.ts` class bodies is silently inert today.

## Acceptance criteria

- The class-member branch of `extract-ts-api.ts` sets `internal: true` when
  the member carries an `@internal` JSDoc tag, in addition to the existing
  visibility-modifier rule.
- A unit test in `extract-ts-api.test.ts` covers a public class method tagged
  `@internal`.
- `pnpm parity:api:extra` totals move only by the newly-recognized members; record
  the delta in the PR body (build state moves totals, so measure on a fresh
  `pnpm build`).
