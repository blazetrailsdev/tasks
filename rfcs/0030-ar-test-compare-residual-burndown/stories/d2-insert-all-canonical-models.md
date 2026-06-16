---
title: "insert-all.test.ts: migrate to canonical models + fixtures"
status: in-progress
updated: 2026-06-16
rfc: "0030-ar-test-compare-residual-burndown"
cluster: persistence
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 3446
claim: "2026-06-16T11:53:00Z"
assignee: "d2-insert-all-canonical-models"
blocked-by: null
---

## Context

Follow-up from d2-insert-all-on-duplicate (RFC 0030). `insert-all.test.ts` uses
bespoke `makeBook`/`makeShip` models + `defineSchema`, not the canonical
Book/Author/Ship/Speedometer/Subscriber models + fixtures Rails' insert_all_test.rb
relies on. Several remaining `it.skip` tests need real associations
(has_many_through) and the Speedometer no-DB-unique-key setup that only exist in
the canonical models.

Blocks these `it.skip` tests in `packages/activerecord/src/insert-all.test.ts`:

- insert all has many through
- upsert all has many through
- upsert all does notupdates existing record by when there is no key
- upsert all works with partitioned indexes (PG; also needs Measurement model)

Also reclassify the two non-Rails stub names ("insert! raises for invalid
records", "insert_all does not include readonly attributes") — neither maps to
an upstream test; Rails' insert! does not validate and readonly only filters the
ON CONFLICT update set, not the INSERT column list.

## Acceptance criteria

- [x] insert-all.test.ts migrated to canonical models + useHandlerFixtures.
- [x] has_many_through insert_all/upsert_all raise ArgumentError (Rails parity).
- [x] Non-Rails stub names removed or converted to the real Rails assertions.
