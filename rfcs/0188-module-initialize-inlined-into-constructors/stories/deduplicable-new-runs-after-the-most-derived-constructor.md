---
title: "deduplicable-new-runs-after-the-most-derived-constructor"
status: claimed
updated: 2026-10-20
rfc: "0188-module-initialize-inlined-into-constructors"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-10-20T13:59:21Z"
assignee: "base-constructor-passes-raw-attributes-to-assign-attributes"
blocked-by: null
closed-reason: null
---

## Context

`Deduplicable::ClassMethods#new` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/deduplicable.rb:13-15`) is `super.deduplicate`: it runs after the whole `initialize` chain of the class `new` was called on, so `PostgreSQL::Column.new` dedups a fully built PostgreSQL column. Every class under `Column` / `SqlTypeMetadata` inherits it.

trails writes it at the tail of each includer's constructor (`packages/activerecord/src/connection-adapters/column.ts`, `sql-type-metadata.ts`, `{mysql,postgresql}/type-metadata.ts`) and of each subclass's constructor (`NullColumn`, `{mysql,postgresql,sqlite3}/column.ts`), each guarded `if (new.target === X) return this.deduplicate();` so only the most-derived constructor dedups — a base constructor that froze the instance would make the subclass's own assignments throw. `MySQL::Column` (`mysql/column.rb`) has no `initialize`, so it gained a constructor that exists only to carry the guard; it is receipted `@noRailsEquivalent CONVERGEABLE` against this story.

## Acceptance criteria

- Either a shape is found that dedups after the most-derived constructor without a constructor on `MySQL::Column`, and the receipt is deleted; or the repo owner rules the `new.target` tail a language shortcoming in CLAUDE.md and the receipt becomes `PERMANENT`.
