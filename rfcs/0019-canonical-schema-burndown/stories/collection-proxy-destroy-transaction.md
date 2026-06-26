---
title: "CollectionProxy#destroy: wrap batch in transaction (Rails delete_or_destroy parity)"
status: ready
updated: 2026-06-26
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: 40
priority: 89
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`CollectionProxy#destroy(...records)` in
`packages/activerecord/src/associations/collection-proxy.ts` (~line 2468) runs
its per-record `record.destroy()` loop WITHOUT a transaction. Rails
`CollectionAssociation#delete_or_destroy`
(vendor/rails/activerecord/lib/active_record/associations/collection_association.rb:385)
wraps `remove_records` in `transaction { ... }` whenever any record is
persisted, so a `before_destroy` that raises (or throws `:abort`) mid-batch
rolls back the whole batch. trails' `#delete` already has this wrapper
(`persistedRecords.length > 0` → `this.transaction(...)`); `#destroy` does not,
leaving a partial delete.

Discovered while converging
`associations/has-many-associations.test.ts` (RFC 0019). The faithful test
`transaction when deleting persisted` (Rails test_transaction_when_deleting_persisted,
Client `raiseOnDestroy`) is currently `it.skip` pending this fix.

A validated fix exists: wrap the loop in `this.transaction(run)` when
`records.some(r => !r.isNewRecord())`, mirroring `#delete`.

## Acceptance criteria

- [ ] `CollectionProxy#destroy` wraps the destroy batch in a transaction when
      any target record is persisted, matching Rails delete_or_destroy.
- [ ] A mid-batch raise rolls back already-destroyed records in the same batch.
- [ ] No regression in existing collection-proxy / association tests.
