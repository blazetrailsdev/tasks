---
title: "E3 — standalone-connection + multi-db connection handling"
status: claimed
updated: 2026-06-16
rfc: "0030-ar-test-compare-residual-burndown"
cluster: "adapter"
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: "2026-06-16T13:47:10Z"
assignee: "e3-connection-handling"
blocked-by: null
---

## Context

Part of RFC 0030-ar-test-compare-residual-burndown (test:compare residual burndown). StandaloneConnection parity + multi-db role connection handling + URL-config merge.

**6** `it.skip` tests to un-skip across 6 file(s) (deduped; permanent-skips — Marshal/YAML/thread/fork/Rational — excluded). For reference, `test:compare` reports **9** `matchedSkipped` for these files (snapshot 2026-06-15); any delta is permanent/​gated skips not on the un-skip list.

### Root causes (from `BLOCKED:`/`ROOT-CAUSE:` skip tags)

- connection-adapters/abstract/connection-handler.ts or abstract-adapter.ts#checkoutTimeout not raising correct error
- connection.ts or attribute-methods/connection.ts missing Rails parity

### Skipped tests to un-skip

- `connection_adapters/standalone_connection_test.rb` → `connection-adapters/standalone-connection.test.ts` — **0** un-skip targets (file's 4 counted skip(s) are gated via `describeIf*`/`skipIf`, not `it.skip`; verify during the story).
- `connection_adapters/connection_handlers_multi_db_test.rb` → `connection-adapters/connection-handlers-multi-db.test.ts` — **2** to un-skip:
  - multiple connections works in a threaded environment
  - loading relations with multi db connections
- `connection_adapters/merge_and_resolve_default_url_config_test.rb` → `connection-adapters/merge-and-resolve-default-url-config.test.ts` — **1** to un-skip:
  - invalid symbol config
- `connection_handling_test.rb` → `connection-handling.test.ts` — **1** to un-skip:
  - common APIs don't permanently hold a connection when permanent checkout is deprecated or disallowed
- `invalid_connection_test.rb` → `invalid-connection.test.ts` — **1** to un-skip:
  - inspect on Model class does not raise
- `type_caster/connection_test.rb` → `type-caster/connection.test.ts` — **1** to un-skip:
  - #type_for_attribute is not aware of custom types

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
