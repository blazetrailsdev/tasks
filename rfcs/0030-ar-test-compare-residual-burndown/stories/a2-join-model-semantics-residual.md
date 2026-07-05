---
title: "a2-join-model-semantics-residual"
status: blocked
updated: 2026-07-05
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps:
  - join-model-canonical-conversion
deps-rfc: []
est-loc: null
priority: 3
pr: null
claim: null
assignee: null
blocked-by: "Blocked behind RFC 0019 assoc-join-model-canonical (join-model.test.ts is grandfathered on require-canonical-schema-exclude.json). Convert the file to canonical TEST_SCHEMA + drop the exclude entry first, then un-skip here."
---

## Context

Follow-up to `a2-join-model-semantics` (RFC 0030). That story un-skipped 11 of
the 35 `it.skip` join-model tests in
`packages/activerecord/src/associations/join-model.test.ts` — the ones cleanly
implementable with the existing synthetic helper API (`loadHasMany`,
`loadHasManyThrough`, `association` proxy `push`/`size`/`sum`/`maximum`,
`includes` preload). Splitting the remaining work off keeps each PR under the
LOC ceiling (single test file, can't split across PRs).

The remaining **24** tests need features the current helpers/source don't yet
cover (STI through + `base_class`, piggyback `select`, polymorphic custom PK,
counter caches, abstract-parent eager loading, `pluralize_table_names: false`,
eager-load configuration-error messages, string joins, record-exists `include?`
without loading). Some require source changes in `associations/` or
`preloader.ts`, not just a test body.

Rails ref: `vendor/rails/activerecord/test/cases/associations/join_model_test.rb`.

### Skipped tests still to un-skip (24)

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
- has many going through polymorphic join model with custom primary key
- has many through with custom primary key on belongs to source
- has many through with custom primary key on has many source
- belongs to polymorphic with counter cache
- eager load has many through has many with conditions
- eager belongs to and has one not singularized
- add to join table with no id
- has many through collection size uses counter cache if it exists
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

- [ ] Each remaining test above is un-skipped and passes against the canonical
      SQLite adapter (and PG/MySQL where the ruby gate applies), implementing any
      required source support in `associations/` or `preloader.ts`.
- [ ] Any test that genuinely cannot converge is reclassified to a permanent-skip
      with a recorded reason per the RFC Deferred table (not left as a bare
      feature-gap `it.skip`).
- [ ] No new gate-mismatches for `join-model.test.ts`.
- [ ] Refresh the RFC snapshot count after merge.
      </content>
