---
rfc: "0059-drop-defineschema-mirror-create-table"
title: "Drop defineSchema; mirror Rails create_table for test schema"
status: closed
created: 2026-07-02
updated: 2026-07-05
owner: "@deanmarano"
packages:
  - "activerecord"
clusters:
  - "rails-deviation"
related-rfcs:
  - "0019-canonical-schema-burndown"
  - "0048-one-schema-no-drop-tests"
  - "0049-one-schema-no-drop-perf"
---

# RFC 0059 — Drop `defineSchema`; mirror Rails `create_table` for test schema

## Summary

Retire `defineSchema` — a trails-only test invention — and define test tables
the way Rails does: the canonical schema is laid down once at boot from a
faithful port of `vendor/rails/activerecord/test/schema/schema.rb`
(`ActiveRecord::Schema.define do … create_table … end`), and any test that needs
its own table calls the real `connection.createTable(...)` + drops it in
teardown. This removes the bespoke `defineSchema(schemaObject)` surface, and in
doing so **subsumes the entire one-schema apparatus** (`AR_ONE_SCHEMA`,
`one-schema-exclude.json`, `assertCanonicalSchema`/`OneSchemaViolation`, the
vitest `ONE_SCHEMA_EXCLUDE` block, and the parked #4246 flip) — none of it is
needed once tables come from `create_table` and a boot-once schema.

## Motivation

`defineSchema(TEST_SCHEMA)` / `defineSchema(adapter, {tables})` is a trails
invention with no Rails counterpart. Rails tests never declare a bespoke
per-file schema object; they load `schema.rb` once and use `create_table` for
anything extra. The invention has cost us:

- A **1881-line `TEST_SCHEMA` object** (`test-helpers/test-schema.ts`, already
  labelled "Mirror of `vendor/rails/activerecord/test/schema/schema.rb`") that
  re-expresses schema.rb in a TS DSL `create_table` can't fully match (see the
  in-file "Features Rails' schema.rb expresses that defineSchema cannot yet …"
  comments).
- A **canonicality ratchet** (`blazetrails/require-canonical-schema` eslint rule
  - the RFC 0019 exclude burndown) that exists only to police `defineSchema`
    arguments.
- The **one-schema machinery** (`test-helpers/one-schema.ts`, the
  `define-schema.ts` no-op/`force` path, `AR_ONE_SCHEMA`,
  `one-schema-exclude.json`, `OneSchemaViolation`) — built to make per-file
  `defineSchema(TEST_SCHEMA)` a no-op under a boot-once schema.

Grep counts (2026-07-02): **247 `defineSchema` occurrences across 55 test
files** — ~14 canonical `defineSchema(TEST_SCHEMA)` (already no-ops under
one-schema; the tables come from boot) and ~50 explicit-adapter
`defineSchema(adapter, {tables})` (bespoke/adapter tests that genuinely create
tables).

### Why this is possible now: RFCs 0019 and 0048 were the groundwork

This RFC is the intended culmination of two prerequisite campaigns, not a new
turn:

- **RFC 0019 (canonical-schema burndown)** drove every test onto the canonical
  `TEST_SCHEMA` (the schema.rb mirror), burning the `require-canonical-schema`
  exclude to zero. That is what makes step §2 a _delete_, not a rewrite: the
  canonical `defineSchema(TEST_SCHEMA)` calls are already redundant because the
  tables are canonical and boot-laid.
- **RFC 0048 (Rails-faithful convergence)** replaced trails-invented bespoke test
  schemas with faithful ports that ride canonical tables + real fixtures. That is
  what shrinks step §3 to a genuinely small set of bespoke `create_table` cases
  instead of 55 files of ad-hoc schemas.

Both RFCs were in service of this end state: once every test rides the canonical
schema.rb mirror and is a faithful Rails port, `defineSchema` has nothing left to
do that `create_table` + a boot-once schema doesn't do the Rails way.

Crucially, the canonical schema is **already laid once at boot**
(`test-helpers/template-global-setup.ts` → `defineSchema(adapter, TEST_SCHEMA,
{force:true})`), and `defineSchema` internally just calls `createTable`. So this
is not a 247-site rewrite — it is a mechanism swap plus a delete-vs-convert
split.

## Guiding principle: Rails fidelity above all else

The overriding constraint for every choice in this RFC is **Rails fidelity** —
match `vendor/rails/activerecord/test/schema/schema.rb` and Rails' own test
`create_table` usage as literally as possible. Where fidelity and convenience
(churn, brevity, keeping an existing helper) conflict, fidelity wins. This
directly resolves the canonical-source decision below.

## Design

### 1. `create_table`-based canonical loader (replaces the boot `defineSchema`)

Port `vendor/rails/activerecord/test/schema/schema.rb` to a **hand-written
schema-definition script** that issues real `connection.createTable(name, opts,
t => { … })` calls, mirroring the Rails `ActiveRecord::Schema.define do … end`
block **line-for-line** (the block API already exists at
`connection-adapters/abstract/schema-statements.ts:237`). Wire
`template-global-setup.ts` to run it against the template DB once at boot. The
**boot-once + truncate-reset + no-`DROP TABLE`** behavior (the perf win — 86k
drops/run eliminated) is preserved; it is orthogonal to `defineSchema` and stays.

