---
title: "Migration#isIndexExists/removeIndex forward valid/ifExists to adapter"
status: in-progress
updated: 2026-07-09
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 25
priority: 200
pr: 4818
claim: "2026-07-09T02:49:37Z"
assignee: "migration-index-methods-forward-valid-and-ifexists"
blocked-by: null
closed-reason: null
---

## Context

Follow-up from PR #4774 (collapse-migrationcontext-introspection-onto-adapter-remaining).
That PR widened the `MigrationContext` index reader/DDL option surfaces to Rails
parity but left the sibling `Migration`-class twins narrowed:

- `Migration#isIndexExists` (`packages/activerecord/src/migration.ts:1213`)
  types `options?: { unique?; name? }`, dropping Rails' `index_exists?`
  `**options` → `IndexDefinition#defined_for?`, including the documented
  `valid: true/false` PostgreSQL path
  (`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:99-103`).
  The adapter `SchemaStatements#indexExists` already forwards `valid`
  (`connection-adapters/abstract/schema-statements.ts:1486`), and
  `MigrationContext#indexExists` was widened to `{ unique, name, valid }` in
  #4774 — `Migration#isIndexExists` should match.

- `Migration#removeIndex` (`packages/activerecord/src/migration.ts:534`) types
  `options: { column?; name? }`, dropping Rails' `remove_index`'s `if_exists`
  guard (`schema_statements.rb:966-967`:
  `return if options[:if_exists] && !index_exists?`). Every adapter
  `removeIndex` override already accepts `ifExists`, and
  `MigrationContext#removeIndex` was widened to `{ column, name, ifExists }` in
  #4774 — `Migration#removeIndex` should match.

Both are one-line option-type widenings that forward to the already-capable
adapter, bringing the `Migration` class to parity with its `MigrationContext`
twin and the adapter.

## Acceptance criteria

- [ ] `Migration#isIndexExists` accepts and forwards `valid` (full
      `defined_for?` option surface).
- [ ] `Migration#removeIndex` accepts and forwards `ifExists`.
- [ ] Ported/added coverage exercising the `valid` and `ifExists` paths.
- [ ] Test names match Rails verbatim.
