---
title: "collection-proxy-concat-returns-false-on-failed-insert"
status: done
updated: 2026-07-25
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5279
claim: "2026-07-25T01:02:57Z"
assignee: "collection-proxy-concat-returns-false-on-failed-insert"
blocked-by: null
closed-reason: null
---

## Context

Rails' `CollectionProxy#concat` / `#<<` returns `false` when a child fails to
insert on a persisted owner. `CollectionAssociation#concat` delegates to
`concat_records`
(`vendor/rails/activerecord/lib/active_record/associations/collection_association.rb`),
which accumulates `result &&= insert_record(rec, true, raise)` across the
records and returns `result && records` — so the whole call is falsy as soon as
one insert fails.

trails' `CollectionProxy#push` (`collection-proxy.ts:1993`) and `#concat`
(`:2542`, a straight delegate to `push`) both return
`Promise<Omit<this, "then">>` unconditionally — the proxy, which is always
truthy. The per-record insert result is discarded.

This was found while converging
`TestDefaultAutosaveAssociationOnAHasManyAssociation` to canonical
`Firm`/`Client` (#5278). Rails' `test_invalid_adding`
(`vendor/rails/activerecord/test/cases/autosave_association_test.rb:819`) opens
with `assert_not (firm.clients_of_firm << c = Client.new)` and
`test_invalid_adding_before_save` (`:829`) uses `concat` the same way. Neither
assertion could be ported, because there is no falsy value to assert on; the
converged bodies assert only the observable side effects
(`c.isPersisted()` false, `firm.isValid()` false, `firm.save()` false).

## Acceptance criteria

- `CollectionProxy#push` / `#concat` thread the per-record `insertRecord`
  result the way `concat_records` does, returning a falsy value when any
  insert fails on a persisted owner and the proxy otherwise.
- Read `concat_records` and `insert_record` in the vendored Rails first,
  including the `raise` arm — `concat` passes `raise = false`, so the failure
  is reported by return value, not by raising.
- Audit existing `push` / `concat` callers (both in `activerecord/src` and the
  test suite) for ones that rely on the always-truthy proxy return, and for
  chained usage that would break on a falsy return.
- Restore the dropped return-value assertions in
  `autosave-association.test.ts`'s `invalid adding` and
  `invalid adding before save` so they match Rails line-for-line.
