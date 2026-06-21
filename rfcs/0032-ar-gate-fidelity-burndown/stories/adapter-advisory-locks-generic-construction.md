---
title: "Converge advisory_locks enabled test to generic adapter construction"
status: done
updated: 2026-06-21
rfc: "0032-ar-gate-fidelity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 3757
claim: "2026-06-21T00:23:25Z"
assignee: "adapter-advisory-locks-generic-construction"
blocked-by: null
---

## Context

Follow-up to `gate-wrong-gate-body-convergence` (RFC 0032). The
`AdvisoryLocksEnabledTest` "advisory locks enabled?" test in
`packages/activerecord/src/adapter.test.ts` (around line 1484, under
`describeIfMysql`) remains `wrong-gate`: rails `features=[advisory_locks]` /
ts `adapters=[mysql]`. `supports_advisory_locks?` is pg+mysql, but the body
hardcodes `new Mysql2Adapter(...)` and the `advisoryLocks: false/true` config
option. Rails uses `lease_connection` generically.

Convergence needs an adapter-generic construction path: build the active adapter
type (PG or MySQL) with `advisoryLocks: false` / `true`, asserting
`isAdvisoryLocksEnabled()`. Verify the PostgreSQLAdapter honors the
`advisoryLocks` option the same way. Gate with
`itIfSupports("advisory_locks", ...)` (feature-only).

Rails: vendor/rails/activerecord/test/cases/advisory_locks_enabled_test.rb (or
adapter_test advisory-locks coverage).

## Acceptance criteria

- [ ] Rewrite the body to construct the active adapter generically (no hardcoded
      Mysql2Adapter), exercising the `advisoryLocks` option on both pg + mysql.
- [ ] Gate `itIfSupports("advisory_locks")` so the extracted gate is
      `*|advisory_locks`.
- [ ] `test:compare --package activerecord --gates` reports no wrong-gate for
      this test; verify on pg + mysql.
- [ ] Test name unchanged.
