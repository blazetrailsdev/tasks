---
title: "serialized-await-covers-join-eager-load-and-sync-load"
status: in-progress
updated: 2026-11-17
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10276
claim: "2026-11-17T23:31:31Z"
assignee: "serialized-await-covers-join-eager-load-and-sync-load"
blocked-by: null
closed-reason: null
---

## Context

trails#10276 added `_loadSerializedAttributes` (`packages/activerecord/lib/type/serialized.ts`), which awaits a serialized attribute whose coder's `load` answers a promise (ActionText's `Content`) and seats the value. It runs on the top-level records in `Relation#execQueries`, in `findBySql` / `asyncFindBySql`, and after `changes_applied`. Two record-building paths are not covered:

- **JOIN eager loading.** `includes(...).references(...)` / `eagerLoad` instantiates association targets in `JoinDependency#instantiate` (`packages/activerecord/lib/associations/join-dependency.ts:260-330`, Rails `vendor/rails/v8.0.2/activerecord/lib/active_record/associations/join_dependency.rb`). `execQueries` awaits only the parent records, so a `RichText` reached through a JOIN keeps a promise-valued `body`.
- **The synchronous load in a non-joinable transaction.** `relation.ts:527`'s `this.loadRecords(this.instantiateRecords(result))` builds records with no awaited step.

## Acceptance criteria

- [ ] Records instantiated by `JoinDependency#instantiate`, association targets included, are awaited through `_loadSerializedAttributes` before `execQueries` returns.
- [ ] The `relation.ts:527` path awaits them too, or routes them through the awaited path.
- [ ] activerecord tests: an async-coder attribute on a JOIN-eager-loaded association, and on the transaction load path.
