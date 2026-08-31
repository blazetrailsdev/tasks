---
title: "One @noRailsEquivalent parse for ruby-compat-needs-mri-citation and extra-surface.ts"
status: in-progress
updated: 2026-08-31
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: 21
pr: 7307
claim: "2026-08-31T19:35:25Z"
assignee: "enroll-call-mapping-i18n-and-activesupport"
blocked-by: null
closed-reason: null
---

## Context

Two tools read the same `@noRailsEquivalent` tag and disagree on what counts as
one, which silently drops receipts and reds CI on a run whose `pnpm lint` is
green.

`eslint/rails-private-jsdoc`'s sibling rule
`blazetrails/ruby-compat-needs-mri-citation` accepts a receipt written on the
line that also closes the block:

```ts
/** Ruby `Comparable#<` (`vendor/ruby/compar.c:133` `cmp_lt`).
 *  @noRailsEquivalent PERMANENT — Ruby core `Comparable` (`vendor/ruby/compar.c:133`). */
```

`scripts/api-compare/extra-surface.ts`'s tag extractor does not: it credits a
tag only on its own line, with the block's `*/` on the line after. On PR #7266
that difference dropped all ten `packages/ruby-compat/src/comparable.ts`
receipts, and `pnpm parity:api:extra:gate` read `ruby-compat novel 4 → 14,
total 18 → 32` while `pnpm lint` reported nothing. CI run 33337204403 failed on
exactly that; the fix was a whitespace change with no behavioural content.

The two-space `*  @noRailsEquivalent` continuation form is a second variant
worth pinning down in the same pass.

## Acceptance criteria

- One shared parse for the tag, so the eslint rule and `extra-surface.ts` agree
  on which JSDoc shapes carry a receipt — either the extractor accepts the
  closing-line form, or the lint rule rejects it. Pick one and state why in the
  story's PR body.
- A test in `scripts/api-compare/` covering the closing-line form and the
  two-space continuation form, asserting the extractor and the lint rule reach
  the same verdict on each.
- No existing receipt in the tree changes meaning; `pnpm parity:api:extra:gate`
  totals are unchanged before and after.
