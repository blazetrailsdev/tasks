---
title: "fix-with-connection-production-violations"
status: done
updated: 2026-07-25
rfc: "0071-ar-test-helper-suite-wide-config-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 5323
claim: "2026-07-25T21:26:51Z"
assignee: "fix-with-connection-production-violations"
blocked-by: null
closed-reason: null
---

## Context

Found by `audit-permanent-connection-checkout-disallowed` (PR #5318,
`docs/infrastructure/permanent-connection-checkout-disallowed-audit.md`).

Rails bans `Base.connection` in its test suite (`test/cases/helper.rb:27`)
specifically "to ensure it's not used internally". Instrumenting that gate in
trails surfaced **two production call sites where Rails wraps in
`with_connection` and trails reads the deprecated getter**. Both can flip the
lease permanent on a caller that never asked for one. Neither was known before
the audit — note that the `Base\.connection` grep that scoped the audit story
cannot see them, since they spell it `this.connection` / `model.connection`.

1. `packages/activerecord/src/core.ts:1147` (`cachedFindBy`) —
   `const connection = (this as any).connection;`
   Rails `core.rb:441-443` wraps the whole body in
   `with_connection do |connection|`.

2. `packages/activerecord/src/insert-all.ts:76` (`InsertAll.execute`) —
   `new InsertAll(relation, model.connection, inserts, options)`
   Rails `insert_all.rb:11-13` wraps in
   `relation.model.with_connection do |c|`.

Also in scope, the same shape in test infrastructure (finding 3):
`test-setup-dy.ts:50,65` (violates at boot — with the raise intact every AR file
fails at _collection_; both sit in `await`-capable module scope so
`await Base.leaseConnection()` substitutes directly),
`test-helpers/setup-second-pool.ts:51,79`, and
`encryption/test-helpers.ts:161` (not hit in the audit run, same shape).

## Acceptance criteria

- `core.ts:1147` and `insert-all.ts:76` route through `withConnection`, matching
  `core.rb:441-443` and `insert_all.rb:11-13`.
- The five test-infrastructure sites above lease explicitly instead of reading
  the getter.
- `model-schema.ts:41` (`reflectionAdapter`) is **explicitly out of scope** — its
  `?? klass.connection` fallback is load-bearing for `try`/`catch` callers per
  its own JSDoc, and needs its own story.
- Existing tests stay green; no new tests strictly required, but a regression
  test that fails on baseline is preferred for the two production sites.

Blocks `flip-permanent-connection-checkout-disallowed`.
