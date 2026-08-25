---
title: "Burn down the 26 naming call-argument rows in the activerecord connection adapters (pg, mysql, abstract, pg OID types)"
status: done
updated: 2026-08-14
rfc: "0096-naming-identifier-burndown"
cluster: api-compare
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 104
pr: 6513
claim: "2026-08-14T11:47:18Z"
assignee: "naming-burndown-3-activesupport"
blocked-by: null
closed-reason: null
---

## Context

RFC 0096 wave 3. Measured on `origin/main` at **059bfe688** (2026-08-12) with
`API_COMPARE_ALLOW_STALE_BUILD=1 API_COMPARE_FORCE=1 pnpm parity:api --calls`
followed by `API_COMPARE_ALLOW_STALE_BUILD=1 pnpm parity:api:calls:args:report`
(the freshness guard reports `OutOfDateWithSelf` for activerecord/activesupport
after a clean `pnpm build`, so the stale-build escape hatch is required; the
artifact is `scripts/api-compare/output/call-arg-mismatches.json`).

That run reports **344 `naming` rows** repo-wide. Only **167** are in RFC 0096's
scope — the RFC's `## Scope` section dropped actiondispatch (81), rack (39),
actionview (30) and actioncontroller (27), which are 177 of the 344. Wave 3 cuts
those 167 into six slots; this is the connection-adapters slot: **26 rows across
11 files**.

| Rows | File                                                                                   |
| ---: | -------------------------------------------------------------------------------------- |
|   10 | `packages/activerecord/src/connection-adapters/postgresql-adapter.ts`                  |
|    3 | `packages/activerecord/src/connection-adapters/abstract-adapter.ts`                    |
|    2 | `packages/activerecord/src/connection-adapters/mysql/schema-statements.ts`             |
|    2 | `packages/activerecord/src/connection-adapters/postgresql/oid/array.ts`                |
|    2 | `packages/activerecord/src/connection-adapters/postgresql/oid/range.ts`                |
|    2 | `packages/activerecord/src/connection-adapters/postgresql/oid/type-map-initializer.ts` |
|    1 | `packages/activerecord/src/connection-adapters/abstract-mysql-adapter.ts`              |
|    1 | `packages/activerecord/src/connection-adapters/abstract/transaction.ts`                |
|    1 | `packages/activerecord/src/connection-adapters/pool-config.ts`                         |
|    1 | `packages/activerecord/src/connection-adapters/postgresql/database-statements.ts`      |
|    1 | `packages/activerecord/src/connection-adapters/postgresql/oid/point.ts`                |

Three of the ten `postgresql-adapter.ts` rows are the same TS call site matched
twice, once against `postgresql_adapter.rb` and once against
`postgresql/schema_statements.rb` — 23 distinct call sites, 26 rows. Fixing one
site retires both of its rows.

### Representative rows, with both sides

- **`renameTable`** —
  `packages/activerecord/src/connection-adapters/postgresql-adapter.ts:3592`
  names the local `renamedName` and calls
  `this.pkAndSequenceFor(renamedName)` at `:3595`. Rails
  (`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/schema_statements.rb:440`)
  is `pk, seq = pk_and_sequence_for(new_name)` — the identifier is `new_name`.
- **`removeIndex`** —
  `postgresql-adapter.ts:3680` builds `resolveOpts` and passes it to
  `indexExists` (`:3693`) and `indexNameForRemove` (`:3702`). Rails
  (`postgresql/schema_statements.rb:559`) passes `options` straight through:
  `index_name_for_remove(table.to_s, column_name, options)`.
- **`unpreparedStatement`** —
  `abstract-adapter.ts` passes `this` to `add?`; Rails
  (`connection_adapters/abstract_adapter.rb:345`) passes `object_id`
  (`prepared_statements_disabled_cache.add?(object_id)`). Same at the `delete`
  on `:348`.
- **`indexes`** (mysql) —
  `connection-adapters/mysql/schema-statements.ts:142` names the local
  `quotedColumns` and passes it at `:145`. Rails
  (`connection_adapters/mysql/schema_statements.rb:58-63`) names that local
  `columns` and only the _parameter_ of `add_options_for_index_columns`
  (`:236`) is `quoted_columns`. This is the reverse of the usual direction —
  rename the TS local to `columns`, not the parameter.
- **`newColumnFromField`** — TS passes `createTableInfoFn` where Rails passes
  `table_name` (`mysql/schema_statements.rb`, `default_type(table_name, field_name)`).
  This one is a3, not a rename: trails threads a lazily-invoked function where
  Rails threads the name. File it, don't rename it.

### Tooling residue in this slot

Sampled all 26: **~5 are the tooling shapes RFC 0096 documents** rather than
genuine renames — a nested call recorded as a `ref:`, where the Ruby side is a
method call and the TS side a local (or vice versa):

- `pool-config.ts:347` passes `value.primaryClassQ()` and is recorded as
  `ref:primaryClassQ` against Ruby `ref:primary_class?`
  (`connection_adapters/pool_config.rb:48`) — the same call, spelled by
  convention. Not a rename.
