---
title: "Complete the call-arg descriptor grammar and pin the braced-hash split on both sides"
status: draft
updated: 2026-08-17
rfc: "0025-fidelity-verification-tooling"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Combines two RFC 0025 drafts (swept 2026-08-17). Both extend the call-argument
descriptor vocabulary, and the `extractor-skew` vocabulary pin
(`ts-extractor-emit-call-arguments` AC4) means **any descriptor change must land
on both extractors in one PR** — so they are one change in practice.

### Missing Ripper node kinds fall through to opaque `?`

`extract-ruby-api.rb#describe_arg` (landed #6298) implements the RFC 0025
`## Call-argument fidelity` §1 table. Four Ripper node kinds are absent and fall
through to bare `?`, which makes the **whole call site** opaque and skipped by
the comparator (§2: "any argument list containing an opaque descriptor" is
ignored). Measured over `vendor/rails/activerecord/lib` — 13,730 call sites,
239 bare `?` positions:

| Ripper node       | count | source form      |
| ----------------- | ----: | ---------------- |
| `:aref`           |   182 | `h[:k]`, `xs[0]` |
| `:regexp_literal` |   130 | `/\A[a-z]/`      |
| `:string_concat`  |    25 | `"a" "b"`        |
| `:args_forward`   |    24 | `...`            |

`:aref` and `:regexp_literal` are ~90% of the loss and both are mechanically
describable: `:aref` → `aref` (mirroring TS `ElementAccessExpression`);
`:regexp_literal` → `re:<source>` when uninterpolated (TS
`RegularExpressionLiteral` gives the same text, so the sides compare
byte-for-byte); `:args_forward` should set the existing `splat` flag, which
already means arity-unknown.

### The braced-hash split is unpinned on the TS side

`extract-ruby-api.rb` resolves a braced Ruby hash one of two ways: all-keyword-
shaped assocs (`k:` / `:k =>`) → `kwargs{k=<desc>,…}`; string-keyed,
dynamic-keyed and **empty** hashes → opaque `hash`. RFC 0025 §1's table has two
rows that both claim `foo({ a: 1 })`, so the split is undocumented; #6298 broke
the tie toward the TS side because `ts-extractor-emit-call-arguments` specifies
`ObjectLiteralExpression` → `kwargs{…}`.

AC4 pins the descriptor **vocabulary** but not this **semantic**: a TS side that
renders `{}` or `{ [k]: v }` as `kwargs{}` where Ruby renders `hash` passes the
vocabulary pin and mismatches on every such site. Measured at merge time over
activerecord + activesupport + activemodel + actionpack: 697 `kwargs{…}` against
70 surviving opaque `hash`, all of the latter genuinely empty
(`each_with_object({})`) or non-keyword.

## Acceptance criteria

- `:aref`, `:regexp_literal`, `:string_concat` and `:args_forward` have
  descriptors on both extractors; `:args_forward` sets `splat`.
- The keyword-shaped/opaque split is written into RFC 0025 §1 as the tie-break
  between its two competing rows, with the reasoning (TS
  `ObjectLiteralExpression`), and the TS extractor applies the same rule: an
  object literal whose properties are all plain identifier or
  string-literal-identifier keys → `kwargs{…}`; empty or computed-key → `hash`.
- Bare `?` positions over `vendor/rails/activerecord/lib` drop from 239 by at
  least the `:aref` + `:regexp_literal` share (~312 of the 239 positions'
  parent sites become comparable).
- Both changes land in one PR so the `extractor-skew` vocabulary pin never sees
  a one-sided vocabulary.
- No `kind: "args"` row count rises; new rows exposed by newly-comparable sites
  are converged or baselined with a reviewed reason.
