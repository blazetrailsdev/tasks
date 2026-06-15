---
title: "unscope accepts leftJoins alias"
status: in-progress
updated: 2026-06-15
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: 3420
claim: "2026-06-15T23:28:27Z"
assignee: "b2-unscope-leftjoins-alias"
blocked-by: null
---

## Context

Surfaced by RFC 0030 story b2-default-scoping. Rails `test_unscope_left_joins`
is ported but skipped ("unscope left joins") in
`packages/activerecord/src/scoping/default-scoping.test.ts`.

`unscope("leftJoins")` (Rails' `:left_joins`, the alias for `:left_outer_joins`)
is rejected by the valid-unscope-key check in
`packages/activerecord/src/relation/query-methods.ts` — it lists `leftOuterJoins`
but not the `leftJoins` alias.

## Acceptance criteria

- [ ] `unscope("leftJoins", ...)` is accepted and unscopes the left-outer-joins clause.
- [ ] Un-skip "unscope left joins" in default-scoping.test.ts; it passes on sqlite.
