---
title: "resetTables clears the whole schema cache where Rails' drop_table clears per table, and cites the wrong schema_statements.rb line"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
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
closed-reason: "Not Rails-convergent: resetTables lives in src/support/drop-all-tables.ts, trails-only test infrastructure with no Rails counterpart (and outside both compare populations). Tuning its cache-clear granularity and fixing a JSDoc line cite converges nothing in the port."
---

## Context

PR #6261 (`migration-collaborator-call-sites-pass-a-pool`) added a schema-cache
clear to `resetTables` (`support/drop-all-tables.ts:151-178`). It was needed:
once `InternalMetadata` holds a pool, `#tableExists` reads
`@pool.schema_cache.data_source_exists?` (`internal_metadata.rb:108-110`)
instead of the removed seam's live-connection stand-in, and the reset's raw
`DROP TABLE` statements left the cache claiming a dropped
`ar_internal_metadata` still existed — the next read then raised on the missing
table.

Two things about that patch are wrong or coarser than Rails, both cheap to fix
and both now shipped:

1. **The Rails citation is wrong.** The JSDoc on `resetTables` cites
   `abstract/schema_statements.rb:485` as `drop_table`. Line 485 is a doc
   comment inside `change_table`'s rdoc. The real method is
   **`schema_statements.rb:540-545`**:

   ```ruby
   def drop_table(*table_names, **options)
     table_names.each do |table_name|
       schema_cache.clear_data_source_cache!(table_name.to_s)
       execute "DROP TABLE#{' IF EXISTS' if options[:if_exists]} #{quote_table_name(table_name)}"
     end
   end
   ```

   The same wrong line rode into PR #6261's description and its review parity
   map, so a later reader chasing it lands on prose.

2. **The clear is coarser than Rails'.** Rails clears **per table name**
   (`clear_data_source_cache!(table_name.to_s)`, `:542`), which is also what our
   own `SchemaStatements#dropTable` does
   (`abstract/schema-statements.ts:486`). `resetTables` instead calls
   `adapter.schemaCache.clearBang()`, dropping columns, primary keys and
   version alongside the data-source entries for every table in the database,
   not just the ones it dropped. Nothing depends on the extra breadth.

## Converged shape

- Fix the citation to `abstract/schema_statements.rb:540-545`.
- Clear per dropped table name, as Rails and our own `dropTable` do, rather
  than `clearBang()` over the whole cache. The reset arms already know which
  names they drop (`resetSqliteTables` / `resetPgTables` / `resetMysqlTables`),
  so the names are in hand at the drop site.
- Better still where it is cheap: route the drops through
  `SchemaStatements#dropTable` so the cache clear is not a separate thing a
  caller has to remember. The arms use raw DDL for batching/FK-ordering
  reasons — if that survives scrutiny, keep raw DDL and clear per name.

## Acceptance criteria

- [ ] No reference to `schema_statements.rb:485` remains for `drop_table`;
      the cite is `:540-545`.
- [ ] The reset clears per dropped table name, not the whole cache.
- [ ] `template-stamp.test.ts`'s "boot fast path stamp" case (the one that
      caught the staleness) stays green — it drops `ar_internal_metadata` via
      `resetTestTables` and then reads `canonicalSchemaUpToDate`.
