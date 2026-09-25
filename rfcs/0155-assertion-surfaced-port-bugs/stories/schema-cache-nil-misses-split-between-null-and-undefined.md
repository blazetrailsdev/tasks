---
title: "SchemaCache spells one Ruby nil as both null and undefined"
status: done
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#8087
claim: "2026-09-25T14:51:41Z"
assignee: "reset-callbacks-test-helper-ships-in-production-callbacks"
blocked-by: null
closed-reason: null
---

## Context

Ruby returns `nil` from a schema-cache miss, and it returns the same `nil`
whichever path produced it. trails answers with `undefined` on some paths and
`null` on others from the SAME method, and the two are not interchangeable to a
caller writing `=== null` or `?? default`.

trails#7897 pinned three concrete instances while porting
`vendor/rails/activerecord/test/cases/connection_adapters/schema_cache_test.rb`
against `BoundSchemaReflection` over `ARUnit2Model`'s pool:

| call                                                                            | Rails | trails      |
| ------------------------------------------------------------------------------- | ----- | ----------- |
| `primary_keys("omgponies")` — absent table (`schema_cache.rb:297-310`)          | `nil` | `undefined` |
| `primary_keys("professors")` — ignored table, from a loaded dump                | `nil` | `null`      |
| `data_source_exists?("professors")` — ignored table (`schema_cache.rb:312-330`) | `nil` | `undefined` |

The first two are `primary_keys`, one method, two JS spellings of one Ruby
`nil`, chosen by which branch answered. Rails' own test asserts `assert_nil` on
both (`schema_cache_test.rb:147-149`, `:250-251`), which is why the trails port
has to spell one arm `toBeUndefined()` and its sibling `toBeNull()` — the
assertion-kind map scores both as `nil`, so the parity gate cannot see the
split, but a caller can.

The same question hangs over `columnsHash`, `dataSources`, `size` and the
`getCached*` sync peeks, whose signatures are already
`Promise<X | null | undefined>` — a union that exists only because no rule says
which one a miss produces.

## Converged shape

One spelling per Ruby `nil`, applied across `SchemaCache`, `SchemaReflection`
and `BoundSchemaReflection`
(`packages/activerecord/src/connection-adapters/schema-cache.ts`):

- `primaryKeys` returns `null` for an absent table AND for an ignored one —
  Ruby's `nil` is `null`, and both arms of `schema_cache.rb:297-310` reach the
  same `nil`.
- `dataSourceExists` returns `null` for an ignored table, matching
  `schema_cache.rb:312-330`.
- The `X | null | undefined` unions collapse to `X | null`. Where `undefined`
  survives, it means "not reflected yet" at a sync peek, which is a DIFFERENT
  fact from Ruby's `nil` and is the one CLAUDE.md § "Schema reflection peeks at
  a warm cache" ratifies — that distinction should be the rule, not an
  accident of which branch ran.

Then re-spell the `toBeUndefined()` arms in
`packages/activerecord/src/connection-adapters/schema-cache.test.ts`
(`primary key for non existent table`, `marshal dump and load with ignored
tables`) back to `toBeNull()`, matching Rails' `assert_nil` directly.

## Acceptance criteria

- `SchemaCache#primaryKeys` and `#dataSourceExists` answer a Ruby `nil` with
  `null` on every branch; no method returns `undefined` on one path and `null`
  on another for the same Ruby `nil`.
- `undefined` is left meaning only "not reflected yet" at the sync peeks, per
  CLAUDE.md § "Schema reflection peeks at a warm cache".
- The two `toBeUndefined()` arms in `schema-cache.test.ts` are `toBeNull()`.
- `schema-cache.test.ts`, `schema-cache.trails.test.ts`,
  `model-schema*.trails.test.ts` and `attribute-methods/primary-key*` stay
  green; `pnpm parity:test -- --package activerecord --assertions` delta
  non-negative.
