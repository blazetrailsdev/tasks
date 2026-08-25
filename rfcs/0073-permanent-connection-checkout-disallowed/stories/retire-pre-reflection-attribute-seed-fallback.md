---
title: "Retire the pre-reflection attribute-seed fallback once columns_hash can block"
status: draft
updated: 2026-08-20
rfc: "0073-permanent-connection-checkout-disallowed"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`_defaultAttributes`' phase-1 seed carries a branch Rails has no counterpart for
(`packages/activerecord/src/attributes.ts`, the `cachedColumns === undefined`
arm): when the schema cache has no entry for the table, a name with no column,
no default and no declared type is seeded with a non-singleton `value` type
instead of being left out of the set.

Rails needs no such arm. `_default_attributes` seeds from a **resolved**
`columns_hash` (`activerecord/lib/active_record/attributes.rb:241-250`), which
blocks on a connection checkout, so by the time the pending decorators replay
there is no "not reflected yet" state to be in. A name absent from the seed is
absent because there is no such column, full stop, and a decorator branching on
`subtype == ActiveModel::Type.default_value`
(`activerecord/lib/active_record/enum.rb:240-245`) reads that unambiguously.

trails cannot block: `loadSchema` is async, and the warm-cache probe at
`attributes.ts:186` is wrapped in a `try`/`catch {}` specifically to avoid the
`.connection` access that would permanently lease a connection under
`permanentConnectionCheckout` = disallowed. That probe stamps `_schemaLoaded`
even when it reflected nothing, which is why the flag is not a usable signal
and the seed has to ask `cachedColumnsHash` for a cache MISS instead.

This bit for real. PR #6793 first gated the fallback on `!isSchemaLoaded` and
PG went red — `postgresql_enums.current_mood` is a column-backed enum, but PG
reached the seed flagged-loaded with an empty hash, so the decorator read "no
such column" out of "not reflected yet" and raised `Undeclared attribute type
for enum`. Reproduced as `DBG PostgresqlEnum current_mood loaded= true
ncols= 0`. The second attempt keyed on an empty hash, which conflated a cache
miss with a table that reflected and genuinely has no columns; the current
code keys on the miss alone.

`cachedColumnsHash` (`packages/activerecord/src/model-schema.ts`) carries the
same dependency in its own doc: it "disappears once that caller can block the
way `data_source_exists?(pool, name)` does — blocked on RFC 0073".

## Converged shape

The seed reads a resolved `columns_hash` and has no miss branch at all —
phase 1 is `columns_hash.transform_values { ... }` and nothing else, so an
absent name resolves to a `Null` attribute typed `Type.default_value` at replay
exactly as Rails does. `cachedColumnsHash`'s `Record | undefined` return
collapses back to a plain hash, and the `!isSchemaLoaded` warm-cache probe at
`attributes.ts:186` goes with it.

Gated on the permanent-connection-checkout flip: until a sync reader may block
on a checkout, trails cannot resolve the schema at seed time and the miss
branch has to stay.

## Acceptance criteria

- The `cachedColumns === undefined` arm in `_defaultAttributes`' phase-1 seed
  is gone; phase 1 seeds from the resolved columns hash only.
- `cachedColumnsHash` returns a plain `Record<string, ColumnLike>` again (no
  `undefined` miss signal), or is retired entirely in favour of a blocking read.
- The warm-cache probe at `attributes.ts:186` and its swallowed `catch` are gone.
- `packages/activerecord/src/adapters/postgresql/enum.test.ts` stays green —
  it is the regression guard for the miss-vs-absent distinction.
