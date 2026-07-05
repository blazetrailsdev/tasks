---
title: "F1 — prevent-writes + hot-compat + misc tail"
status: blocked
updated: 2026-07-05
rfc: "0030-ar-test-compare-residual-burndown"
cluster: "core-residuals"
deps: []
deps-rfc: []
est-loc: 140
priority: 3
pr: null
claim: null
assignee: null
blocked-by: "Blocked behind RFC 0019 conversion of timestamp.test.ts (grandfathered; covered by 0019 timestamp-test-cluster / require-table-teardown-burndown-migration). Convert to canonical + drop the exclude entry first, then un-skip."
---

## Context

Part of RFC 0030-ar-test-compare-residual-burndown (test:compare residual burndown). preventingWrites enforcement, schema-cache hot reload, lazy-connection query cache, timestamp parity, db tasks tail.

**17** `it.skip` tests to un-skip across 8 file(s) (deduped; permanent-skips — Marshal/YAML/thread/fork/Rational — excluded). For reference, `test:compare` reports **13** `matchedSkipped` for these files (snapshot 2026-06-15); any delta is permanent/​gated skips not on the un-skip list.

### Root causes (from `BLOCKED:`/`ROOT-CAUSE:` skip tags)

- relation.ts or abstract-adapter.ts#executeMutation missing preventingWrites check for some query types
- timestamp.ts or attribute-methods/timestamp.ts missing Rails parity
- connection-adapters/abstract/connection-pool.ts or connection-adapters/abstract/connection-handler.ts missing Rails parity for pool lifecycle

### Skipped tests to un-skip

- `hot_compatibility_test.rb` → `hot-compatibility.test.ts` — **4** to un-skip:
  - insert after remove_column
  - update after remove_column
  - cleans up after prepared statement failure in a transaction
  - cleans up after prepared statement failure in nested transactions
- `adapter_prevent_writes_test.rb` → `adapter-prevent-writes.test.ts` — **1** to un-skip:
  - doesnt error when a select query has encoding errors
- `base_prevent_writes_test.rb` → `base-prevent-writes.test.ts` — **1** to un-skip:
  - preventing writes applies to all connections in block
- `query_cache_test.rb` → `query-cache.test.ts` — **5** to un-skip:
  - query cache with forked processes
  - query cache across threads
  - cache is available when using a not connected connection
  - query cache is enabled in threads with shared connection
  - threads use the same connection
- `timestamp_test.rb` → `timestamp.test.ts` — **1** to un-skip:
  - index is created for both timestamps
- `tasks/database_tasks_test.rb` → `tasks/database-tasks.test.ts` — **2** to un-skip:
  - raises an error when called with protected environment which name is a symbol
  - with multiple databases
- `primary_class_test.rb` → `primary-class.test.ts` — **2** to un-skip:
  - application record shares a connection with active record by default
  - application record shares a connection with the primary abstract class if set
- `active_record_test.rb` → `active-record.test.ts` — **1** to un-skip:
  - .disconnect_all! closes all connections

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

- [ ] Every test listed above is un-skipped (`it.skip` → `it`) and passes against the canonical SQLite adapter (and PG/MySQL where the ruby gate applies).
- [ ] `pnpm test:compare --package activerecord` shows these files with no `it.skip`-based `matchedSkipped` (any residual reclassified to a permanent-skip with a recorded reason per the RFC Deferred table).
- [ ] No new gate-mismatches introduced for these files.
- [ ] Refresh the RFC snapshot count after merge.
