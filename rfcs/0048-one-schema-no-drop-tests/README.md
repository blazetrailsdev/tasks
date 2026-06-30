---
rfc: "0048-one-schema-no-drop-tests"
title: "Rails-faithful AR test convergence"
status: active
created: 2026-06-28
updated: 2026-06-30
owner: "@deanmarano"
packages:
  - "activerecord"
clusters:
  - "rails-deviation"
related-rfcs:
  - "0019-canonical-schema-burndown"
  - "0000-one-schema-no-drop-perf"
---

## Summary

Converge the ActiveRecord test suite to **faithful, word-for-word ports of the
corresponding Rails tests**, riding the canonical `TEST_SCHEMA` + official
fixtures/models. This is the same fidelity campaign RFC 0019 ran for the
bespoke-table burndown, extended to the remaining data-layer and DDL test files:
the deliverable is tests that mirror Rails' own `test/cases/**` — same test
names, same assertions, same table/column names — not trails-invented suites
that merely _touch_ canonical tables.

> **This RFC is fidelity-only.** The test-suite _performance_ mechanism it
> originally bundled (`AR_ONE_SCHEMA=1` no-`DROP TABLE` mode, spike PR #4246) has
> been split out to **RFC `0000-one-schema-no-drop-perf`** and is parked behind
> this one. Do **not** reference `AR_ONE_SCHEMA`, `one-schema-exclude.json`, or
> the no-drop machinery in convergence work here — that is the perf RFC's surface.

## Why this RFC was re-spec'd (2026-06-30)

The first cut of these stories asked agents to "convert each file to canonical
`TEST_SCHEMA`, match Rails table/column names." Agents satisfied that literally
with **shallow find-replace renames** — e.g. PR #4322 renamed `User`/`ssn` →
`EncryptedBook`/`name` and bolted on `_tableName = "encrypted_books"`, while
keeping trails-invented `describe`/`it` names and hand-rolled assertions that
exist nowhere in Rails. That passes the letter of the criteria and misses the
entire point. PR #4316 (core-attribute-methods) merged in that shallow form and
must be redone. All in-progress work was halted and the stories rewritten to the
contract below.

## Convergence contract (binding on every story in this RFC)

**Convergence = port the Rails test file, not rename the trails one.**

1. **Name the Rails source.** Each story names the exact Rails test file(s) to
   mirror under `vendor/rails/activerecord/test/cases/`. The default mapping is
   structural: `packages/activerecord/src/<area>/<name>.test.ts` ⇄
   `vendor/rails/activerecord/test/cases/<area>/<name>_test.rb`. A trails file
   with **no** 1:1 Rails counterpart is a bespoke suite — delete it and port the
   real Rails test cases that cover the behavior.
2. **Mirror names + assertions word-for-word** as closely as TypeScript allows.
   Test names are how `test:compare` maps trails tests to Rails; never invent,
   rename, or reword them. The Rails test body's setup, fixtures, and assertions
   are the spec — reproduce them, do not paraphrase.
3. **Ride canonical schema only.** Canonical `TEST_SCHEMA` + official
   `test-helpers/models/*` + real fixtures. No bespoke tables, no invented
   columns, and **no `_tableName` hacks** to paint a canonical name onto a
   bespoke test. If the canonical schema lacks something Rails' schema.rb has,
   add it to `TEST_SCHEMA`.
4. **Fix the impl, not the test.** If a faithful port surfaces a trails behavior
   gap, fix the implementation to match Rails, or file a deviation story under
   `0023-surfaced-deviations` and mark the case tracked-pending-convergence.
   Never bend the test to make it pass — fidelity over the gate (a temporary
   `test:compare` regression is acceptable and expected; record the un-skip
   follow-up).
5. **All-or-nothing per file.** A file converts to its faithful Rails form in one
   PR (split across PRs by file/sub-cluster under the 500-LOC ceiling), never a
   half-renamed hybrid.

## Scope (fidelity stories)

The data-layer + DDL converge clusters, each rewritten to the contract:
encryption, core-attribute-methods (redo of merged #4316), finder/enum/relation,
instrumentation, persistence/validations, query-cache, associations,
schema-dump/introspection, and the migration / migrator-stmtcache / pg-adapter-DDL
/ mysql-adapter-DDL tests (faithful ports of Rails' migration & adapter suites,
using Rails' own scratch-table names — `horses`, `testings` — never canonical
names as scratch).

## Out of scope (moved to RFC 0000-one-schema-no-drop-perf)

The no-`DROP TABLE` performance mechanism, the `AR_ONE_SCHEMA` flag + spike
PR #4246, `one-schema-exclude.json` burndown, per-backend flag-off coverage, and
the MariaDB date/multiparameter warm-cache reflection bug surfaced under
one-schema mode.

## Prerequisite

RFC 0019 (canonical-schema-burndown) is **complete** (closed; all stories done),
so the canonical tables these ports ride already exist.
