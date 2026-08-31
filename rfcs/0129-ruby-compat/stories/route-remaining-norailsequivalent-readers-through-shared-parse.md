---
title: "Route no-freeform-comments and unbacked-internal-needs-receipt through the shared @noRailsEquivalent parse"
status: draft
updated: 2026-08-31
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`align-norailsequivalent-tag-parse-across-lint-and-extractor` (PR #7307) put ONE
line-leading parse behind `eslint/jsdoc-tag-line.mjs`
(`ANY_TAG_LINE` + `lineLeadingTagReasons`) and routed
`blazetrails/ruby-compat-needs-mri-citation` through it, so that rule and
`scripts/api-compare/extract-ts-api.ts`'s `noRailsEquivalentReason`
(`isLineLeadingJsDocTag`, extract-ts-api.ts:2054) now agree on which JSDoc shapes
carry a receipt.

**Two other readers of the same tag were left on their own parse**, and both are
looser than the extractor — the exact shape of the #7266 failure the story was
filed for (a receipt the lint side credits, the extractor drops, and
`parity:api:extra:gate` reds on a run whose `pnpm lint` is green):

- `eslint/no-freeform-comments.mjs:116` —
  `KEPT_TAG_RE = new RegExp("^[\\s*]*@(" + KEPT_TAG_NAMES + ")\\b", "u")`.
  `[\s*]*` admits ANY indent, so a hang-indented `*  @noRailsEquivalent` is
  line-leading to this rule and a CONTINUATION to `ANY_TAG_LINE`
  (`/^\s*\*?\s?@\S/`, one space after the `*`). The rule keeps such a comment as
  a tag line while the extractor mints no tag from it.
- `eslint/unbacked-internal-needs-receipt.mjs:56,63,90` — bare
  `c.value.includes("@noRailsEquivalent")`, which credits the string ANYWHERE,
  including quoted inside another tag's prose. This is the RFC 0121 rule whose
  entire purpose is that the receipt re-enters an `@internal` member into the
  measured surface, so a receipt it credits and the extractor drops silently
  hides surface on the gated packages.

## Converged shape

Both read the tag through `lineLeadingTagReasons` /`ANY_TAG_LINE` from
`eslint/jsdoc-tag-line.mjs` — no second regex, no `includes`. The extractor stays
the authority (it decides the measured surface); widening `ANY_TAG_LINE` is NOT
the fix, because its one-space bound is what stops wrapped prose naming a Ruby
ivar (`@primary_key`) from minting a tag.

Sweep the tree for receipts whose meaning changes under the tighter parse before
flipping: a tag that only `no-freeform-comments` was crediting is one the
extractor was already ignoring, so it is a real unbacked `@internal` or a
mis-indented receipt to fix, not a row to baseline.

## Acceptance criteria

- `no-freeform-comments.mjs` and `unbacked-internal-needs-receipt.mjs` read
  `@noRailsEquivalent` through `eslint/jsdoc-tag-line.mjs`; no third parse of the
  tag remains in `eslint/` or `scripts/`.
- A test extends `scripts/api-compare/jsdoc-tag-line.test.ts`'s five-form table
  to these two rules, asserting all readers reach the same verdict per form.
- Any receipt in the tree whose meaning changes is FIXED (re-indented, or the
  unearned `@internal` deleted) — not accommodated by loosening the shared parse.
- `pnpm parity:api:extra:gate` totals unchanged; `pnpm lint` green.
