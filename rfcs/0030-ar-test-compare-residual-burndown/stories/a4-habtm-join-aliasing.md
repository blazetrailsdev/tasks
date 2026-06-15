---
title: "A4 — habtm: alias intermediate join table"
status: claimed
updated: 2026-06-15
rfc: "0030-ar-test-compare-residual-burndown"
cluster: "associations"
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: "2026-06-15T20:25:53Z"
assignee: "a4-habtm-join-aliasing"
blocked-by: null
---

## Context

Part of RFC 0030-ar-test-compare-residual-burndown (test:compare residual burndown). habtm join query does not alias the intermediate join table; breaks self-join / same-named-table disambiguation. Fix in `associations/builder/has-and-belongs-to-many.ts`.

**13** `it.skip` tests to un-skip across 1 file(s) (deduped; permanent-skips — Marshal/YAML/thread/fork/Rational — excluded). For reference, `test:compare` reports **14** `matchedSkipped` for these files (snapshot 2026-06-15); any delta is permanent/​gated skips not on the un-skip list.

### Root causes (from `BLOCKED:`/`ROOT-CAUSE:` skip tags)

- habtm join query does not alias the intermediate join table when needed for disambiguation
- join table is not aliased in the generated SQL; conflicts with same-named tables in self-joins
- HABTM idsWriter→persistReplace SAVEPOINT lifecycle leaks across
- see "assign ids" above
- through association traversal with a polymorphic intermediate is not implemented
- eager_load/includes declared on the association is not passed through when finding in the collection
- CollectionProxy#transaction delegates to the association class's connection — not yet wired
- className resolution for namespaced models (e.g. "MyModule::Project") not handled in habtm lookup
- cross-namespace className resolution (namespaced owner → top-level target) not handled
- test relies on fixture data loaded by Rails fixture system; no equivalent in-memory fixture setup
- habtm across two databases requires multi-db connection routing — not yet implemented
- preloaded habtm collection does not expose a size that avoids a COUNT query
- belongs_to_required_by_default config not consulted when habtm creates its implicit belongs_to side

### Skipped tests to un-skip

- `associations/has_and_belongs_to_many_associations_test.rb` → `associations/has-and-belongs-to-many-associations.test.ts` — **13** to un-skip:
  - join middle table alias
  - join table alias
  - assign ids
  - assign ids ignoring blanks
  - has many through polymorphic has manys works
  - dynamic find should respect association include
  - association proxy transaction method starts transaction in association class
  - has and belongs to many in a namespaced model pointing to a namespaced model
  - has and belongs to many in a namespaced model pointing to a non namespaced model
  - habtm with reflection using class name and fixtures
  - alternate database
  - preloaded associations size
  - has and belongs to many is usable with belongs to required by default

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

- [ ] Every test listed above is un-skipped (`it.skip` → `it`) and passes against the canonical SQLite adapter (and PG/MySQL where the ruby gate applies).
- [ ] `pnpm test:compare --package activerecord` shows these files with no `it.skip`-based `matchedSkipped` (any residual reclassified to a permanent-skip with a recorded reason per the RFC Deferred table).
- [ ] No new gate-mismatches introduced for these files.
- [ ] Refresh the RFC snapshot count after merge.
