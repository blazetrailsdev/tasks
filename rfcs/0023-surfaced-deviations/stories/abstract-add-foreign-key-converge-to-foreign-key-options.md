---
title: "abstract-add-foreign-key-converge-to-foreign-key-options"
status: done
updated: 2026-06-21
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 3803
claim: "2026-06-21T16:06:43Z"
assignee: "abstract-add-foreign-key-converge-to-foreign-key-options"
blocked-by: null
---

## Context

The abstract `SchemaStatements.addForeignKey`
(packages/activerecord/src/connection-adapters/abstract/schema-statements.ts:649-665)
does NOT mirror Rails' abstract `add_foreign_key`
(vendor/rails/activerecord/lib/active*record/connection_adapters/abstract/schema_statements.rb).
Rails runs `options = foreign_key_options(...)` then
`at = create_alter_table; at.add_foreign_key; execute schema_creation.accept(at)`.
The trails port instead hand-defaults the name as `fk*${fromTable}_${column}`and builds`ALTER TABLE ... ADD ${schema*creation.accept(fkDef)}`directly,
bypassing`foreignKeyOptions`/`foreignKeyName`(SHA256`fk_rails*<hex>`).

MySQL2 does NOT override `addForeignKey`, so it inherits this deviating body —
its default FK constraint names are `fk_<table>_<col>` instead of Rails'
`fk_rails_<sha256[0,10]>`. PG and SQLite override `addForeignKey` and are
unaffected. PR #3800 converged PG to the canonical foreignKeyOptions path but
could not call trails' `super` because (a) the abstract body deviates and
(b) the self-delegation guard at schema-statements.ts:641-648 would recurse
(adapter.addForeignKey !== prototype). Both should be fixed here so PG can
collapse to Rails' literal `assert_valid_deferrable(deferrable); super`.

## Acceptance criteria

- [ ] Abstract `addForeignKey` mirrors Rails: `foreignKeyOptions` +
      `createAlterTable` + `addForeignKey(fkDef)` + `schemaCreation.accept(at)`,
      so the default name is the SHA256 `fk_rails_<hex>` for all adapters.
- [ ] MySQL2 FK default-name tests match Rails (`fk_rails_<hex>`).
- [ ] Resolve the self-delegation guard so PG/SQLite overrides that call `super`
      do not recurse; PG `addForeignKey` reduces to `assertValidDeferrable; super`.
- [ ] api:compare and test:compare delta non-negative; no test-name changes.
