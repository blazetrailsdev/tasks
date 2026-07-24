---
title: "Handle inbound and cyclic FKs in fkSafeDropOrder"
status: ready
updated: 2026-07-24
rfc: "0070-drop-repair-worker-schema"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`fkSafeDropOrder` (`packages/activerecord/src/test-helpers/canonical-schema.ts`,
added by #5267) orders drops topologically using the FKs the database actually
holds, but only considers FKs _among the tables being dropped_. Two cases remain
unsafe once the registry starts declaring FKs (see sibling story
`canonical-schema-express-foreign-keys`):

- An FK from a table _outside_ the requested subset into a table inside it
  blocks `DROP TABLE` on PG/MySQL regardless of drop order among the subset.
  `fkSafeDropOrder` filters those targets out (`inSet.has(t)`) and cannot help.
- A cycle (mutually-referencing tables) has no safe order; the helper falls back
  to input order, which will fail the drop.

Inert today: the canonical registry declares no FKs.

## Acceptance criteria

- Handle an inbound FK from outside the drop set — e.g. drop the blocking
  constraint via `removeForeignKey` before the drop, or drop with FK checks
  suspended where the adapter supports it (`disableReferentialIntegrity` works
  for MySQL/SQLite; PG's `DISABLE TRIGGER ALL` does NOT permit dropping a
  referenced table, so PG needs the constraint dropped or `CASCADE`).
- Handle the cycle case explicitly rather than silently emitting an order that
  cannot work.
- Keep the current cost profile: no FK introspection work when no FK exists.
- Extend `canonical-schema.test.ts` coverage for both cases.
