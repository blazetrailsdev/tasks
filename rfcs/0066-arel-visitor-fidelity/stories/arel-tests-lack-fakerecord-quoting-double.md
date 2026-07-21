---
title: "Arel tests lack a FakeRecord quoting double, so Rails' 't'/'f' assertions are unreachable"
status: in-progress
updated: 2026-07-21
rfc: "0066-arel-visitor-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 5037
claim: "2026-07-21T18:55:29Z"
assignee: "arel-tests-lack-fakerecord-quoting-double"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by PR #5031 (insert-manager-inserts-null-false-duplicated-and-diverge).

Rails' Arel test suite asserts boolean literals as `'t'` / `'f'` — e.g.
`vendor/rails/activerecord/test/cases/arel/insert_manager_test.rb:79-86`
expects `INSERT INTO "users" ("bool") VALUES ('f')`.

That rendering comes from neither the abstract adapter nor SQLite. It is
produced by the Arel suite's `FakeRecord` connection double:
`vendor/rails/activerecord/test/cases/arel/support/fake_record.rb:71-87`
(`when true then "'t'"` / `when false then "'f'"`). For comparison,
`abstract/quoting.rb:166-180` gives `TRUE`/`FALSE` and
`sqlite3/quoting.rb:91-97` gives `0`.

trails has no FakeRecord port. `InsertManager#toSql()` renders through the
connection-less default quoter, so `false` becomes `FALSE`. #5031 ported the
test faithfully in every other respect (columns, no `into` call, exact
equality) but had to assert `FALSE`, with the deviation justified at the call
site in `packages/arel/src/insert-manager.test.ts`.

Any Arel test whose expected SQL embeds a quoted boolean, date, or string is
subject to the same gap — this is not confined to the one assertion.

Note the interaction with `eliminate-arel-default-quoters-supply-connection`
(0007, claimed, 400 LOC): that story removes the connection-less quoter and
supplies a real connection. It does not by itself produce FakeRecord's
`'t'`/`'f'`, since no real adapter quotes booleans that way. A FakeRecord-
equivalent test connection is what makes the Rails assertions reachable
verbatim. Sequence this after that story lands, so the test double plugs into
the connection-supplying surface rather than the quoter being deleted.

## Acceptance criteria

- [ ] A FakeRecord-equivalent test connection exists for the arel package,
      mirroring `fake_record.rb:71-87` quoting semantics.
- [ ] `inserts false` in `packages/arel/src/insert-manager.test.ts` asserts
      Rails' exact `VALUES ('f')`, and the call-site deviation comment is
      deleted.
- [ ] Audit remaining arel tests for assertions weakened by the same gap;
      converge those reachable via the double.
- [ ] test:compare delta for arel test files non-negative.
