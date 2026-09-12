---
title: "converge-migration-area-moved-residue"
status: draft
updated: 2026-09-12
rfc: "0130-activerecord-extra-surface-receipt-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`receipt-moved-migration-method-missing-delegations` (trails#7729) resolved the 51 moved
extras in the migration area. Review on that PR converged all but one:
`Migration#change` was deleted (the `respond_to?(:change)` branch now sits in `execMigration`
where `migration.rb:985-998` puts it, and `up`/`down` were restored to their Rails bodies at
`migration.rb:951-961`), `currentVersion` was relocated onto `Migration` (`migration.rb:633`),
and the dead `Compatibility` interface was deleted outright. **`dumpTableSchema` is all that
remains**, plus one behaviour bug this work uncovered.

### `SchemaDumper.dumpTableSchema` is production surface Rails keeps in test support

Rails declares it only at
`vendor/rails/activerecord/test/support/schema_dumping_helper.rb:4` (`def
dump_table_schema(*tables)`), mixed into the test case and called bare. The production
singleton surface is `dump` plus a private `generate_options`
(`vendor/rails/activerecord/lib/active_record/schema_dumper.rb:43-58`).

**The faithful helper already exists**, at
`packages/activerecord/src/support/schema-dumping-helper.ts`, and `src/support/**` is outside
both compare populations — so moving the callers resolves the extra with no receipt.

Two findings from trails#7729 make this much cheaper than it looks, and they are the reason
this is a small self-contained PR rather than a risky one:

- **The helper is signature-compatible.** It takes `(pool: SchemaSource, ...tables: string[])`
  and reads `pool.dataSources?.() ?? pool.tables()`; an adapter answers both, so
  `dumpTableSchema(adapter, "foos")` works against it unchanged. Every call site is a literal
  `SchemaDumper.dumpTableSchema(` → `dumpTableSchema(` substitution plus one import.
- **NO call site asserts exact equality on the dump output.** Every one is
  `expect(output).toMatch(/…/)` or `not.toMatch`, so the helper's extra header and trailer do
  not break them. (trails#7729 first reported "only one" exact-equality site; re-measuring
  found that hit was an unrelated `toEqual` on `primaryKey`.) That was the risk that looked
  blocking and is not.
- **There are ZERO production callers** — it is a test-only API declared on a production
  class, which is exactly Rails' own division: `schema_dumper.rb:43-58` publishes `dump` and a
  private `generate_options`, and the helper lives in `test/support/`.

The two bodies do still differ, and the one exact-equality site is where it shows:

|              | production static                                          | `support/` helper (Rails' shape)                  |
| ------------ | ---------------------------------------------------------- | ------------------------------------------------- |
| path         | `dumper.schemas`/`extensions`/`types`/`dumpTable` directly | `SchemaDumper.dump(pool)` with `ignoreTables` set |
| output       | bare `create_table` block                                  | full dump, header and trailer included            |
| adapter hook | honours `createSchemaDumper`                               | does not                                          |

So the sequence is: confirm the helper resolves the adapter's own dumper (the
`createSchemaDumper` column above), fix the single exact-equality assertion, substitute the
call sites, delete the static.

It did not fit trails#7729 for a hard reason rather than a judgement call: 139 references
across 42 files is roughly 180 LOC, which would have taken that PR from 592 to ~770 and past
the 700-LOC ceiling.

### Bug found while reviewing this area: the compatibility registry is keyed on a made-up version

`Migration.currentVersion()` returns the string `"1.0"`, where Rails'
`Migration.current_version` returns `ActiveRecord::VERSION::STRING.to_f` — a Float
(`migration.rb:633-635`). The value cannot simply be changed: trails' own
`gem-version.ts` says `8.0.2`, so `to_f` is `8.0`, but
`migration.ts` registers `Current` under `CURRENT_VERSION = "1.0"` and
`migration/compatibility.ts` compares registry keys as STRINGS (`normalizeVersion`,
`compareVersions`, `parseVersion`). Returning `8.0` today would break
`Migration.forVersion(Migration.currentVersion())`.

In Rails the two agree by construction — `current_version` is 8.0 and the current
compatibility class is `V8_0`. So the real divergence is that trails keyed its registry on a
version that is not the gem's, and the fix is a port of `Migration::Compatibility.find`
(`migration/compatibility.rb`) that derives its keys from `VERSION`, with
`currentVersion()` returning a number. That changes a public return type and every
`Migration.forVersion(1.0)` assertion in `migrator.trails.test.ts`.

## Acceptance criteria

- [ ] `SchemaDumper.dumpTableSchema`'s callers use `support/schema-dumping-helper.ts`, the static is deleted, and its `@noRailsEquivalent CONVERGEABLE` receipt comes out with it.
- [ ] `pnpm parity:api:extra --package activerecord` reports 0 extras for `schema-dumper.ts`.
- [ ] `Migration.currentVersion()` returns the numeric `VERSION::STRING.to_f` and the compatibility registry is keyed on it, so `Migration.forVersion(Migration.currentVersion())` resolves `Current`.
- [ ] `pnpm parity:api:extra:tighten` writes activerecord's `total` mark DOWN.
