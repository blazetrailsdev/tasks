---
title: "Audit .trails DDL tests: invented scratch tables have no Rails source (delete or canonicalize)"
status: in-progress
updated: 2026-07-01
rfc: "0048-one-schema-no-drop-tests"
cluster: "rails-deviation"
deps: []
deps-rfc: []
est-loc: 250
priority: 5
pr: 4376
claim: "2026-07-01T16:08:12Z"
assignee: "audit-trails-ddl-tests-invented-tables-vs-rails"
blocked-by: null
---

# Audit `.trails` DDL tests for invented scratch tables

**Self-contained fidelity work on `main`. No branch/flag/exclude-list
dependency.**

## Why

PR #4367 fixed the canonical-table scratching in the relocated `.trails` DDL
tests (no more `createTable("articles")`/`"users"`), but did it by renaming the
scratch tables to non-canonical names — and some of those, e.g. **`gizmos`** and
**`reminders`**, appear to be **invented**: they exist in no Rails test.

That does not meet the fidelity bar. `*.trails.test.ts` files are _trails-only_
cases with **no 1:1 Rails counterpart** — which means their scratch tables cannot
mirror a Rails source, because there is no Rails source. Per the RFC 0048
convergence contract: **a trails test whose tables/behavior have no Rails
counterpart is a bespoke suite — delete it, or replace it with the faithful Rails
test cases that cover the behavior.** Re-scratching on an invented name only
swaps one deviation for another.

## Scope

The relocated `.trails` DDL tests touched by #4367 and their scratch tables:

- `schema-dumper.trails.test.ts`, `migration.trails.test.ts`,
  `migrator.trails.test.ts`, `schema-introspection.trails.test.ts`,
  `adapters/mysql2/mysql2-adapter.trails.test.ts`
- Scratch tables introduced: `horses`, `testings`, `octopuses` (genuine Rails
  migration-test tables — OK), and `gizmos`, `reminders` (verify against Rails;
  likely invented).

## Acceptance criteria

- For each `.trails` DDL test case, determine whether the behavior it exercises
  exists in a real Rails test (`vendor/rails/activerecord/test/cases/**`):
  - **Has a Rails counterpart** → it is not "trails-only"; move it into the
    faithful port of that Rails file, mirroring Rails' exact scratch table
    name/assertions. It should not live in a `.trails` file.
  - **No Rails counterpart** → delete the case (or, if it tests genuinely
    trails-specific behavior that must be kept, document why in the test and use
    a table that is either canonical `TEST_SCHEMA` or a real Rails scratch name —
    never a freshly-invented one like `gizmos`/`reminders`).
- No `.trails` DDL test creates a table name that is neither in canonical
  `TEST_SCHEMA` nor used by an actual Rails test.
- `test:compare` does not regress.

## Notes

- Follow-up to #4367 (which resolved the canonical-collision but left invented
  scratch names). Companion to
  `fidelity-audit-canonical-scratch-and-bespoke-tables` and
  `converge-relocated-trails-scratch-tables`.
