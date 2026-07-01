---
title: "Run failed-rollback transaction-instrumentation tests on PG/MySQL lanes"
status: ready
updated: 2026-07-01
rfc: "0057-transaction-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`packages/activerecord/src/transaction-instrumentation.test.ts` (PR #4358)
pins its own dedicated in-memory `BetterSQLite3Adapter(":memory:")` for the
whole suite (see the file-header comment on `freshIsolatedAdapter`), rather
than routing through the CI-selected adapter. As a consequence the two
`unless in_memory_db?`-gated cases —
`test_transaction_instrumentation_on_failed_rollback` and
`..._when_unmaterialized`
(`vendor/rails/activerecord/test/cases/transaction_instrumentation_test.rb:390-417`)
— are permanently `it.skip`ped in trails. In Rails those tests DO run on
non-in-memory databases (PG/MySQL), exercising the failed-`rollback_db_transaction`
/ failed `rollback_transaction` → `throw_away!` path and asserting the
`:incomplete` outcome payload (materialized) and no-notification (unmaterialized).

trails has no coverage of that path on the PG/MySQL CI lanes. The prior active
port of the unmaterialized case used an isolated throwaway `:memory:` adapter as
a workaround, but that was removed to honor the `unless in_memory_db?` gate
faithfully (Codex review on #4358).

## Acceptance criteria

- [ ] Run `test_transaction_instrumentation_on_failed_rollback` and
      `..._when_unmaterialized` against the CI-selected non-in-memory adapters
      (PG/MySQL lanes), mirroring Rails' `unless in_memory_db?` gate — skip only
      when the adapter is genuinely in-memory.
- [ ] Assert the `:incomplete` outcome payload (materialized) and
      no-notification / connection-discarded behavior (unmaterialized).
- [ ] Do not regress the sqlite in-memory lane (stays skipped there).
- [ ] Test names remain verbatim mirrors of the Rails methods.
