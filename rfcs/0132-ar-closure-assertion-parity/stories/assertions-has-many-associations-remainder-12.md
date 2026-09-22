---
title: "assertions-has-many-associations-remainder-12"
status: draft
updated: 2026-09-22
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Eleventh slice of `assertions-has-many-associations-remainder`. `assertions-has-many-associations-remainder-11` landed the `has-many-assertions-remainder-11-wip` branch (22 ports, 1 parked) plus the `find one message on primary key` (`assertRaises`) and `collection proxy respects default scope` (`toBeFalsy`) rows of `packages/activerecord/src/associations/has-many-associations.test.ts`; it stopped at the 700 LOC ceiling.

Measure: `pnpm parity:test -- --package activerecord --assertions --missing | grep has_many_associations_test` (28 rows at hand-off).

Still unported (vendor/rails/activerecord/test/cases/associations/has_many_associations_test.rb):

- composite primary key malformed association class / owner class (rb:3218/3230): port as `assertRaises([CompositePrimaryKeyMismatchError], {}, async () => { const order = CpkBrokenOrder.new({ id: [1, 2], books: [CpkBook.new({ title: "Some book" })] }); await order.saveBang(); })` — verified passing locally, only dropped for LOC.
- calling none/one/many should defer to collection if using a block (rb:2377/2417/2461): `assert_not_called(firm.clients, :size)` via `assertNotCalled` from `activesupport/src/testing/method-call-assertions.ts`.
- async load has many (rb:3262): Notifications event count plus `payload[:async]`.
- passes custom context validation to validate children (rb:2890).
- destroy does not raise / destroy with bang bubbles errors (rb:3114/3122): use canonical `AuthorWithErrorDestroyingAssociation` / `PostWithErrorDestroying` (test/models/author.rb).
- restrict with error with locale (rb:2004), calling empty rows (rb:3068-3096), key-validation rows, create, has many association with same foreign key name, get ids for new record, adding array and collection, three levels of dependence, deleting self type mismatch, deleting by integer id.

Known blockers: rb:2506 transaction proxy; rb:1764 (`has-many-delete-nullify-out-of-scope`); multi-extension (`collection-proxy-extend-super-chain`); rb:3154 parked on `after-rollback-on-create-skipped-for-rollback-raised-in-after-save`.

## Acceptance criteria

- 0 assertion count/kind/value mismatches for the file, or a converged slice plus a re-filed remainder.
- Parked tests use `it.skip` with a `BLOCKED:` line.
