---
title: "Parameter-name drift: the abstract-adapter rows that are a signature SHAPE, not a spelling"
status: done
updated: 2026-08-29
rfc: "0128-parameter-name-drift-burndown"
cluster: fidelity
packages:
  - activerecord
deps: []
deps-rfc: []
est-loc: 180
priority: 3
pr: 7202
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`param-drift-activerecord-abstract-adapters` (PR #7182) took
`connection_adapters/abstract*` from 33 reported parameter-name positions to 2.
Both survivors are signature-SHAPE divergence, not a spelling the rename could
reach, and `param-drift-positional-misalignment-is-a-dropped-parameter` closed
without them.

`API_COMPARE_FORCE=1 pnpm parity:api --package activerecord --params`:

```text
connection-adapters/abstract/database-statements.ts:execute  @1  ruby `name`  ts `binds`
connection-adapters/abstract/database-statements.ts:execute  @2  ruby `allowRetry`  ts `name`
connection-adapters/abstract/schema-definitions.ts:checkConstraintExists  @0  ruby `args`  ts `tableName`
```

**`execute`** — Rails is `execute(sql, name = nil, allow_retry: false)`
(`activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:136`).
The trails host interface at
`packages/activerecord/src/connection-adapters/abstract/database-statements.ts:852`
carries an extra `binds` at @1, which shifts `name` to @2 and reports as two
renames. The fix is the signature, not the names: either drop the `binds` slot
and route bound values the way Rails does, or record why the port needs it.

**`checkConstraintExists`** — this row is a host mis-attribution. The declaration
the extractor picks is `SchemaStatementsLike` (an invented `_schema` duck type,
`schema-definitions.ts:~1690`) whose `checkConstraintExists(tableName, options?)`
mirrors `SchemaStatements#check_constraint_exists?(table_name, **options)`
(`schema_statements.rb:1341`) — where `tableName` IS the Rails identifier.
Because the interface lives in `schema-definitions.ts`, it is scored against
`schema_definitions.rb`'s `Table#check_constraint_exists?(*args, **options)`
(`schema_definitions.rb:949`) instead, and `tableName` reads as drift. The
class-side `Table#checkConstraintExists` already carries a true `...args` rest
(PR #7182), so renaming anything in the interface would be actively wrong: the
convergence is to stop `SchemaStatementsLike` living in a Rails-matched file it
does not mirror.

## Acceptance criteria

- `pnpm parity:api --package activerecord --params` reports no
  `checkConstraintExists` row for `connection_adapters/abstract*`.
- The two `execute` rows are out of scope, and their convergence is filed as
  `param-drift-execute-binds-slot-family-convergence`. The receipt this story
  originally offered as the alternative does not exist for this position:
  `@missingRailsArgs` is a call-SITE receipt keyed to a Ruby call
  (`scripts/api-compare/missing-rails-args-tags.ts`), and the parameter-name
  comparer (`scripts/api-compare/param-names.ts`) reads no JSDoc tag at all, so
  no tag can clear a params row. Tagging the stub was tried and measured: the
  artifact records it under neither `suppressed` nor `staleTags` — it is inert.
  The only thing that clears those two rows is the family-wide signature flip,
  which is a behavioural refactor of three concrete adapters and ~124 call
  sites, outside this story's 180 LOC and its own no-behaviour-change criterion.
- `SchemaStatementsLike` no longer scores against `schema_definitions.rb` — moved
  out of the Rails-matched file, or otherwise excluded from the matched surface.
  Its members keep the SchemaStatements identifiers they already have.
- No behaviour change and no test renamed; `parity:api` methods and arity
  unmoved, `parity:api:calls` / `parity:api:calls:args` / `parity:api:extra:gate`
  no new row.

## Also worth folding in

Reviewer note on PR #7182 (non-blocking there, real here):
`Table#foreign_key_exists?` and `Table#remove_check_constraint`
(`schema_definitions.rb:920,938`) are `(*args, **options)` too — the same shape
as `check_constraint_exists?` — but their TS wrappers keep a two-slot
`(args?, options)` union rather than a true rest parameter. PR #7182 converted
only `check_constraint_exists?`, because that was the row its gate reported;
the other two read as consistent-looking drift and belong in this burndown.