- `postgresql/oid/point.ts#buildPoint` — Ruby `ref:Float,ref:Float`
  (`Float(x)` conversions) vs TS locals `fx, fy`.
- `postgresql/oid/range.ts#serialize` / `#map` — Ruby `exclude_end?` (a method
  call) vs TS `excludeEnd` local.
- `postgresql/oid/array.ts#serialize` — Ruby `ref:pgEncoder,ref:castedValues`
  vs TS `ref:this,ref:typeCastArray`, a chained-call recording.

Those get a baseline row with a reviewed reason at `naming-gate-flip`, not a
rename here — but note them in the PR body so the flip story knows which they
are.

### How to converge

Rename the locals and parameters to the Rails identifiers, camelCased per
`docs/ruby-ts-conventions.md`. Rename to the Rails identifier, not to a better
one: if Rails says `o`, the TS name is `o`. No behavior changes and no public
surface changes — these are body-local identifiers.

A row that turns out to be an a1 (argument order) or a3 (invented helper /
conversion) finding is **not** renamed away: file it against the RFC owning that
file and leave the row standing.

The counts above are a snapshot; re-measure before claiming, since sibling
wave-3 stories land against disjoint file sets but the totals move.

## Acceptance criteria

- [ ] Locals and parameters in the files listed above carry the Rails
      identifier, camelCased.
- [ ] `API_COMPARE_ALLOW_STALE_BUILD=1 pnpm parity:api:calls:args:report` shows
      the `naming` class down by **at least 18 rows** (26 minus the ~5 tooling-residue
      rows and the `newColumnFromField` a3), and no new `shape` rows.
- [ ] No baseline row is added, widened or reseeded by this PR.
- [ ] Every row deliberately left standing is classified in the PR body as
      tooling residue (for `naming-gate-flip` to baseline) or as an a1/a3
      finding with the follow-up story it was filed against.
- [ ] `pnpm lint` passes and the activerecord adapter tests pass on all three
      adapters; no public API change.

## Progress — PR #6459 (partial; story NOT closed)

PR #6459 converged **7 of this slot's 26 rows** (26 -> 19), short of the >=18 in
the acceptance criteria. Converged: `postgresql-adapter.ts` 10 -> 7
(`remove_index` rebinds `options`; `exec_insert` rebinds `pk`),
`postgresql/oid/type-map-initializer.ts` 2 -> 0 (`register` / `alias_type`
rebind `oid`), `mysql/schema-statements.ts` 2 -> 1 (`indexes` names the quoted
map `columns`).

**The >=18 target is not reachable by renaming.** The story estimated ~5
tooling-residue rows; direct inspection of all 19 survivors found ~17 that no
rename can close:

- Reserved word: `extract_default_function`'s second parameter is Ruby
  `default`, which is not a legal JS identifier.
- No JS equivalent: `unprepared_statement`'s `object_id`;
  `register_class_with_precision` / `_with_limit`'s `Array#last` (TS `.at(-1)`);
  `oid/point.rb`'s `Float(x)` conversions.
- Repo-wide convention renames the recorder cannot see through:
  `@callbacks` -> `_callbacks` (`abstract/transaction.ts`), `primary_class?` ->
  `primaryClassQ` (`pool-config.ts`).
- Nested-call-vs-local recordings: `oid/range.ts` `exclude_end?` (2),
  `oid/array.ts` (2), `postgresql-adapter#explain`'s `pp`.
- a3, needing structural work rather than a rename: `new_column_from_field`
  (threads a lazy `createTableInfoFn` where Rails threads `table_name`),
  `build_statement_pool` (invented `client` parameter), `rename_table`
  (`renamedName` is a schema-qualified name trails must rebuild; Rails' `new_name`
  is already the parameter), `postgresql/database-statements#cast_result`.

Remaining reachable work in this slot is `postgresql-adapter#explain` — Rails'
`ExplainPrettyPrinter#pp` takes an `ActiveRecord::Result` and reads
`.columns`/`.rows` (`postgresql/explain_pretty_printer.rb:20-22`); trails' `pp`
takes a row array, so the call site passes `result.toArray()`. Converging means
changing `explain-pretty-printer.ts`'s signature, which is outside this story's
file list.

Suggest re-scoping the acceptance threshold to the ~2 reachable rows, or folding
the remainder into the gate-flip baseline.

## Threshold correction (`naming-residue-taxonomy-recalibration`, 2026-08-13)

The `>=18` above was written against the pre-recalibration assumption that
~6% of the class is unconvergeable tooling residue. The committed classifier
(`scripts/api-compare/naming-taxonomy.ts`, reported by `pnpm
parity:api:calls:args:report`) measures this slot at **17 convergeable rows
and 4 permanent** ones, so the reachable target is **17**, not
`>=18`. Read the acceptance criterion as that number.

Permanent here means the classifier's `js-reserved-word`, `no-js-equivalent` and
`conventions-rename` classes — each carries ONE shared reviewed reason at the
gate flip, not a per-row sentence. `module-mixin-receiver` and `burndown` rows
are NOT permanent and must never be baselined, whatever this slot leaves
standing. See RFC 0096 `## Residue taxonomy`.
