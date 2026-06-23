---
rfc: "0000-strict-write-attribute-internal-convergence"
title: "Strict _write_attribute convergence (remove the writeFromUser internal-write bridge)"
status: draft
created: 2026-06-23
updated: 2026-06-23
owner: "@deanmarano"
packages:
  - "activerecord"
clusters:
  - "rails-deviation"
related-rfcs:
  - "0031-schema-cache-always-warm-convergence"
---

# Strict `_write_attribute` convergence (remove the writeFromUser internal-write bridge)

## Summary

PR #4027 (story `widen-writefromuser-strict-after-warm`, RFC 0031) shipped the
strict `AttributeSet#writeFromUser` one-liner: the public `write_attribute` /
`[]=` / mass-assignment paths now raise `MissingAttributeError` for any name not
in the attribute set, matching Rails (`attribute_set.rb:58-61` → Null →
`MissingAttributeError`; `write.rb:31-36`; `attribute_assignment.rb:67-76`).

That story's criterion #3 — converging the low-level `_write_attribute`
(`write.rb:42`) to **also** raise — was deferred behind a **bridge**. Rails'
`_write_attribute` reaches `write_from_user` and raises because in Rails the
PK/timestamp/locking columns its internal writers target are always present in
the set (the table is reflected synchronously). trails' set is **not** always
complete: a model on a raw-created table whose schema cache was never warmed
cannot reflect its columns synchronously on an **async** driver (PG/MySQL), so
the post-INSERT primary-key write-back (`base.ts` `_createOrUpdate` →
`_writeAttribute`) would hit the strict `writeFromUser` and raise.

The bridge (`packages/activerecord/src/readonly-attributes.ts` `_writeAttribute`:
`catch (MissingAttributeError) → this._attributes.writeCastValue(name, value)`)
keeps the internal low-level path lenient so the framework's own writes survive
an incomplete set, while the public write paths stay strict. This RFC removes
the bridge.

## Motivation

The bridge is a trails-only deviation from `write.rb:42` (which raises). It
exists only because a large set of bespoke **test** models — most acutely the
PG/MySQL adapter suites that `adapter.exec("CREATE TABLE …")` then use
immediately — don't seed their real columns into the attribute set, relying on
the pre-#4027 lazy `write_from_user` to materialize the PK on write-back.

These adapter suites run only in the PostgreSQL / MariaDB / MySQL CI jobs (not
locally on SQLite, whose synchronous driver is unaffected), so the gap surfaces
~30 adapter test files (`adapters/postgresql/*`, `adapters/mysql2/*`,
`adapters/abstract-mysql-adapter/*`, `connection-adapters/{postgresql,mysql2}-adapter`),
several with non-integer PKs (`uuid`, `composite`, custom). Converging them is a
focused but adapter-CI-gated effort that did not belong in the #4027 critical
path.

## Design

Two converging tracks; either or both per model, then remove the bridge.

1. **Declare real columns on bespoke adapter-suite models.** For each bespoke
   `class X extends Base` that constructs + saves on a raw-created table, declare
   its actual primary key (`id` integer, or the real `uuid`/composite/custom PK)
   and any framework-written columns (timestamps, lock column). Mirror the real
   DDL — never invent an `id` for a uuid/composite-PK table.

2. **(Alternative/complement) warm the cache on raw create.** Investigate making
   the adapter test harness (or an explicit warm step after
   `adapter.exec("CREATE TABLE …")`) populate the per-connection schema cache so
   `columnsHash()` reflects the real columns synchronously, removing the need to
   hand-declare columns. Pooled adapters can warm via async introspection in a
   `beforeEach`/`beforeAll`; the open question is doing so without per-test
   boilerplate.

3. **Remove the bridge; converge `_write_attribute` to raise.** Delete the
   `catch → writeCastValue` fallback in `readonly-attributes.ts` `_writeAttribute`
   so it reaches `write_from_user` and raises like `write.rb:42`. Gate on the
   declare/warm tracks landing. Verify all three adapter CI jobs (sqlite /
   postgres / mysql:8) green.

## Rollout

1. `declare-pg-adapter-suite-model-columns`
2. `declare-mysql-adapter-suite-model-columns`
3. `audit-sqlite-suite-internal-write-bridge-reliance` (spike — confirm no
   SQLite-visible model still depends on the bridge once PG/MySQL are converged)
4. `warm-schema-cache-on-raw-created-tables` (optional systemic alternative;
   may obsolete 1–2)
5. `remove-internal-write-bridge-converge-write-attribute-strict`
   (deps: 1, 2, 3 — or 4)

## Alternatives considered

- **Keep the bridge permanently (ratify).** Rejected per "always converge, never
  ratify": `write.rb:42` raises; the bridge masks incomplete sets.
- **Make `defineSchema(adapter, …)` warm by default.** Tried during #4027:
  regressed low-level migration/adapter tests and no-ops for non-pooled wrapper
  adapters. Rejected as the blanket fix; revisit narrowly under story 4.