**Decision (fidelity above all else):** the canonical source is the hand-written
`create_table` script that mirrors schema.rb — NOT the existing 1881-line
`TEST_SCHEMA` object kept as loader data. Removing the bespoke DSL is half the
point, and a faithful `create_table` script is what Rails actually ships. The
`TEST_SCHEMA` object is retired with `defineSchema` in §4. (Rejected alternative:
keep `TEST_SCHEMA` as data the loader iterates — less churn, but keeps the bespoke
DSL this RFC exists to remove.)

### 2. Delete canonical `defineSchema(TEST_SCHEMA)` calls (~14 files)

Once the loader lays the schema at boot, per-file `defineSchema(TEST_SCHEMA)` is
a redundant no-op (this is exactly what one-schema mode already does). Delete
these calls; the models ride the ambient canonical tables.

### 3. Convert bespoke `defineSchema(adapter, {tables})` → `create_table` (~50 files)

Each bespoke call becomes `await connection.createTable("t", …, t => …)` in the
test (or `beforeEach`) with a matching drop in teardown, mirroring the specific
Rails test's `create_table`/`drop_table`. File-by-file, one PR each, reading the
corresponding Rails test first (same convergence contract as RFC 0048/0019).
The `CamelCase`, secondary-pool (`create_table`-via-force), migrator, and
schema-dumper conversions already landed under the one-schema burndown are the
template for this.

### 4. Retire the invention + the one-schema apparatus

Once §2–§3 leave zero `defineSchema` callers, delete: `defineSchema` /
`DefineSchemaOpts` (`test-helpers/define-schema.ts`); `test-helpers/one-schema.ts`
(`assertCanonicalSchema`, `OneSchemaViolation`, `oneSchemaMode`,
`canonicalTableNames`); `AR_ONE_SCHEMA` reads and the vitest `ONE_SCHEMA_EXCLUDE`
block; `eslint/one-schema-exclude.json`; and the now-purposeless
`blazetrails/require-canonical-schema` rule + its exclude. `define-schema.test.ts`
(which tests `defineSchema` itself — one of the 5 `test-helpers/*` one-schema
exempts) is deleted with it, resolving that exempt.

## Non-goals

- **Perf tuning beyond current parity.** The no-drop/boot-once mechanism is kept
  as-is; this RFC does not chase further DDL-cost wins.
- **Changing schema.rb content.** The canonical schema stays a faithful mirror
  of Rails' `schema.rb`; this RFC changes how it is _expressed/loaded_, not what
  tables it contains.
- **Re-porting already-converged test bodies.** Files already riding canonical
  tables only lose their `defineSchema` line; their assertions are untouched.

## Alternatives considered

- **Ship the #4246 flag-flip + de-brand (keep `defineSchema`).** Makes
  one-schema the default and renames away "one schema", but keeps the trails
  invention the user explicitly wants gone. Rejected — treats the symptom, not
  the invention.
- **`create_table` for every table including canonical, per test.** Maximally
  Rails-literal but reintroduces the ~86k `DROP TABLE`/run cost the boot-once
  schema exists to avoid. Rejected — canonical stays boot-once.

## Rollout

Phased; each phase is one or more stories (to be filed under this RFC once
numbered). Work happens on branch `existing-db-schema-rc-9807c5`.

1. **Loader** — build the `create_table` canonical loader (schema.rb port), wire
   boot, keep `defineSchema` working in parallel. Gate: schema-dump parity
   identical to today on all three adapters.
2. **Delete canonical calls** — remove the ~14 `defineSchema(TEST_SCHEMA)` sites.
3. **Convert bespoke** — the ~50 explicit-adapter sites → `create_table` +
   teardown, file-by-file, one PR each.
4. **Retire** — delete `defineSchema`, `one-schema.ts`, `AR_ONE_SCHEMA`, the
   exclude json + vitest block, and `define-schema.test.ts`. **End by removing
   every eslint rule made irrelevant by this work** — `require-canonical-schema`
   (+ its exclude) and `use-fixtures-schema` (both keyed on `defineSchema`/
   `TEST_SCHEMA`); audit `git grep -lE "defineSchema|TEST_SCHEMA|one.schema"
eslint/` and delete each, keeping still-relevant rules like
   `require-table-teardown`.

## Verification

- `git grep -c defineSchema packages/activerecord/src` → **0**.
- `eslint/one-schema-exclude.json` and `require-canonical-schema-exclude.json`
  deleted; no `AR_ONE_SCHEMA` / "one schema" / `OneSchemaViolation` strings
  remain (`git grep -i "one.schema" = 0`).
- Every eslint rule made irrelevant by dropping `defineSchema`/`TEST_SCHEMA`
  removed (`require-canonical-schema`, `use-fixtures-schema`); no eslint rule
  still references `defineSchema` or `TEST_SCHEMA`.
- Schema-dump parity (`schema-dumper` tests, all 3 adapters) unchanged across the
  loader swap.
- `test:compare` delta ≥ 0 across the whole migration.

## Open questions

- ~~**Canonical source form**~~ — RESOLVED (fidelity above all else): hand-written
  `create_table` script mirroring schema.rb line-for-line; the `TEST_SCHEMA`
  object is retired. See Design §1.
- **Loader naming** (the `ActiveRecord::Schema.define` equivalent) — must avoid
  "one schema".
- **Secondary pools / `setup-second-pool.ts`** already moved to force-`create_table`
  under #4430; confirm that pattern is the target end-state, not a stopgap.
- **Sequencing vs the in-flight one-schema burndown:** burndown is effectively
  done (exclude = 5 `test-helpers/*`); this RFC replaces the #4246 flip rather
  than following it. Confirm #4246 is closed as superseded, not merged.
