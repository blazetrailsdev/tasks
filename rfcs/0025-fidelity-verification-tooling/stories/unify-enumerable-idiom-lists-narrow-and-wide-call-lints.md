---
title: "Unify the enumerable-idiom knowledge shared by lint-calls.ts and JS_ENUMERABLE_ALIASES"
status: done
updated: 2026-07-24
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: 25
pr: 5236
claim: "2026-07-24T16:30:53Z"
assignee: "unify-enumerable-idiom-lists-narrow-and-wide-call-lints"
blocked-by: null
closed-reason: null
---

## Context

PR #5182 added `JS_ENUMERABLE_ALIASES` to
`scripts/api-compare/compare.ts` (~line 154) so the wide call ratchet
accepts `some` for `any?`, `filter` for `select`, etc. The narrow lint
already encodes overlapping knowledge independently: the common-call
noise list in `scripts/api-compare/lint-calls.ts` (~line 253) names
`any?` / `all?` / `include?` and friends as ignorable.

Two hand-maintained lists now describe the same Ruby-idiom facts in
different shapes (one "these names are noise", one "these names have a
differently-spelled JS analogue"). They will drift: adding an idiom to
one does not update the other, and the wide table is the one with a
redundancy guard test.

## Acceptance criteria

- The enumerable-idiom knowledge has a single definition that both
  `lint-calls.ts` and `compare.ts` consume (either the noise list is
  derived from `JS_ENUMERABLE_ALIASES.keys()`, or both are derived from
  one shared table — whichever preserves current behaviour).
- Neither the narrow (`pnpm api:calls`, 19 baselined) nor the wide
  (`pnpm api:calls:wide`, 6317 baselined) ratchet changes count.
- The existing redundancy guard test ("lists no alias that
  rubyMethodToTs already produces") still passes.
