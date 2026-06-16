---
title: "E2 — PG array/uuid/hstore/virtual-column DDL-via-exec"
status: done
updated: 2026-06-16
rfc: "0030-ar-test-compare-residual-burndown"
cluster: "adapter"
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: 3453
claim: "2026-06-16T13:23:01Z"
assignee: "e2-pg-ddl-via-exec"
blocked-by: null
---

## Context

Part of RFC 0030-ar-test-compare-residual-burndown (test:compare residual burndown). PG schema-statements run DDL via exec() bypassing the migration framework; legacy Migration[5.0] flavor + fixtures dependence.

**9** `it.skip` tests to un-skip across 6 file(s) (deduped; permanent-skips — Marshal/YAML/thread/fork/Rational — excluded). For reference, `test:compare` reports **10** `matchedSkipped` for these files (snapshot 2026-06-15); any delta is permanent/​gated skips not on the un-skip list.

### Root causes (from `BLOCKED:`/`ROOT-CAUSE:` skip tags)

- schema statements run DDL via `exec()` (postgresql-adapter.ts:1986),
- schema-dumper.ts emitTable bypasses connection-adapter

### Skipped tests to un-skip

- `adapters/postgresql/array_test.rb` → `adapters/postgresql/array.test.ts` — **4** to un-skip:
  - change column cant make non array column to array
  - mutate value in array
  - datetime with timezone awareness
  - precision is respected on timestamp columns
- `adapters/postgresql/uuid_test.rb` → `adapters/postgresql/uuid.test.ts` — **2** to un-skip:
  - schema dumper for uuid primary key default in legacy migration
  - schema dumper for uuid primary key with default nil in legacy migration
- `adapters/postgresql/hstore_test.rb` → `adapters/postgresql/hstore.test.ts` — **1** to un-skip:
  - hstore migration
- `adapters/postgresql/virtual_column_test.rb` → `adapters/postgresql/virtual-column.test.ts` — **1** to un-skip:
  - schema dumping
- `adapters/postgresql/timestamp_test.rb` → `adapters/postgresql/timestamp.test.ts` — **0** un-skip targets (file's 1 counted skip(s) are gated via `describeIf*`/`skipIf`, not `it.skip`; verify during the story).
- `adapters/postgresql/foreign_table_test.rb` → `adapters/postgresql/foreign-table.test.ts` — **1** to un-skip:
  - does not have a primary key

## Test-writing direction

Write **Rails-faithful tests** — fidelity to the upstream Rails suite is the #1
priority, not green checkmarks:

- **Read the corresponding Rails test first** (`activerecord/test/cases/...`) and
  mirror its structure, models, and assertions. Never reword or rename a test.
- **Use the official/canonical schema** (`TEST_SCHEMA`, which mirrors Rails'
  `schema.rb`) and the **official canonical models** in
  `packages/activerecord/src/test-helpers/models/` — there are ~200 already ported
  (Author, Post, Tag, Tagging, Comment, Category, Categorization, and many more),
  matching Rails' `activerecord/test/models/`. Do **not** create your own custom
  tables or models: **table, column, and model names must match Rails exactly.**
  If Rails uses `Author`/`authors`, use the canonical `Author` model and `authors`
  table — never rename it, hand-roll a stand-in, or substitute a bespoke one.
- **Use `useHandlerFixtures`** for fixture-backed setup — the one-call wiring that
  mirrors Rails' `fixtures :name` + transactional tests. Look up the real
  fixtures Rails uses instead of hand-building records.
- **`defineSchema` is canonical-only.** It may pass **only** the canonical
  `TEST_SCHEMA` (the `blazetrails/require-canonical-schema` ESLint rule enforces
  this). Never hand-roll a bespoke per-test schema or free table name. Prefer
  `useHandlerFixtures` / `setupHandlerSuite` on the default canonical tables over
  `defineSchema` wherever possible.
- **Gating — check the exclude list first.** If your target file is still listed
  in `eslint/require-canonical-schema-exclude.json` (grandfathered), it is **not
  yet canonical** and the lint is OFF for it — un-skipping there would pile new
  tests onto bespoke schema. That file's **RFC 0019 canonical conversion must land
  first** (it converts the file to `TEST_SCHEMA` + canonical models/fixtures and
  **removes the file from the exclude list**). Do not un-skip ahead of it. If the
  canonical schema/models genuinely lack something the test needs, that is a 0019
  gap to fill (add it to the canonical schema), never a reason to reintroduce a
  bespoke `defineSchema`.
- **Skip rather than deviate.** If a test cannot pass without diverging from Rails
  behavior (an implementation gap, missing feature, or genuine divergence), do
  **not** contort the test, schema, or assertion to force it green. Leave it
  `it.skip` with a `BLOCKED:`/`ROOT-CAUSE:` tag and **file an upstream-fix story**
  via `pnpm tasks new <rfc-slug> <story-slug>` so the gap is tracked and converged
  separately. Always converge to Rails — never ratify a deviation.

## Resolution (PR #3453)

Investigation (verified on PG 17) found all 9 listed `it.skip` tests are blocked
by genuine cross-cutting framework/adapter gaps, not mechanical un-skips. Per the
RFC's "skip rather than deviate" rule they were **reclassified into the Deferred
table** with recorded reasons, and one convergence story filed per distinct gap:

- `pg-ddl-exec-exception-translation` — array change-column → StatementInvalid.
- `pg-array-oid-element-subtypes` — hstore[]/datetime[] tz/timestamp[] precision (3 array tests).
- `legacy-migration-5-0-uuid-default` — uuid legacy-migration schema dump (2 tests).
- `change-table-recorder-adapter-column-methods` — `t.hstore` in change_table recorder.
- `schema-dumper-emittable-virtual-column-options` — virtual-column schema dump.
- `model-loadschema-nil-primary-key-from-introspection` — foreign-table nil PK.

Also (RFC 0019): `foreign-table.test.ts` converted to canonical `TEST_SCHEMA.professors`

- official `Professor` model and removed from `require-canonical-schema-exclude.json`.

## Acceptance criteria

- [x] Every listed test resolved: un-skip blocked by a genuine gap → reclassified to the Deferred table with a recorded reason + a filed convergence story (RFC-sanctioned alternative to un-skip).
- [x] `test:compare` residual for these files reclassified to the RFC Deferred table with recorded reasons (no test forced green by deviating from Rails).
- [x] No new gate-mismatches introduced (comment-only on the skip side; `foreign-table.test.ts` canonical conversion is behavior-preserving).
- [x] RFC snapshot count unchanged — no test was un-skipped (all reclassified, not flipped to `it`), so `matchedSkipped` is unaffected by this PR.
