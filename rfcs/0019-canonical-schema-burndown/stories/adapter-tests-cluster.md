---
title: "adapters/ (sqlite / pg / mysql) → canonical schema or isolated-by-design"
status: in-progress
updated: 2026-06-17
rfc: "0019-canonical-schema-burndown"
cluster: fixtures
deps: []
deps-rfc: []
est-loc: 350
priority: 9
pr: 3551
claim: "2026-06-17T16:01:37Z"
assignee: "adapter-tests-cluster"
blocked-by: null
---

## Context

Convert (or explicitly mark isolated-by-design) the adapter test files. Unlike
the model-layer files, several of these **own their schema legitimately** — an
adapter/DDL test that creates and drops its own table is not a fidelity gap. For
those, a scoped `eslint-disable` with a one-line reason is acceptable; the bar
is "no shared-table collision," not "ride TEST_SCHEMA."

**Refine note (2026-06-17):** first attempt (PR #3118, claimed 2026-06-11) was
**closed unmerged** with no review — the cluster as originally scoped busts the
500-LOC PR ceiling. `sqlite3-adapter.test.ts` is 645 LOC on its own, so even a
pure canonical-conversion of that file alone exceeds the ceiling; it has been
**carved into its own story** (`sqlite3-adapter-test-canonical`) and is no longer
in scope here. `adapters/postgresql/foreign-table.test.ts` has already dropped
out of `eslint/require-canonical-schema-exclude.json` (handled elsewhere) — also
out of scope. This story now covers the remaining six small files, which
together fit comfortably in one PR.

Files in scope (verified in exclude JSON as of 2026-06-17; LOC are current):

- `adapters/abstract-mysql-adapter/mysql-explain.test.ts` (187 LOC) →
  `adapters/abstract_mysql_adapter/mysql_explain_test.rb`
- `adapters/abstract-mysql-adapter/schema.test.ts` (236 LOC) →
  `active_record_schema_test.rb`
- `adapters/postgresql/bind-parameter.test.ts` (70 LOC) → `bind_parameter_test.rb`
- `adapters/postgresql/define-schema-pg-types.test.ts` (72 LOC) — PG-types
  harness, no Rails counterpart; isolated-by-design
- `adapters/sqlite3/json.test.ts` (67 LOC) → `coders/json_test.rb`

Out of scope (carved out / already done):

- `adapters/sqlite3-adapter.test.ts` (645 LOC) → its own story
  `sqlite3-adapter-test-canonical` (over the 500-LOC ceiling on its own).
- `adapters/postgresql/foreign-table.test.ts` — no longer in the exclude JSON.

## Acceptance criteria

- [ ] For each file, decide: (a) model-layer test → ride `TEST_SCHEMA` + canonical
      models + fixtures; or (b) genuine adapter/DDL test owning its schema →
      keep its own table but ensure the name is **file-unique** (no shared-table
      collision) and add a scoped `eslint-disable` with a one-line reason.
- [ ] Where a Rails counterpart exists, match bodies word-for-word. Test names
      unchanged.
- [ ] Each file removed from the exclude JSON (category (a)) or carries a
      justified scoped disable (category (b)); no blanket file-level disables.
- [ ] `pnpm vitest run <each file>` passes on its target adapter (PG/MySQL files
      are CI-gated — verify on the right ARCONN).
- [ ] Total diff stays under the 500-LOC ceiling (these six files sum to ~630 LOC
      of test source; conversion is mostly mechanical so additions+deletions
      should land well under 500 — if not, split off the two MySQL files).

## Definition of done

Every in-scope adapter file either rides the canonical schema or owns a
file-unique table with a justified scoped disable. A blanket file-level
`eslint-disable` does **not** close this story.
