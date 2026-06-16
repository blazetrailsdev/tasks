---
title: "C3 — primary_keys residuals"
status: done
updated: 2026-06-16
rfc: "0030-ar-test-compare-residual-burndown"
cluster: "core-residuals"
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: 3427
claim: "2026-06-16T00:12:53Z"
assignee: "c3-primary-keys"
blocked-by: null
---

## Context

Part of RFC 0030-ar-test-compare-residual-burndown (test:compare residual burndown). primary-key residuals (untagged — triage; likely CPK / custom-pk dump).

**9** `it.skip` tests to un-skip across 1 file(s) (deduped; permanent-skips — Marshal/YAML/thread/fork/Rational — excluded). For reference, `test:compare` reports **9** `matchedSkipped` for these files (snapshot 2026-06-15); any delta is permanent/​gated skips not on the un-skip list.

### Root causes (from `BLOCKED:`/`ROOT-CAUSE:` skip tags)

_Untagged — first task is to triage each skip and record a ROOT-CAUSE comment in the test file._

### Skipped tests to un-skip

- `primary_keys_test.rb` → `primary-keys.test.ts` — **9** to un-skip:
  - primary key returns nil if it does not exist
  - assign id raises error if primary key doesnt exist
  - schema dump primary key includes type and options
  - schema typed primary key column
  - collectly dump composite primary key
  - dumping composite primary key out of order
  - schema dump primary key integer with default nil
  - schema dump primary key bigint with default nil
  - schema dump primary key with serial/integer

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

- [x] 3 of 9 un-skipped and passing on sqlite/PG/MySQL (primary key returns nil, collectly dump composite primary key, schema typed primary key column); the other 6 are genuine impl gaps reclassified as deferred/permanent-skip with BLOCKED tags (see below).
- [x] `test:compare` shows `primary_keys_test.rb` matchedSkipped 9→6; the 6 residuals reclassified to the RFC Deferred table with recorded reasons (`cc-schema-dumper-pk-rendering`, `cc-id-setter-missing-attribute`).
- [x] No new gate-mismatches: api:compare unchanged (99.9%, 275/275); MySQL-gated test mirrors Rails `current_adapter?`.
- [x] RFC snapshot: primary_keys matchedSkipped now 6 (was 9); Deferred table updated.
