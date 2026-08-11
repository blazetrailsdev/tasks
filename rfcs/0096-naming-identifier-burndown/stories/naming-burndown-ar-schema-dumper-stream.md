---
title: "naming-burndown-ar-schema-dumper-stream"
status: done
updated: 2026-08-11
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6369
claim: "2026-08-11T16:36:38Z"
assignee: "naming-burndown-ar-schema-dumper-stream"
blocked-by: null
closed-reason: null
---

## Context

Continuation of `naming-burndown-activerecord-rest-3` (RFC 0096). That PR
converged the renamable locals in `associations/collection-association.ts`,
`schema-dumper.ts`, `relation/batches.ts`, `relation/query-methods.ts` and
`tasks/database-tasks.ts` (activerecord `naming` rows 281 -> 267) and stopped
at the two rows in `schema-dumper.ts` that need a file-wide rename rather than
a local one.

Rails' `SchemaDumper` writes into an IO (`schema_dumper.rb:134` `def
tables(stream)`, `:158` `def table(table, stream)`, `:244`
`indexes_in_create(table, stream)`, `:283`
`check_constraints_in_create(table, stream)`). The trails port accumulates into
a `string[]` named `lines` in every one of those signatures, so every call site
describes as `(…, ref:lines)` where Rails describes `(…, ref:stream)`.

Rows still open in `output/call-arg-mismatches.json` (`class === "naming"`,
`package === "activerecord"`, `tsFile === "schema-dumper.ts"`):

- `tables` -> `table`: Rails `(ref:tableName, ref:stream)` vs trails
  `(ref:table, ref:lines)`
- `tables` -> `foreign_keys`: Rails `(ref:tbl, ref:foreignKeysStream)` vs
  trails `(ref:tableName, ref:lines)` — Rails runs a _second_ loop over
  `not_ignored_tables` binding `tbl`, into a separate `foreign_keys_stream`
  StringIO (`schema_dumper.rb:144-155`); trails folds both into the single
  `tableName` loop, so this is a decomposition row as well as a naming one.

## Acceptance criteria

1. The `stream`-shaped parameter is spelled `stream` at every site
   `schema_dumper.rb` spells it `stream`, in `schema-dumper.ts` and in the
   subclass overrides (`connection-adapters/abstract/schema-dumper.ts`,
   `connection-adapters/sqlite3/schema-dumper.ts`, PG/MySQL dumpers).
2. `tables` splits the foreign-key dump into its own loop with its own
   accumulator named `foreignKeysStream`, binding `tbl`, per
   `schema_dumper.rb:144-155`.
3. Both rows leave the `naming` report; no behaviour change; dumped schema
   output byte-identical (`schema-dumper.test.ts` green).
