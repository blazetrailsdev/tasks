---
title: "test: regression coverage for CollectionProxy#delete nullify transaction rollback"
status: claimed
updated: 2026-06-20
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: "2026-06-20T18:37:28Z"
assignee: "hm-collection-proxy-delete-transaction-rollback-test"
blocked-by: null
---

## Context

PR #3730 (`hm-collection-proxy-delete-missing-transaction`) made `CollectionProxy#delete` (non-through nullify path) wrap the Rails `remove_records` sequence — `before_remove` → `updateAll` → target removal → `after_remove` — in a transaction when persisted records exist, matching `CollectionAssociation#delete_or_destroy` (collection_association.rb:385-397). No regression test was added because:

- Test names must match a Rails test verbatim (`test:compare` matches by name) and there is no Rails test covering the `delete`/nullify + transaction case (`test_transaction_when_deleting_persisted`/`_new_record` in has_many_associations_test.rb cover `destroy`, a different path).
- The natural test homes — `packages/activerecord/src/associations/callbacks.test.ts` and `collection-proxy.test.ts` — are grandfathered in `eslint/require-canonical-schema-exclude.json`, and CLAUDE.md requires converting a grandfathered file to canonical (dropping its exclude entry) in the same PR that touches it (RFC 0019 scope).

The atomicity guarantee is currently enforced structurally (mirroring `delete_or_destroy`) and the existing `before_remove`-abort tests (callbacks.test.ts:497,507) exercise the refactored halt path, but there is no direct test that a raising `after_remove` rolls back the nullify `updateAll`.

## Acceptance criteria

- [ ] Convert `collection-proxy.test.ts` (and/or `callbacks.test.ts`) to canonical schema + models and drop its `require-canonical-schema-exclude.json` entry, per RFC 0019.
- [ ] Add a regression test, using a Rails-verbatim test name where one exists, asserting that a raising `after_remove` callback on `CollectionProxy#delete` rolls back the DB nullify `updateAll` (the child FK remains set after the failed delete).
- [ ] New-record-only deletes assert no transaction is opened.

## Dependencies

Gated on the RFC 0019 canonical conversion of these association test files.
