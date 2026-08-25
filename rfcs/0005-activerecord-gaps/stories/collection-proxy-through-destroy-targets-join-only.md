---
title: "CollectionProxy#destroy on has_many :through must destroy only join rows, not source records"
status: done
updated: 2026-06-30
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 4309
claim: "2026-06-30T04:24:31Z"
assignee: "collection-proxy-through-destroy-targets-join-only"
blocked-by: null
---

## Context

For `has_many :through`, `CollectionProxy#destroy`/`#destroyAll` in trails
destroys the **source/target** records directly via `record.destroy()`, then
removes the join rows in `_deleteThrough`
(`packages/activerecord/src/associations/collection-proxy.ts`, `destroy`
~line 2598, `destroyAll` ~line 3070).

Rails `:destroy` on a through collection destroys only the **through (join)**
records, leaving the source records in the DB. `HasManyThroughAssociation#delete_records`
runs `scope.destroy_all` where `scope = through_association.scope` is the join
model (e.g. `Reader`), not the source (`Person`)
(`vendor/rails/activerecord/lib/active_record/associations/has_many_through_association.rb:148-163`).
The source record is only removed from the in-memory `@target`.

Confirmed by the Rails test `test_destroy_association`
(`vendor/rails/activerecord/test/cases/associations/has_many_through_associations_test.rb:426-435`):
`assert_no_difference "Person.count"` + `assert_difference "Reader.count", -1`.
trails over-destroys the `Person`, so the ported tests `destroy association`
and `destroy all`
(`packages/activerecord/src/associations/has-many-through-associations.test.ts:715,730`)
are currently `it.skip` with the exact `Person.count` / `Reader.count`
assertions that fail under the current implementation.

This was surfaced while merging the
`collection-proxy-destroy-through-transaction` story (PR #4272), which only
addressed transaction atomicity, not the destroy-target divergence.

## Acceptance criteria

- [ ] For `has_many :through`, `CollectionProxy#destroy`/`#destroyAll` destroys
      only the join (through) records, matching Rails
      `HasManyThroughAssociation#delete_records` (`scope.destroy_all` on the
      through scope); source records remain in the DB.
- [ ] Un-skip `destroy association` and `destroy all` in
      `has-many-through-associations.test.ts` with their existing
      `Person.count` / `Reader.count` assertions intact (no rename).
- [ ] No regression in other through destroy/destroyAll tests.
