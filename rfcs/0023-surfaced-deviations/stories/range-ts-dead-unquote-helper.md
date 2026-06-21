---
title: "Dead @internal unquote() helper in oid/range.ts has no callers"
status: claimed
updated: 2026-06-21
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 5
priority: null
pr: null
claim: "2026-06-21T23:11:02Z"
assignee: "range-ts-dead-unquote-helper"
blocked-by: null
---

## Context

`packages/activerecord/src/connection-adapters/postgresql/oid/range.ts:238`
defines an `@internal` `unquote(value)` helper that just delegates to
`unquoteRangeBound`. It mirrors Rails' `unquote`
(activerecord/.../postgresql/oid/range.rb) but has **no callers** anywhere in
`packages/` — `git grep -nw unquote` over the tree returns only this definition
plus an unrelated local `unquote` inside
`connection-adapters/mysql/schema-statements.ts:665`. It survived ESLint
because the rule set does not flag unused `@internal` module functions.

Surfaced while removing the trails-only multirange extension (PR #3779); the
multirange parser did not use it either, so it was already dead before that PR.

## Acceptance criteria

- [ ] Determine where Rails' `unquote` is actually invoked
      (`OID::Range#extract_bounds` / bound parsing) and wire trails' `unquote`
      into the matching call site, OR remove the dead helper if the live path
      already routes through `unquoteRangeBound` directly.
- [ ] `git grep -nw unquote` over `packages/activerecord/src/connection-adapters/postgresql/oid/`
      shows no orphaned definition.
- [ ] PG range parsing tests stay green.
