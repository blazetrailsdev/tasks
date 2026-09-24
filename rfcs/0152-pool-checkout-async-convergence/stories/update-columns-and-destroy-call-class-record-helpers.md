---
title: "update_columns / destroy_row delegate to the class _update_record / _delete_record instead of inlining them"
status: ready
updated: 2026-09-24
rfc: "0152-pool-checkout-async-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: 80
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' instance write paths delegate to the class-level record helpers:

- `update_columns` (`activerecord/lib/active_record/persistence.rb:~600-630`) calls
  `affected_rows = self.class._update_record(attributes, @primary_key => id_in_database)`
  (`:621`).
- `destroy_row` → `_delete_row` → `self.class._delete_record(_query_constraints_hash)`
  (`persistence.rb:866-872`). `CounterCache#destroy_row` (`counter_cache.rb:210-220`) wraps it via `super`.
- `_update_record` / `_delete_record` (`persistence.rb:263-297`) build the manager and run it inside
  `with_connection do |c| c.update/delete(…, "#{self} Update"/"#{self} Destroy") end`.

trails already ports the class helpers faithfully (`packages/activerecord/src/persistence.ts:230`,
`:253`, `klass.withConnection((c) => c.update/delete(...))`). But the instance paths inline their
own copies:

- `updateColumns` (`persistence.ts`, the `affectedRows = await (ctor …).withConnection((c) =>
c.update(um, "Update Columns"))` block near `:688`) builds its own `UpdateManager` and passes the
  query name `"Update Columns"` where Rails' `_update_record` passes `"#{self} Update"`.
- The destroy path in `base.ts` (the `ctor.withConnection((c) => c.delete(dm, …Destroy))` block near
  `:2037`) builds its own `DeleteManager`, lock-column constraint included, instead of
  `destroyRow` → `_deleteRow` → `ctor._deleteRecord(_queryConstraintsHash)`.

trails#8021 moved both inline copies onto `with_connection`, but the decomposition still diverges.

## Acceptance criteria

- `updateColumns` calls `ctor._updateRecord(attributes, { [primaryKey]: idInDatabase })` as
  `persistence.rb:621` does, and the inlined manager build is deleted.
- Destroy goes `destroyRow` → `_deleteRow` → `ctor._deleteRecord(_queryConstraintsHash())` per
  `persistence.rb:866-872`, with the locking constraint coming from `Locking::Optimistic#_query_constraints_hash`
  / `destroy_row` (`locking/optimistic.rb`) rather than inline.
- `persistence.test.ts`, `locking.test.ts` and `counter-cache.test.ts` stay green on sqlite, PG and MySQL.
