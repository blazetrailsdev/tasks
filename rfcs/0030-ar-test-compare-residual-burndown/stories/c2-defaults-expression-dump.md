---
title: "C2 — defaults: expression-default dump/load"
status: done
updated: 2026-06-16
rfc: "0030-ar-test-compare-residual-burndown"
cluster: "unblockers"
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 3425
claim: "2026-06-16T00:04:54Z"
assignee: "c2-defaults-expression-dump"
blocked-by: null
---

## Context

Part of RFC 0030-ar-test-compare-residual-burndown (test:compare residual burndown). dump_table_schema / schemaCreation does not preserve expression defaults (the defaults_test skips I-1 left).

**11** `it.skip` tests to un-skip across 1 file(s) (deduped; permanent-skips — Marshal/YAML/thread/fork/Rational — excluded). For reference, `test:compare` reports **13** `matchedSkipped` for these files (snapshot 2026-06-15); any delta is permanent/​gated skips not on the un-skip list.

### Root causes (from `BLOCKED:`/`ROOT-CAUSE:` skip tags)

- dump_table_schema / schemaCreation path does not preserve expression-default lambdas for MySQL.
- dump_table_schema not wired through Mysql2Adapter; no schema-dump path for MySQL in test suite.
- we have no way to reconfigure MySQL strict_mode per-connection in tests.

### Skipped tests to un-skip

- `defaults_test.rb` → `defaults.test.ts` — **11** to un-skip:
  - schema dump includes default expression
  - schema dump includes default expression with single quotes reflected correctly
  - schema dump datetime includes default expression
  - schema dump datetime includes precise default expression
  - schema dump datetime includes precise default expression with on update
  - schema dump timestamp includes default expression
  - schema dump timestamp includes precise default expression
  - schema dump timestamp includes precise default expression with on update
  - schema dump timestamp without default expression
  - mysql not null defaults non strict
  - mysql not null defaults strict

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

## Acceptance criteria

- [x] Every test listed above is un-skipped (`it.skip` → `it`) and passes against the canonical SQLite adapter (and PG/MySQL where the ruby gate applies). 9 of 11 pass on the MariaDB CI lane; the 2 `uuid()`/`concat()` dumps run on MySQL 8 and are `skipIf(isMariaDb)` (MariaDB reflection gap, tracked).
- [x] `pnpm test:compare --package activerecord` shows these files with no `it.skip`-based `matchedSkipped` — the 2 residuals are reclassified to an adapter-gated skip with a recorded reason (story [[c2-defaults-mariadb-expression-reflection]]).
- [x] No new gate-mismatches introduced for these files.
- [ ] Refresh the RFC snapshot count after merge.
