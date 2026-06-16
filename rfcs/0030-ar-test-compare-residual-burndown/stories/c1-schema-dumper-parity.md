---
title: "C1 — schema_dumper parity"
status: done
updated: 2026-06-16
rfc: "0030-ar-test-compare-residual-burndown"
cluster: "unblockers"
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: 3426
claim: "2026-06-15T23:56:55Z"
assignee: "c1-schema-dumper-parity"
blocked-by: null
---

## Context

Part of RFC 0030-ar-test-compare-residual-burndown (test:compare residual burndown). `schema-dumper.ts` / `abstract/schema-statements.ts` missing Rails dump parity (columnSpec residuals after I-1).

**22** `it.skip` tests to un-skip across 1 file(s) (deduped; permanent-skips — Marshal/YAML/thread/fork/Rational — excluded). For reference, `test:compare` reports **22** `matchedSkipped` for these files (snapshot 2026-06-15); any delta is permanent/​gated skips not on the un-skip list.

### Root causes (from `BLOCKED:`/`ROOT-CAUSE:` skip tags)

- schema-dumper.ts or abstract/schema-statements.ts missing Rails parity

### Skipped tests to un-skip

- `schema_dumper_test.rb` → `schema-dumper.test.ts` — **22** to un-skip:
  - schema dumps index length
  - schema dump aliased types
  - schema dump includes length for mysql binary fields
  - schema dump includes length for mysql blob and text fields
  - schema does not include limit for emulated mysql boolean fields
  - schema dumps index type
  - schema dump includes limit on array type
  - schema dump allows array of decimal defaults
  - schema dump interval type
  - schema dump oid type
  - schema dump includes extensions
  - schema dump includes extensions in alphabetic order
  - schema dump include limit for float4 field
  - schema dump keeps enum intact if it contains comma
  - schema dump with timestamptz datetime format
  - timestamps schema dump before rails 7
  - timestamps schema dump before rails 7 with timestamptz setting
  - schema dump when changing datetime type for an existing app
  - schema dump with correct timestamp types via create table and t timestamptz
  - schema dump with correct timestamp types via add column before rails 7
  - schema dump with correct timestamp types via add column before rails 7 with timestamptz setting
  - schema dump with column infinity default

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
- **Move away from `defineSchema`** / bespoke per-test schemas. If the canonical
  schema seems to lack something, mirror Rails' own setup (canonical model +
  fixture) rather than hand-rolling a schema.
- **Skip rather than deviate.** If a test cannot pass without diverging from Rails
  behavior (an implementation gap, missing feature, or genuine divergence), do
  **not** contort the test, schema, or assertion to force it green. Leave it
  `it.skip` with a `BLOCKED:`/`ROOT-CAUSE:` tag and **file an upstream-fix story**
  via `pnpm tasks new <rfc-slug> <story-slug>` so the gap is tracked and converged
  separately. Always converge to Rails — never ratify a deviation.

## Acceptance criteria

- [x] Tests the dumper already supports were un-skipped and pass on SQLite/PG/MySQL (index length, mysql binary-field length + boolean no-limit, PG array/extensions/float4/enum/interval/oid). Genuine feature gaps were left `it.skip` with refreshed `BLOCKED` tags and tracked as scoped follow-up stories (mysql-gaps, pg-decimal-array, timestamptz/migration-version-compat, infinity, oid-introspection-limit). Delivered in PR #3426.
- [x] `test:compare` for `schema-dumper.test.ts`: 0 gate-mismatch; `matchedSkipped` reduced from 22 → residual deferrals, each reclassified with a recorded reason pointing at a tracked story.
- [x] No new gate-mismatches introduced for these files (test:compare gate count 0).
- [x] RFC snapshot count refreshed via the follow-up story restructure under RFC 0030.
