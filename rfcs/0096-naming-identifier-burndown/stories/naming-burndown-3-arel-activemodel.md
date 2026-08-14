---
title: "Burn down the remaining 28 naming call-argument rows in arel and activemodel"
status: done
updated: 2026-08-14
rfc: "0096-naming-identifier-burndown"
cluster: api-compare
packages: ["arel", "activemodel"]
deps: []
deps-rfc: []
est-loc: 112
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
even after a clean `pnpm build`, so the stale-build escape hatch is required).

That run reports **344 `naming` rows** repo-wide, of which **167** are in RFC
0096's scope. This slot is every remaining arel and activemodel row: **28 rows
across 17 files** (arel 13, activemodel 15). Sibling of wave-2's
`naming-burndown-2-arel-activemodel`.

| Rows | File                                                                                                                                                                                                                             |
| ---: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|    4 | `packages/activemodel/src/type/date.ts`                                                                                                                                                                                          |
|    3 | `packages/activemodel/src/attribute-methods.ts`                                                                                                                                                                                  |
|    2 | `packages/activemodel/src/type/date-time.ts`                                                                                                                                                                                     |
|    2 | `packages/activemodel/src/type/helpers/numeric.ts`                                                                                                                                                                               |
|    2 | `packages/arel/src/select-manager.ts`                                                                                                                                                                                            |
|    2 | `packages/arel/src/visitors/to-sql.ts`                                                                                                                                                                                           |
|    1 | each (activemodel): `attribute-set.ts`, `attribute-set/builder.ts`, `attribute.ts`, `errors.ts`                                                                                                                                  |
|    1 | each (arel): `attributes/attribute.ts`, `collectors/substitute-binds.ts`, `factory-methods.ts`, `nodes/infix-operation.ts`, `nodes/node-expression.ts`, `nodes/sql-literal.ts`, `predications.ts`, `table.ts`, `visitors/dot.ts` |

### Representative rows, with both sides

- **`activemodel/type/date.ts#castValue`** —
  `packages/activemodel/src/type/date.ts:53` binds `const str = String(value).trim()`
  and calls `this.fastStringToDate(str) ?? this.fallbackStringToDate(str)` at
  `:55`. Rails
  (`vendor/rails/activemodel/lib/active_model/type/date.rb:39-42`) has no such
  local: `fast_string_to_date(value) || fallback_string_to_date(value)`. Same
  shape in `type/date-time.ts#castValue` against `date_time.rb`. Four rows, one
  fix each: inline as Rails does, or name the local `value`.
- **`activemodel/type/date.ts#valueFromMultiparameterAssignment`** — TS
  `(year, month, day)` into `newDate`; Rails
  (`type/date.rb`) is `new_date(year, mon, mday)`. Two plain renames.
- **`activemodel/type/helpers/numeric.ts#changed?`** — TS `old` and `fresh`;
  Rails (`type/helpers/numeric.rb#changed?`) is `old_value` and
  `new_value_before_type_cast`. Plain renames.
- **`activemodel/attribute-methods.ts#generateAliasAttributeMethods`** — TS
  `host`, Rails `code_generator`
  (`activemodel/lib/active_model/attribute_methods.rb`,
  `alias_attribute_method_definition(code_generator, pattern, new_name, old_name)`).
  Three rows in this file. The identical row exists in
  `packages/activerecord/src/attribute-methods.ts` and is owned by
  `naming-burndown-3-ar-model-encryption-tasks` — keep the file sets disjoint.
- **`arel/select-manager.ts#intersect` / `#except`** —
  `packages/arel/src/select-manager.ts:374,382` bind `otherAst`; Rails
  (`vendor/rails/activerecord/lib/arel/select_manager.rb`) writes
  `Nodes::Intersect.new ast, other.ast` with no local. Inline it or name it
  `ast`.
- **`arel/table.ts#as`** — TS `aliasName`, Rails `name` (`arel/table.rb#as`).
- **`arel/visitors/to-sql.ts#quoteTableName` / `#quoteColumnName`** — TS passes
  `.toString()`, Rails passes the `name` parameter directly. That is a
  conversion at the call site (a3), not a rename; check whether the `to_s` Rails
  does elsewhere makes the TS call redundant.

### Tooling residue in this slot

**5 of the 13 arel rows are one residue shape**: `groupingAny` in
`attributes/attribute.ts`, `nodes/infix-operation.ts`, `nodes/node-expression.ts`,
`nodes/sql-literal.ts` and `predications.ts` each record Ruby `ref:inject`
against TS `ref:reduce` — Rails' `others.inject(...)` chained call recorded by
its last name, matched against trails' `reduce`. It is the exact chained-call
residue RFC 0096's Motivation documents. Baseline it at `naming-gate-flip`; do
not rename `reduce` to `inject`.

`arel/visitors/dot.ts#visitEdge` (`ref:send` vs `ref:value`) and
`activemodel/attribute-set.ts#deepDup` (`ref:transformValues` vs `ref:newAttrs`)
are the same shape. So is `arel/collectors/substitute-binds.ts#addBind`
(`ref:extractValue`).

That is ~8 of 28 residue, ~20 genuine.

### How to converge

Rename the locals and parameters to the Rails identifiers, camelCased per
`docs/ruby-ts-conventions.md`. Rename to the Rails identifier, not to a better
one. No behavior changes and no public surface changes.

If you touch `arel`, run `pnpm lint --fix` after `pnpm parity:api` —
`blazetrails/rails-file-structure-method-order` needs the manifest that run
builds.

A row that turns out to be an a1 or a3 finding is **not** renamed away: file it
against the RFC owning that file and leave the row standing.

The counts above are a snapshot; re-measure before claiming.

## Acceptance criteria

- [ ] Locals and parameters in the files listed above carry the Rails
      identifier, camelCased.
- [ ] `API_COMPARE_ALLOW_STALE_BUILD=1 pnpm parity:api:calls:args:report` shows
      the `naming` class down by **at least 18 of these 28 rows** (28 minus the
      ~8 residue rows), and no new `shape` rows.
- [ ] The five `groupingAny` `inject`/`reduce` rows are documented in the PR
      body as chained-call residue for `naming-gate-flip` to baseline.
- [ ] No baseline row is added, widened or reseeded by this PR.
- [ ] `pnpm lint` (with `--fix` for the arel method-order rule) and the arel and
      activemodel tests pass; no public API change.
