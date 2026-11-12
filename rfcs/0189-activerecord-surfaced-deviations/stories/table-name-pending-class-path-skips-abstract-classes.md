---
title: "tableName's pending-class-path arm computes a table name for abstract classes"
status: draft
updated: 2026-11-12
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ModelSchema.tableName` (`packages/activerecord/lib/model-schema.ts:586`) answers `computeTableName` whenever `isClassPathPending(this)`, and it does so for abstract classes too. Rails' `table_name` (`vendor/rails/v8.0.2/activerecord/lib/active_record/model_schema.rb`, `reset_table_name`) answers `nil` for an abstract class (`if abstract_class? ... superclass == Base ? nil : superclass.table_name`).

`isClassPathPending` matches on the short class name. Booting the actionmailbox dummy app, while `ActionMailbox::Record` was pending, also matched the abstract `ActiveStorage::Record`. That class got the table name `prefix_active_storage_records_suffix`, and `ActiveStorage::Blob` inherited it (`MissingAttributeError key`). A local fix was `if (isClassPathPending(this) && !this.isAbstractClass()) return computeTableName.call(this);`.

## Acceptance criteria

- An abstract class never answers a computed table name through the pending-class-path arm, matching `reset_table_name`'s abstract branch.
- `isClassPathPending` no longer matches a class whose full path differs and only shares the short name.
- A regression test, verified to fail on main, covers an abstract `Record` subclass whose short name collides with a pending class path.
