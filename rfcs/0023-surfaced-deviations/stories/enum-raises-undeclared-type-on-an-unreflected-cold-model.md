---
title: "enum raises Undeclared attribute type on a cold model where Rails cannot"
status: draft
updated: 2026-08-27
rfc: "0023-surfaced-deviations"
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

`enum` resolves its subtype from the attribute's existing type and raises when it
finds `Type.default_value`:

> Undeclared attribute type for enum '<name>' in <Class>. Enums must be backed by
> a database column or declared with an explicit type via `attribute`.

(`packages/activerecord/src/enum.ts:164-168`; Rails'
`vendor/rails/activerecord/lib/active_record/enum.rb` raises the same message
from its `decorate_attributes` block.)

In Rails that raise means what it says: the column genuinely does not exist. It
cannot fire spuriously, because the decorator runs inside `_default_attributes`
(`attributes.rb:241-252`), which reads `columns_hash`, whose `load_schema!`
BLOCKS on `schema_cache.columns_hash` and reflects the table
(`model_schema.rb:592-594`). By the time any decorator replays, the columns are
there.

trails' schema-cache read is async, so a model touched before its table has
reflected has an empty `columns_hash` — and a perfectly ordinary canonical model
with an `enum` then raises "Undeclared attribute type" for a column that exists
in `schema.rb`. Nothing is wrong except the timing.

This was masked until PR #7117: the synthesized `columns_hash` fallback happened
to supply an entry built from the enum's own pending declaration, so the
decorator always found a type. Retiring the fallback (correctly — `columns_hash`
is a pure DB read) exposed the real gap. Three sites had to reflect explicitly
before touching a cold model, each with a `loadSchema()` call Rails does not
need:

- `packages/activerecord/src/inheritance-sti-new-gate.trails.test.ts` — could not
  use `VerySpecialClient` at all (under `Company`'s `enum :status`,
  `test/models/company.rb:10`) and moved to `DeadParrot`, whose hierarchy
  declares no enum.
- `packages/activerecord/src/insert-all.test.ts` — `Book` retargeted at a
  db-qualified table name.
- `packages/activerecord/src/adapters/postgresql/enum.test.ts` — `postgresql_enums`
  is created per-test rather than warmed at boot.

Each new test that touches a cold enum-bearing model will rediscover this, so it
is worth converging rather than papering over site by site.

## Converged shape

An enum on a model whose schema has not reflected must not raise. The raise
belongs to the genuine case Rails means — no such column once the schema IS
loaded. Options to weigh (the story should pick one, not ratify the current
behavior):

- Defer the decorator's type resolution to the point the schema settles, the way
  `applyColumnsHash` already re-runs generation, so the pending enum re-resolves
  against real columns instead of resolving once against an empty set.
- Or make the raise conditional on the schema actually being loaded
  (`_schemaLoaded`), so a cold model defers rather than fails — a narrower fix,
  and the one closest to "Rails cannot observe this state".

Related but distinct: `converge-undeclared-enum-type-raise-to-materialization`
(same RFC) concerns WHERE the raise is emitted from, not this false-positive on
cold schema.

## Acceptance criteria

- [ ] Constructing or reading a canonical enum-bearing model before its table has
      reflected does not raise "Undeclared attribute type"; the enum resolves its
      column type once the schema lands.
- [ ] The raise still fires for a genuinely absent column on a reflected model,
      with the same message and raise site.
- [ ] The three explicit `loadSchema()` calls listed above are removed, and
      `inheritance-sti-new-gate.trails.test.ts` can use any cold STI leaf again.
- [ ] activerecord suites green on all adapter lanes; parity deltas
      non-negative.
