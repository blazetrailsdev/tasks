---
title: "A2 — join_model: has_many :through join-model semantics"
status: closed
updated: 2026-07-04
rfc: "0030-ar-test-compare-residual-burndown"
cluster: "associations"
deps:
  - join-model-canonical-conversion
deps-rfc: []
est-loc: 280
priority: 30
pr: 3405
claim: null
assignee: null
blocked-by: null
closed-reason: "superseded by join-model-canonical-conversion; PR #3405 closed unmerged (synthetic approach rejected as antipattern)"
---

## Context

Part of RFC 0030-ar-test-compare-residual-burndown (test:compare residual burndown). `associations/join-model.ts` / `preloader.ts` miss join-model (HMT) semantics.

**35** `it.skip` tests to un-skip across 1 file(s) (deduped; permanent-skips — Marshal/YAML/thread/fork/Rational — excluded). For reference, `test:compare` reports **35** `matchedSkipped` for these files (snapshot 2026-06-15); any delta is permanent/​gated skips not on the un-skip list.

### Root causes (from `BLOCKED:`/`ROOT-CAUSE:` skip tags)

- associations/join-model.ts or preloader.ts missing join-model semantics

### Skipped tests to un-skip

- `associations/join_model_test.rb` → `associations/join-model.test.ts` — **35** to un-skip:
  - polymorphic has many going through join model with find
  - polymorphic has many going through join model with include on source reflection
  - polymorphic has many going through join model with include on source reflection with find
  - polymorphic has many going through join model with custom select and joins
  - polymorphic has many going through join model with custom foreign key
  - polymorphic has many create model with inheritance and custom base class
  - polymorphic has many going through join model with inheritance
  - polymorphic has many going through join model with inheritance with custom class name
  - polymorphic has many create model with inheritance
  - polymorphic has one create model with inheritance
  - has many with piggyback
  - create through has many with piggyback
  - include polymorphic has one defined in abstract parent
  - include polymorphic has many through
  - has many going through polymorphic join model with custom primary key
  - has many through with custom primary key on belongs to source
  - has many through with custom primary key on has many source
  - belongs to polymorphic with counter cache
  - has many polymorphic associations merges through scope
  - eager load has many through has many with conditions
  - eager belongs to and has one not singularized
  - associating unsaved records with has many through
  - add to join table with no id
  - has many through collection size doesnt load target if not loaded
  - has many through collection size uses counter cache if it exists
  - adding junk to has many through should raise type mismatch
  - adding to has many through should return self
  - has many through sum uses calculations
  - calculations on has many through should disambiguate fields
  - calculations on has many through should not disambiguate fields unless necessary
  - preload polymorphic has many through
  - has many through include checks if record exists if target not loaded
  - has many with pluralize table names false
  - proper error message for eager load and includes association errors
  - eager association with scope with string joins

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
