---
rfc: "0019-canonical-schema-burndown"
title: "Canonical-schema ratchet burndown — convert the AR test suite to TEST_SCHEMA + Rails fixtures, word-for-word"
status: active
created: 2026-06-09
updated: 2026-06-16
owner: "@deanmarano"
packages:
  - activerecord
clusters:
  - fixtures
---

<!-- Unnumbered until merge: keep `rfc:` as 0019-canonical-schema-burndown and
     the H1 below number-free. The supersede link is carried by 0014's
     `superseded-by: 0019-canonical-schema-burndown`; `scripts/finalize-rfc.mjs`
     swaps 0000 for the assigned number at merge (rewriting that pointer too). -->

# RFC 0019 — Canonical-schema ratchet burndown

## Summary

A ratcheting ESLint rule, **`blazetrails/require-canonical-schema`**
(`eslint/require-canonical-schema.mjs`), now hard-gates every table passed to
`defineSchema()` in an AR test: it must reference the canonical `TEST_SCHEMA`
(from `test-helpers/test-schema.js`) rather than re-declare the table inline.
New files are enforced; **123 pre-existing files are grandfathered** in
`eslint/require-canonical-schema-exclude.json`. This RFC is the program to
**burn that exclusion list to zero** — converting each grandfathered file onto
the canonical schema **and** the Rails fixtures model, and while we are in each
file, **bringing the test as close to its Rails counterpart as possible:
word-for-word test bodies, same assertions, same logic, same call structure.**

This is not a boilerplate trim. The conversion target is Rails' `test/cases`
shape, and the bar is fidelity, not just "the lint passes."

## Strict rule + relationship to RFC 0030

This RFC **gates [RFC 0030](../0030-ar-test-compare-residual-burndown/)** (the
`test:compare` 94→100 un-skip campaign). The two RFCs overlap on the same files,
and doing 0030's un-skips on a still-grandfathered file piles new tests onto
bespoke `defineSchema` — more cleanup later. So:

- **Strict rule.** `defineSchema()` may pass **only** the canonical `TEST_SCHEMA`.
  No bespoke per-test schemas, no free table names, anywhere. Prefer
  `useHandlerFixtures` / `setupHandlerSuite` on the default canonical tables over
  `defineSchema` entirely. The `blazetrails/require-canonical-schema` lint enforces
  this for every file **not** on `require-canonical-schema-exclude.json`.
- **Converting a file means removing it from the exclude list** in the same effort
  — that is what flips the lint ON for it and what "done" means for a file. A
  conversion PR that does not shrink the exclude list has not finished its file.
- **0030 is blocked behind this RFC per-file.** A 0030 un-skip story whose target
  file is grandfathered waits until that file's conversion here lands and the file
  is off the exclude list. The association front (0030 a1–a6 ↔ this RFC's
  `assoc-*` stories) is prioritized first (priority 1–2) since 5 agents are live
  in those files.
- **Large files convert over multiple PRs.** Files like `eager.test.ts`,
  `join-model.test.ts`, `transactions.test.ts`, `has-many-associations.test.ts`
  exceed the 500-LOC PR ceiling. Convert them in **≤500-LOC slices** (by
  describe-block / Rails test section), registering follow-on stories with
  `pnpm tasks new 0019-canonical-schema-burndown <slug>` as needed. Keep the file
  on the exclude list until the **final** slice makes it fully canonical, then
  remove the entry in that PR. Do **not** fan out sibling PRs yourself — one PR per
  claimed slice; register the rest as stories.

## Relationship to RFC 0014 (supersede)

RFC 0014 (`0014-fixtures-adoption`, `active`) studied the same suite and
concluded: **defer the sweep — broad conversion is low-yield, keep it
opportunistic.** That conclusion was correct _given its inputs_ (a blind
file-count sweep yields ~8%; the suite is overwhelmingly bespoke).

**The ratchet changes the calculus, so this RFC supersedes 0014.** Three things
are now different:

1. **There is an enforced, enumerated list.** `require-canonical-schema-exclude.json`
   is a concrete 123-entry baseline with CI teeth. Burndown is no longer "convert
   files in the abstract" — it is "drive a specific committed number to zero,"
   which is trackable, ownable, and backslide-proof (the ratchet rejects new
   inline schemas).
2. **The unit of value changed.** 0014 measured _mechanical convertibility_. This
   RFC's value is **Rails fidelity** — every file we touch becomes a faithful port
   of its Rails counterpart, which is the project's north star (CLAUDE.md /
   CONTRIBUTING.md: `test:compare` matches on test names; we want bodies to match
   too). That value accrues even on "bespoke" files.
3. **The collision hazard is now a forcing function.** The bespoke inline schemas
   are the _direct cause_ of the shared-worker-DB flakes documented in the
   `posts`/`items`/`people`-table flake memories. The ratchet is the lever that
   finally removes them.

0014's one pickable story (opportunistic Tier-1) is subsumed here. This PR flips
`0014` to `status: superseded` with `superseded-by:` this RFC; at merge
`finalize-rfc.mjs` rewrites that `0000-` pointer to the assigned number.

## Do as Rails does (the fidelity bar)

Our test infra is a 1:1 mirror of Rails' fixtures model — converting a file
means moving it onto that shape, never inventing one (table reproduced from
0014, which got it right):

| Rails (`activerecord/…`)                           | trails mirror                                                         |
| -------------------------------------------------- | --------------------------------------------------------------------- |
| `fixtures :name` macro + `name(:label)` accessor   | `useFixtures` (`test-helpers/use-fixtures.ts`)                        |
| `use_transactional_tests = true` (default)         | `useTransactionalTests` (`test-helpers/use-transactional-tests.ts`)   |
| class-level `fixtures` + transactional wrap        | `useHandlerFixtures` (`test-helpers/use-handler-fixtures.ts`)         |
| `ActiveRecord::FixtureSet`, `test/fixtures/*.yml`  | the fixtures registry (`test-helpers/fixtures-registry.ts`)           |
| canonical shared schema (`schema.rb`, loaded once) | `TEST_SCHEMA` (`test-helpers/test-schema.ts`), seeded via globalSetup |

**The converged target shape — no `defineSchema` in the file.** The full
canonical schema (all of `TEST_SCHEMA`) is built **once per worker** by
`test-helpers/template-global-setup.ts` (`defineSchema(adapter, TEST_SCHEMA)`),
so the tables already exist before any test runs. A converged file therefore
calls `defineSchema` **zero** times and constructs no `createTestAdapter` — it
wires data with `setupHandlerSuite()` + `useHandlerFixtures([...])` (which
bundles the handler suite + transactional rollback + fixtures) and reads rows by
`name(:label)`. The 37 files already on `useHandlerFixtures` call `defineSchema`
0 times — that is the end state.

Note the two tiers, because the `require-canonical-schema` lint only enforces
the weaker one: `defineSchema(TEST_SCHEMA.posts)` is **lint-green but still
transitional** (it shouldn't appear in a converged file at all); the deliverable
is the `useHandlerFixtures` shape with no `defineSchema`. (There is no
`defineHandlerFixtures` symbol — the helper is `useHandlerFixtures`.) `defineSchema`
the function does not disappear: it stays as the global-setup primitive and for
genuine adapter/DDL tests that legitimately own a bespoke table.

A faithful conversion of one file is:

1. **Schema** — remove `defineSchema` from the file entirely and ride the
   pre-built `TEST_SCHEMA` via `useHandlerFixtures`. If the file needs a column
   the canonical schema lacks, **add it to `TEST_SCHEMA` only when Rails'
   `schema.rb` has it** (parity check first), else keep a single scoped,
   file-unique scratch table (`aco_people`, `sr_people`, …) — declared with a
   narrowly-scoped `defineSchema` + teardown — so it cannot clobber the shared
   one. **Renaming a table is allowed; renaming a test is not.**
2. **Models** — replace inline `class X extends Base` with the **canonical model**
   from the registry (PR #2766 / PessimisticLocking is the gold standard; the
   shallow #2764 boilerplate-only trim is the anti-pattern — see
   `feedback_fixtures_migration_rails_fidelity`).
3. **Rows** — load via `fixtures :name` + `name(:label)` lookups, not inline
   row literals, wherever the Rails test does.
4. **Bodies** — **rewrite each test to match the Rails source word-for-word**:
   same assertion calls in the same order, same variable names where the language
   allows, same control structure, same comments. Open the Rails `*_test.rb`
   first; the goal is a reader can diff the two side-by-side. **Never rename a
   test** (CLAUDE.md) — `test:compare` matches on names.

A conversion that swaps the schema but leaves the body diverging from Rails is
**not done**. Fidelity is the deliverable.

**Exception — framework-internal files with no Rails counterpart.** A handful of
the 123 are trails-internal tests with no 1:1 Rails source file (e.g.
`association-scope*`, `bigint-roundtrip`; flagged per-file in the stories). For
those, step 4 (body fidelity) does not apply — there is nothing to match — so the
bar reduces to steps 1–3: ride the canonical schema + fixtures, no inline tables.
The story file calls these out explicitly so they are not held to a
non-existent counterpart.

## Motivation

State measured `2026-06-09` on `main`:

| Metric                                                         |   Count |
| -------------------------------------------------------------- | ------: |
| Files grandfathered in `require-canonical-schema-exclude.json` | **123** |
| …under `associations/`                                         |      37 |
| …under `relation/`                                             |      19 |
| …under `validations/`                                          |       6 |
| …under `scoping/`                                              |       3 |
| …under `adapters/`                                             |       7 |
| …under `encryption/`                                           |       2 |
| …top-level core                                                |      49 |

Each entry is a file still declaring its own tables inline. That inline schema is
the root cause of the shared-worker-DB collision flakes (`posts`/`items`/`people`
tables redefined with divergent column sets across parallel forks — see the
flake memories). It is also a fidelity gap: a bespoke `class X extends Base` is
almost never what the Rails test uses.

The companion local docs in trails — `defineschema-to-fixtures-migration.md`
(performance-ordered), `fixtures-adoption-inventory.md`,
`fixtures-migration-backlog.md` — are inputs. This RFC reframes their content
around the ratchet and the fidelity bar.

## Design

### Burndown mechanics

- **One story per Rails source-file group.** A story owns the conversion of one
  Rails `*_test.rb`'s worth of tests (usually one trails file; sometimes a small
  cohesive cluster of sibling files). Big files (`calculations` ~7240 LOC,
  `eager` ~5585, `relations` ~6917, `has-many-associations`) ship **per-`describe`
  across sibling PRs off `main`** — non-overlapping files, **not stacked**
  (CLAUDE.md).
- **Each PR removes its file(s) from the exclude JSON** as the last step, only
  after the file lint-passes `require-canonical-schema` with zero
  `eslint-disable`. The shrinking JSON _is_ the burndown metric.
- **`eslint-disable` is a last resort, not a shortcut.** A genuinely
  un-canonical table (an adapter/DDL test that owns its schema) may keep a
  scoped `// eslint-disable-next-line blazetrails/require-canonical-schema` with a
  one-line reason — but the file still gets the **fidelity** treatment (bodies
  matched to Rails). "Disable the lint and move on" does not close a story.
- **PR ceiling 500 LOC** (CLAUDE.md). Conversions are large; expect most stories
  to be multi-PR. Do **not** fan out sibling PRs yourself — ship the portion that
  fits and register the remainder as a new story via
  `pnpm tasks new canonical-schema-burndown <story-slug>`.

### Collision-table convergence (enabling work)

The `people` / `posts` / `items` / HABTM-join scratch tables are redefined with
divergent shapes across many files. Converting one consumer in isolation can be
**wrong-skipped** by the signature cache when a divergent sibling re-primes it in
the same worker (the #2766 / Story 7.4 reproduction). So convergence of each
shared table is an **early enabling story** (`shared-table-convergence`) that the
collision-prone clusters depend on: rename every column-incompatible scratch
definition to a file-unique name, convert the column-compatible ones to the
canonical model. Verify by co-running the previously-flaky siblings under
`maxForks=1` (per CLAUDE.md, never the whole suite).

### Verification per story

- `pnpm vitest run <touched files>` (+ the colliding sibling under `maxForks=1`
  when a shared table is involved). **Never** the whole AR suite locally.
- `pnpm lint` on the touched files shows zero `require-canonical-schema` errors.
- `test:compare` for the file's Rails counterpart still matches by name (we never
  rename tests) and ideally now matches more bodies.
- The file is removed from `require-canonical-schema-exclude.json`.

## Ordering (Rails-fidelity first)

Stories are prioritized by **fidelity yield**: files with a clean 1:1 Rails
counterpart and small, already-canonical-shaped models convert to the highest
fidelity for the least risk, so they go first. The largest and most bespoke
`associations/` tree — biggest collision surface, hardest to match word-for-word
— goes last, after `shared-table-convergence` lands. Adapter/encryption files
(adapter-gated in CI) are lowest priority.

`priority` frontmatter integers: **lower = earlier**. Tiers:

- **P1 — clean, high-fidelity:** `shared-table-convergence` (enabling), validations,
  scoping, relation query-method clusters, attribute/type clusters, serialization,
  secure/token.
- **P2 — core:** relation-core, calculations/aggregations, persistence/dup,
  callbacks/transactions, inheritance/modules, misc core.
- **P3 — associations (large, collision-prone):** the `associations/` tree +
  autosave + eager + through + disable-joins.
- **P4 — adapter / encryption (adapter-gated):** `adapters/*`, `encryption/*`.

## Rollout

1. **P1 enabling + clean clusters** — `shared-table-convergence`,
   `validations-suite`, `scoping-suite`, `relation-where-cluster`,
   `relation-select-order-cluster`, `relation-mutation-cluster`,
   `attribute-types-cluster`, `serialization-cluster`, `secure-token-cluster`.
2. **P2 core** — `relation-core-cluster`, `calculations-aggregations`,
   `persistence-dup-cluster`, `callbacks-transactions-cluster`,
   `inheritance-modules-cluster`, `misc-core-cluster`.
3. **P3 associations** — `associations-collection-cluster`,
   `associations-eager-join-cluster`, `associations-through-nested-cluster`,
   `associations-disable-joins-cluster`, `hmt-disable-joins-conversion`
   (framework-blocked), `associations-scope-cache-cluster`.
4. **P4 adapter/encryption** — `adapter-tests-cluster`, `encryption-cluster`.

Each cluster story enumerates its files, splits per-`describe` as needed, and
removes its files from the exclude JSON as it lands.

## Alternatives considered

- **Keep 0014's "defer" posture; only opportunistic conversion.** Rejected: the
  ratchet exists precisely so this is no longer a vague sweep. Leaving 123 files
  grandfathered indefinitely keeps the collision flakes and the fidelity gap.
- **Amend 0014 in place rather than supersede.** Rejected (per RFC owner): the
  posture reversal (defer → burn down) plus a new primary axis (fidelity) is a
  clean break; a fresh RFC reads more honestly than a heavily-rewritten 0014.
- **Slice per-file (123 stories) or by shared table.** Rejected (per RFC owner):
  group by Rails source file so each story is a faithful port unit; per-file is
  too many stories and per-table optimizes for performance, not fidelity (though
  `shared-table-convergence` borrows the per-table model where collisions force
  it).
- **Auto-fix the schema reference, skip the body rewrite.** Rejected: that is the
  #2764 anti-pattern. The lint passing is necessary but not sufficient; fidelity
  is the deliverable.
- **Also burn down `expected-fixtures` (58) and `test-fixture-parity` (3).**
  Out of scope (per RFC owner): this RFC is scoped to `require-canonical-schema`
  only. The other two ratchets can get their own RFCs.

## Open questions

1. **Add columns to `TEST_SCHEMA` vs rename scratch tables.** Default: rename
   unless Rails' `schema.rb` carries the column (parity-justified). Adding to
   `TEST_SCHEMA` costs MySQL globalSetup time linearly in slots (no TEMPLATE).
   Recommendation: rename by default; promote to `TEST_SCHEMA` only on parity +
   ≥2 consumers.
2. **Files already body-ported but still inline-schema** (e.g. length-validation,
   assoc/callbacks per memory) — these are near-mechanical (swap schema ref only).
   Should they be fast-tracked within their cluster? Recommendation: yes, call
   them out in the story as the quick wins, but still verify body fidelity.

## Stories

Each row is a **cluster**, not a single PR. `Est LOC` is the per-PR slice ceiling
(≤500, the claimable unit), **not** the cluster total — large clusters
(`calculations`, `eager`, `relations`, `has-many`, `associations`) span several
PRs and register continuation stories via `pnpm tasks new` as they progress.

<!-- generated: stories table -->

| ID                                                                                                                                    | Title                                                                                                                                                                       | Status  | Est LOC | Cluster  |
| ------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------- | -------- |
| [aggregations-remaining-describes](stories/aggregations-remaining-describes.md)                                                       | aggregations.test.ts — retire remaining non-Rails describes + drop exclude                                                                                                  | ready   | 250     | fixtures |
| [assoc-autosave](stories/assoc-autosave.md)                                                                                           | Port autosave-association.test.ts to canonical schema                                                                                                                       | ready   | 500     | fixtures |
| [assoc-belongs-to](stories/assoc-belongs-to.md)                                                                                       | Port belongs-to-associations.test.ts to canonical schema                                                                                                                    | ready   | 500     | fixtures |
| [assoc-collection-proxy](stories/assoc-collection-proxy.md)                                                                           | Port collection-proxy.test.ts to canonical schema                                                                                                                           | ready   | 300     | fixtures |
| [assoc-eager-split-canonical-default-scope](stories/assoc-eager-split-canonical-default-scope.md)                                     | eager.test.ts → canonical: default-scope cluster                                                                                                                            | ready   | 300     | —        |
| [assoc-eager-split-canonical-habtm](stories/assoc-eager-split-canonical-habtm.md)                                                     | eager.test.ts → canonical: habtm cluster                                                                                                                                    | ready   | 300     | —        |
| [assoc-eager-split-canonical-hmt](stories/assoc-eager-split-canonical-hmt.md)                                                         | eager.test.ts → canonical: has_many-through cluster                                                                                                                         | ready   | 300     | —        |
| [assoc-eager-split-canonical-inheritance](stories/assoc-eager-split-canonical-inheritance.md)                                         | eager.test.ts → canonical: inheritance/STI cluster                                                                                                                          | ready   | 300     | —        |
| [assoc-eager-split-canonical-misc](stories/assoc-eager-split-canonical-misc.md)                                                       | eager.test.ts → canonical: misc cluster                                                                                                                                     | ready   | 300     | —        |
| [assoc-eager-split-canonical-nested-has-one](stories/assoc-eager-split-canonical-nested-has-one.md)                                   | eager.test.ts → canonical: nested-through-has-one cluster                                                                                                                   | ready   | 300     | —        |
| [assoc-eager-split-canonical-preloading](stories/assoc-eager-split-canonical-preloading.md)                                           | eager.test.ts → canonical: preloading cluster                                                                                                                               | ready   | 300     | —        |
| [assoc-extension-canonical](stories/assoc-extension-canonical.md)                                                                     | extension.test.ts → canonical schema (posts-collision)                                                                                                                      | ready   | 250     | fixtures |
| [assoc-has-many-residual-schemas](stories/assoc-has-many-residual-schemas.md)                                                         | Converge has-many-associations.test.ts residual bespoke schemas → drop exclude entry                                                                                        | ready   | 400     | fixtures |
| [assoc-has-many-through](stories/assoc-has-many-through.md)                                                                           | Port has-many-through-associations.test.ts to canonical schema (split per-describe)                                                                                         | ready   | 500     | fixtures |
| [assoc-has-one-writer-persist](stories/assoc-has-one-writer-persist.md)                                                               | assoc-has-one-writer-persist                                                                                                                                                | ready   | 120     | —        |
| [assoc-required-loader-rails-reconcile](stories/assoc-required-loader-rails-reconcile.md)                                             | Reconcile non-Rails tests in required/loader-methods to Rails fidelity                                                                                                      | ready   | 150     | fixtures |
| [association-relation-test-canonical](stories/association-relation-test-canonical.md)                                                 | association-relation.test.ts → canonical (rewrite off synthetic ar_blogs/ar_posts)                                                                                          | ready   | 150     | fixtures |
| [association-scope-alias-tracker-test-canonical](stories/association-scope-alias-tracker-test-canonical.md)                           | association-scope-alias-tracker.test.ts → canonical (self-ref off synthetic at_users)                                                                                       | ready   | 120     | fixtures |
| [association-scope-cache-test-canonical](stories/association-scope-cache-test-canonical.md)                                           | association-scope-cache.test.ts → canonical (rewrite cache\_\* onto canonical authors/posts/comments)                                                                       | ready   | 150     | fixtures |
| [association-scope-test-canonical](stories/association-scope-test-canonical.md)                                                       | association-scope.test.ts → canonical (rewrite resolver edge cases onto canonical STI/polymorphic tables)                                                                   | ready   | 400     | fixtures |
| [associations-disable-joins-cluster](stories/associations-disable-joins-cluster.md)                                                   | disable-joins association family → canonical schema + Rails fixtures                                                                                                        | ready   | 450     | fixtures |
| [associations-through-nested-cluster](stories/associations-through-nested-cluster.md)                                                 | through / nested-through associations → canonical schema + Rails fixtures                                                                                                   | ready   | 500     | fixtures |
| [attributes-test-cluster](stories/attributes-test-cluster.md)                                                                         | attributes.test.ts → attributes_test.rb canonical schema port                                                                                                               | ready   | 400     | fixtures |
| [autosave-association-canonical-conversion](stories/autosave-association-canonical-conversion.md)                                     | Convert autosave-association.test.ts to canonical TEST_SCHEMA + official models                                                                                             | ready   | 500     | —        |
| [batches-test-canonical](stories/batches-test-canonical.md)                                                                           | batches.test.ts -> batches_test.rb canonical port                                                                                                                           | ready   | 400     | fixtures |
| [calculations-test-canonical](stories/calculations-test-canonical.md)                                                                 | calculations.test.ts → canonical schema + Rails fixtures (per-describe series)                                                                                              | ready   | 500     | fixtures |
| [callbacks-test-canonical](stories/callbacks-test-canonical.md)                                                                       | callbacks.test.ts → canonical schema + Rails fixtures (split per-describe)                                                                                                  | ready   | 300     | fixtures |
| [collection-cache-key-canonical](stories/collection-cache-key-canonical.md)                                                           | collection-cache-key.test.ts → collection_cache_key_test.rb canonical port                                                                                                  | ready   | 200     | fixtures |
| [constructor-form-hmt-insert-canonical](stories/constructor-form-hmt-insert-canonical.md)                                             | constructor-form-and-hmt-insert.test.ts → canonical (internal, no Rails counterpart)                                                                                        | ready   | 150     | fixtures |
| [converge-bespoke-accounts-test-schemas](stories/converge-bespoke-accounts-test-schemas.md)                                           | Converge bespoke accounts test schemas to canonical (firm_id) to remove shared-DB collisions                                                                                | ready   | 120     | —        |
| [counter-cache-test-canonical](stories/counter-cache-test-canonical.md)                                                               | counter-cache.test.ts → canonical schema + Rails fixtures                                                                                                                   | ready   | 300     | fixtures |
| [date-test-mysql-native](stories/date-test-mysql-native.md)                                                                           | date.test.ts → date_test.rb canonical port + native MySQL date columns                                                                                                      | ready   | 120     | fixtures |
| [defaults-test-cluster](stories/defaults-test-cluster.md)                                                                             | defaults.test.ts → defaults_test.rb canonical schema port                                                                                                                   | ready   | 350     | fixtures |
| [excluding-test-canonical](stories/excluding-test-canonical.md)                                                                       | excluding.test.ts -> excluding_test.rb canonical port                                                                                                                       | ready   | 200     | fixtures |
| [extend-schema-repair-reap-leaked-bespoke-tables](stories/extend-schema-repair-reap-leaked-bespoke-tables.md)                         | Extend repairWorkerSchema to safely reap leaked bespoke tables (shared-DB)                                                                                                  | ready   | 120     | —        |
| [habtm-join-table-convergence](stories/habtm-join-table-convergence.md)                                                               | Converge bespoke HABTM-join scratch tables to file-unique names                                                                                                             | ready   | 200     | fixtures |
| [harden-orders-table-shared-db-collision](stories/harden-orders-table-shared-db-collision.md)                                         | aggregations.test.ts redefines orders without billing/shipping cols, poisons autosave-association on shared worker DB                                                       | ready   | 40      | —        |
| [inheritance-modules-reflection-followup](stories/inheritance-modules-reflection-followup.md)                                         | inheritance / inherited / modules / reflection → canonical (followup: still excluded after #3112)                                                                           | ready   | 500     | fixtures |
| [items-table-convergence](stories/items-table-convergence.md)                                                                         | Converge bespoke items scratch tables to file-unique names                                                                                                                  | ready   | 200     | fixtures |
| [json-serialization-canonical](stories/json-serialization-canonical.md)                                                               | json_serialization_test.rb → canonical models + fixtures                                                                                                                    | ready   | 300     | fixtures |
| [json-test-serialized-topic-rides-canonical](stories/json-test-serialized-topic-rides-canonical.md)                                   | json-test-serialized-topic-rides-canonical                                                                                                                                  | ready   | 30      | —        |
| [materialize-declares-generator-fixes](stories/materialize-declares-generator-fixes.md)                                               | Materialize model declares: virtualizer/walker gap fixes (post/author/comment)                                                                                              | ready   | 200     | —        |
| [materialize-declares-rollout-remaining](stories/materialize-declares-rollout-remaining.md)                                           | Materialize declares: roll generator over the 28 models skipped by PR #3545                                                                                                 | ready   | 400     | —        |
| [materialize-declares-strip-asany](stories/materialize-declares-strip-asany.md)                                                       | Materialize model declares: migrate test-local model classes + strip redundant as any                                                                                       | ready   | 300     | —        |
| [named-scoping-suite](stories/named-scoping-suite.md)                                                                                 | named-scoping/ → canonical schema + Rails fixtures                                                                                                                          | ready   | 400     | fixtures |
| [normalized-attribute-test-cluster](stories/normalized-attribute-test-cluster.md)                                                     | normalized-attribute.test.ts → normalized_attribute_test.rb canonical schema port                                                                                           | ready   | 200     | fixtures |
| [posts-table-convergence](stories/posts-table-convergence.md)                                                                         | Converge bespoke posts scratch tables to file-unique names                                                                                                                  | ready   | 200     | fixtures |
| [querying-finder-canonical](stories/querying-finder-canonical.md)                                                                     | querying.test.ts + querying-methods-delegation.test.ts -> finder_test.rb canonical port                                                                                     | ready   | 300     | fixtures |
| [relation-composite-where](stories/relation-composite-where.md)                                                                       | relation/composite-where.test.ts → canonical CPK models + where_test.rb composite cases                                                                                     | ready   | 150     | fixtures |
| [relation-merge-hash-and-proc-fidelity](stories/relation-merge-hash-and-proc-fidelity.md)                                             | Relation#merge hash-dispatch + proc-arg fidelity (2 impl bugs)                                                                                                              | ready   | 150     | fixtures |
| [relation-merging](stories/relation-merging.md)                                                                                       | relation/merging.test.ts → canonical schema + merging_test.rb                                                                                                               | ready   | 250     | fixtures |
| [relation-mutation-cluster-followup](stories/relation-mutation-cluster-followup.md)                                                   | relation/ mutation cluster (cont.) → canonical schema + Rails fixtures                                                                                                      | ready   | 400     | fixtures |
| [relation-or](stories/relation-or.md)                                                                                                 | relation/or.test.ts → canonical schema + or_test.rb                                                                                                                         | ready   | 250     | fixtures |
| [relation-predicate-builder](stories/relation-predicate-builder.md)                                                                   | relation/predicate-builder.test.ts → canonical schema + predicate_builder_test.rb                                                                                           | ready   | 150     | fixtures |
| [relation-scoping-suite](stories/relation-scoping-suite.md)                                                                           | relation-scoping/ → canonical schema + Rails fixtures                                                                                                                       | ready   | 400     | fixtures |
| [relation-test-canonical](stories/relation-test-canonical.md)                                                                         | relation.test.ts -> relation_test.rb canonical port                                                                                                                         | ready   | 300     | fixtures |
| [relation-thenable-canonical](stories/relation-thenable-canonical.md)                                                                 | relation/thenable.test.ts → canonical schema (internal, no Rails counterpart)                                                                                               | ready   | 120     | fixtures |
| [relation-where-chain](stories/relation-where-chain.md)                                                                               | relation/where-chain.test.ts → canonical schema + where_chain_test.rb                                                                                                       | ready   | 200     | fixtures |
| [relation-where-core](stories/relation-where-core.md)                                                                                 | relation/where.test.ts → canonical schema + where_test.rb/relations_test.rb                                                                                                 | ready   | 300     | fixtures |
| [relations-test-canonical](stories/relations-test-canonical.md)                                                                       | relations.test.ts -> relations_test.rb canonical port (split per-describe)                                                                                                  | ready   | 500     | fixtures |
| [remove-pg-mysql-test-retry-after-flake-burndown](stories/remove-pg-mysql-test-retry-after-flake-burndown.md)                         | Remove PG/MySQL test retry:2 once shared-DB flake class is provably gone                                                                                                    | ready   | 20      | —        |
| [serialized-attribute-canonical](stories/serialized-attribute-canonical.md)                                                           | serialized_attribute_test.rb → canonical models + fixtures                                                                                                                  | ready   | 400     | fixtures |
| [store-canonical](stories/store-canonical.md)                                                                                         | store_test.rb → canonical Admin::User + fixtures                                                                                                                            | ready   | 400     | fixtures |
| [strict-loading-canonical-schema](stories/strict-loading-canonical-schema.md)                                                         | strict-loading.test.ts + strict-loading-sync-reader.test.ts → canonical schema                                                                                              | ready   | 400     | fixtures |
| [suppressor-canonical-schema](stories/suppressor-canonical-schema.md)                                                                 | suppressor.test.ts → canonical Notification/User (needs save-suppression impl fix)                                                                                          | ready   | 120     | fixtures |
| [timestamp-test-cluster](stories/timestamp-test-cluster.md)                                                                           | timestamp.test.ts → timestamp_test.rb canonical schema port                                                                                                                 | ready   | 500     | fixtures |
| [topic-serialize-content-read-null-convergence](stories/topic-serialize-content-read-null-convergence.md)                             | topic-serialize-content-read-null-convergence                                                                                                                               | ready   | null    | —        |
| [touch-later-test-canonical](stories/touch-later-test-canonical.md)                                                                   | touch-later.test.ts → canonical Topic/Owner/Pet + fixtures                                                                                                                  | ready   | 200     | fixtures |
| [transaction-callbacks-test-canonical](stories/transaction-callbacks-test-canonical.md)                                               | transaction-callbacks.test.ts → canonical schema + Rails fixtures                                                                                                           | ready   | 250     | fixtures |
| [transactions-test-canonical](stories/transactions-test-canonical.md)                                                                 | transactions.test.ts → canonical schema (split per-describe)                                                                                                                | ready   | 300     | fixtures |
| [updateall-parenthesize-subquery-value](stories/updateall-parenthesize-subquery-value.md)                                             | updateall-parenthesize-subquery-value                                                                                                                                       | ready   | null    | —        |
| [validations-association](stories/validations-association.md)                                                                         | validations/association-validation → canonical schema + Rails fixtures                                                                                                      | ready   | 200     | fixtures |
| [validations-core](stories/validations-core.md)                                                                                       | validations_test.rb (validations.test.ts) → canonical Topic/Person + fixtures                                                                                               | ready   | 300     | fixtures |
| [validations-numericality](stories/validations-numericality.md)                                                                       | validations/numericality-validation → NumericData canonical model + fixtures                                                                                                | ready   | 200     | fixtures |
| [validations-uniqueness](stories/validations-uniqueness.md)                                                                           | validations/uniqueness-validation → canonical schema + Rails fixtures                                                                                                       | ready   | 300     | fixtures |
| [persistence-test-canonical-wave14](stories/persistence-test-canonical-wave14.md)                                                     | persistence-test-canonical-wave14                                                                                                                                           | claimed | null    | —        |
| [save-bang-validation-before-guards-layering](stories/save-bang-validation-before-guards-layering.md)                                 | save-bang-validation-before-guards-layering                                                                                                                                 | claimed | null    | —        |
| [adapter-tests-cluster](stories/adapter-tests-cluster.md)                                                                             | adapters/ (sqlite / pg / mysql) → canonical schema or isolated-by-design                                                                                                    | done    | 350     | fixtures |
| [assoc-append-cfk-query-constraints-update-convergence](stories/assoc-append-cfk-query-constraints-update-convergence.md)             | assoc-append-cfk-query-constraints-update-convergence                                                                                                                       | done    | null    | —        |
| [assoc-associations-test](stories/assoc-associations-test.md)                                                                         | Port associations.test.ts to canonical schema (split per-describe)                                                                                                          | done    | 500     | fixtures |
| [assoc-associations-test-finder-sql-inverse-on-create](stories/assoc-associations-test-finder-sql-inverse-on-create.md)               | assoc-associations-test-finder-sql-inverse-on-create                                                                                                                        | done    | null    | —        |
| [assoc-associations-test-force-reload-async-validate](stories/assoc-associations-test-force-reload-async-validate.md)                 | assoc-associations-test-force-reload-async-validate                                                                                                                         | done    | null    | —        |
| [assoc-associations-test-wave-final-drop-exclude](stories/assoc-associations-test-wave-final-drop-exclude.md)                         | assoc-associations-test-wave-final-drop-exclude                                                                                                                             | done    | null    | —        |
| [assoc-associations-test-wave2-delete-dup-describes](stories/assoc-associations-test-wave2-delete-dup-describes.md)                   | associations.test.ts wave 2: delete remaining duplicate describes (RFC 0019)                                                                                                | done    | 500     | —        |
| [assoc-associations-test-wave3-convert-canonical](stories/assoc-associations-test-wave3-convert-canonical.md)                         | associations.test.ts wave 3: convert associations_test.rb describes to canonical schema (RFC 0019)                                                                          | done    | 500     | —        |
| [assoc-associations-test-wave3-delete-dup-describes](stories/assoc-associations-test-wave3-delete-dup-describes.md)                   | assoc-associations-test-wave3-delete-dup-describes                                                                                                                          | done    | null    | —        |
| [assoc-associations-test-wave4-convert-canonical](stories/assoc-associations-test-wave4-convert-canonical.md)                         | assoc-associations-test-wave4-convert-canonical                                                                                                                             | done    | null    | —        |
| [assoc-associations-test-wave4-delete-dup-describes](stories/assoc-associations-test-wave4-delete-dup-describes.md)                   | assoc-associations-test-wave4-delete-dup-describes                                                                                                                          | done    | null    | —        |
| [assoc-associations-test-wave5-convert-canonical](stories/assoc-associations-test-wave5-convert-canonical.md)                         | assoc-associations-test-wave5-convert-canonical                                                                                                                             | done    | null    | —        |
| [assoc-associations-test-wave5-delete-rails-guided-describes](stories/assoc-associations-test-wave5-delete-rails-guided-describes.md) | assoc-associations-test-wave5-delete-rails-guided-describes                                                                                                                 | done    | null    | —        |
| [assoc-associations-test-wave6-convert-canonical](stories/assoc-associations-test-wave6-convert-canonical.md)                         | assoc-associations-test-wave6-convert-canonical                                                                                                                             | done    | null    | —        |
| [assoc-associations-test-wave6-delete-rails-guided-describes](stories/assoc-associations-test-wave6-delete-rails-guided-describes.md) | assoc-associations-test-wave6-delete-rails-guided-describes                                                                                                                 | done    | null    | —        |
| [assoc-associations-test-wave7-convert-canonical](stories/assoc-associations-test-wave7-convert-canonical.md)                         | assoc-associations-test-wave7-convert-canonical                                                                                                                             | done    | null    | —        |
| [assoc-associations-test-wave8-convert-canonical](stories/assoc-associations-test-wave8-convert-canonical.md)                         | assoc-associations-test-wave8-convert-canonical                                                                                                                             | done    | null    | —        |
| [assoc-associations-test-wave9-convert-canonical](stories/assoc-associations-test-wave9-convert-canonical.md)                         | assoc-associations-test-wave9-convert-canonical                                                                                                                             | done    | null    | —        |
| [assoc-cascaded-eager-canonical](stories/assoc-cascaded-eager-canonical.md)                                                           | cascaded-eager-loading.test.ts → canonical schema                                                                                                                           | done    | 250     | fixtures |
| [assoc-eager-split-canonical](stories/assoc-eager-split-canonical.md)                                                                 | eager.test.ts → canonical schema (multi-PR split)                                                                                                                           | done    | 500     | fixtures |
| [assoc-eager-split-canonical-belongsto-wave2](stories/assoc-eager-split-canonical-belongsto-wave2.md)                                 | assoc-eager-split-canonical-belongsto-wave2                                                                                                                                 | done    | null    | —        |
| [assoc-eager-split-canonical-remaining-clusters](stories/assoc-eager-split-canonical-remaining-clusters.md)                           | eager.test.ts → canonical schema: remaining bespoke clusters (multi-PR)                                                                                                     | done    | 500     | —        |
| [assoc-habtm-big-canonical](stories/assoc-habtm-big-canonical.md)                                                                     | assoc-habtm-big-canonical                                                                                                                                                   | done    | null    | —        |
| [assoc-habtm-canonical](stories/assoc-habtm-canonical.md)                                                                             | habtm + has-and-belongs-to-many → canonical schema (split)                                                                                                                  | done    | 500     | fixtures |
| [assoc-has-many](stories/assoc-has-many.md)                                                                                           | Port has-many-associations.test.ts to canonical schema (split per-describe)                                                                                                 | done    | 500     | fixtures |
| [assoc-has-many-describes-wave3](stories/assoc-has-many-describes-wave3.md)                                                           | Convert remaining has-many-associations.test.ts describes to canonical (wave 3)                                                                                             | done    | 500     | —        |
| [assoc-has-many-describes-wave4](stories/assoc-has-many-describes-wave4.md)                                                           | assoc-has-many-describes-wave4                                                                                                                                              | done    | null    | —        |
| [assoc-has-many-describes-wave5](stories/assoc-has-many-describes-wave5.md)                                                           | assoc-has-many-describes-wave5                                                                                                                                              | done    | null    | —        |
| [assoc-has-many-describes-wave6](stories/assoc-has-many-describes-wave6.md)                                                           | assoc-has-many-describes-wave6                                                                                                                                              | done    | null    | —        |
| [assoc-has-many-describes-wave7](stories/assoc-has-many-describes-wave7.md)                                                           | assoc-has-many-describes-wave7                                                                                                                                              | done    | null    | —        |
| [assoc-has-many-describes-wave8](stories/assoc-has-many-describes-wave8.md)                                                           | assoc-has-many-describes-wave8                                                                                                                                              | done    | null    | —        |
| [assoc-has-many-describes-wave9](stories/assoc-has-many-describes-wave9.md)                                                           | assoc-has-many-describes-wave9                                                                                                                                              | done    | null    | —        |
| [assoc-has-many-remaining-describes](stories/assoc-has-many-remaining-describes.md)                                                   | Convert remaining has-many-associations.test.ts describes to canonical (waves 2+)                                                                                           | done    | 500     | fixtures |
| [assoc-has-one](stories/assoc-has-one.md)                                                                                             | Port has-one-associations.test.ts to canonical schema                                                                                                                       | done    | 500     | fixtures |
| [assoc-has-one-shared-tables](stories/assoc-has-one-shared-tables.md)                                                                 | Convert has-one-associations.test.ts bespoke firms/accounts/companies to canonical                                                                                          | done    | 500     | —        |
| [assoc-has-one-unskip-residual](stories/assoc-has-one-unskip-residual.md)                                                             | assoc-has-one-unskip-residual                                                                                                                                               | done    | null    | —        |
| [assoc-join-model-canonical](stories/assoc-join-model-canonical.md)                                                                   | join-model.test.ts → canonical schema (split)                                                                                                                               | done    | 500     | fixtures |
| [assoc-join-model-canonical-wave2](stories/assoc-join-model-canonical-wave2.md)                                                       | join-model.test.ts → canonical: mutating polymorphic (wave 2)                                                                                                               | done    | 450     | fixtures |
| [assoc-join-model-canonical-wave3](stories/assoc-join-model-canonical-wave3.md)                                                       | join-model.test.ts → canonical: eager/include + custom-key (wave 3)                                                                                                         | done    | 480     | fixtures |
| [assoc-join-model-canonical-wave4](stories/assoc-join-model-canonical-wave4.md)                                                       | join-model.test.ts → canonical: STI/self-ref/preload (wave 4)                                                                                                               | done    | 490     | fixtures |
| [assoc-join-model-canonical-wave5](stories/assoc-join-model-canonical-wave5.md)                                                       | assoc-join-model-canonical-wave5                                                                                                                                            | done    | null    | —        |
| [assoc-left-outer-join-canonical](stories/assoc-left-outer-join-canonical.md)                                                         | left-outer-join-association.test.ts → canonical schema                                                                                                                      | done    | 250     | fixtures |
| [assoc-preloadertest-cfk-cpk-canonical](stories/assoc-preloadertest-cfk-cpk-canonical.md)                                             | assoc-preloadertest-cfk-cpk-canonical                                                                                                                                       | done    | null    | —        |
| [assoc-preloadertest-delegated-type-already-loaded](stories/assoc-preloadertest-delegated-type-already-loaded.md)                     | assoc-preloadertest-delegated-type-already-loaded                                                                                                                           | done    | null    | —        |
| [assoc-preloadertest-multidb-sti-canonical](stories/assoc-preloadertest-multidb-sti-canonical.md)                                     | assoc-preloadertest-multidb-sti-canonical                                                                                                                                   | done    | null    | —        |
| [assoc-preloadertest-scopes-canonical](stories/assoc-preloadertest-scopes-canonical.md)                                               | assoc-preloadertest-scopes-canonical                                                                                                                                        | done    | null    | —        |
| [associations-collection-cluster](stories/associations-collection-cluster.md)                                                         | has-many / belongs-to / has-one / collection → canonical schema + fixtures                                                                                                  | done    | 500     | fixtures |
| [associations-eager-join-cluster](stories/associations-eager-join-cluster.md)                                                         | eager / join / habtm → canonical schema + Rails fixtures                                                                                                                    | done    | 500     | fixtures |
| [associations-scope-cache-cluster](stories/associations-scope-cache-cluster.md)                                                       | association-scope / inverse / assoc-callbacks → canonical schema + fixtures                                                                                                 | done    | 450     | fixtures |
| [associations-test-associationproxytest-canonical](stories/associations-test-associationproxytest-canonical.md)                       | Convert AssociationProxyTest describe in associations.test.ts to canonical                                                                                                  | done    | 400     | —        |
| [associations-test-overridingassociationstest-canonical](stories/associations-test-overridingassociationstest-canonical.md)           | Convert OverridingAssociationsTest describe in associations.test.ts to canonical                                                                                            | done    | 150     | —        |
| [associations-test-preloadertest-canonical](stories/associations-test-preloadertest-canonical.md)                                     | Convert PreloaderTest describe in associations.test.ts to canonical (multi-wave)                                                                                            | done    | 500     | —        |
| [associations-test-preloadertest-canonical-wave2](stories/associations-test-preloadertest-canonical-wave2.md)                         | PreloaderTest wave 2+ — convert remaining ~42 bespoke tests to canonical                                                                                                    | done    | 500     | —        |
| [associations-test-preloadertest-canonical-wave3](stories/associations-test-preloadertest-canonical-wave3.md)                         | associations-test-preloadertest-canonical-wave3                                                                                                                             | done    | null    | —        |
| [associations-test-preloadertest-ta-tb](stories/associations-test-preloadertest-ta-tb.md)                                             | associations-test-preloadertest-ta-tb                                                                                                                                       | done    | null    | —        |
| [attribute-types-cluster](stories/attribute-types-cluster.md)                                                                         | attributes + type/precision cluster → canonical schema + Rails fixtures                                                                                                     | done    | 450     | fixtures |
| [automatically-invert-plural-global-config](stories/automatically-invert-plural-global-config.md)                                     | Converge automatically_invert_plural_associations to global test default                                                                                                    | done    | null    | fixtures |
| [bidirectional-destroy-dependent-cycle-guard](stories/bidirectional-destroy-dependent-cycle-guard.md)                                 | bidirectional-destroy-dependencies → canonical fixtures (needs dependent-destroy cycle guard)                                                                               | done    | 120     | fixtures |
| [calculations-aggregations](stories/calculations-aggregations.md)                                                                     | calculations + aggregations → canonical schema + Rails fixtures                                                                                                             | done    | 500     | fixtures |
| [callbacks-destroy-on-parent-firm-clients-fidelity](stories/callbacks-destroy-on-parent-firm-clients-fidelity.md)                     | Use canonical Firm/clients for callbacks.test.ts destroy-on-parent test                                                                                                     | done    | 60      | —        |
| [callbacks-test-canonical-conversion](stories/callbacks-test-canonical-conversion.md)                                                 | callbacks-test-canonical-conversion                                                                                                                                         | done    | null    | —        |
| [callbacks-transactions-cluster](stories/callbacks-transactions-cluster.md)                                                           | callbacks / transactions / locking → canonical schema + Rails fixtures                                                                                                      | done    | 500     | fixtures |
| [canonicalize-hasone-autosave-block](stories/canonicalize-hasone-autosave-block.md)                                                   | canonicalize-hasone-autosave-block                                                                                                                                          | done    | null    | —        |
| [canonicalize-nested-attributes-test](stories/canonicalize-nested-attributes-test.md)                                                 | Canonicalize nested-attributes.test.ts (drop makeModels/bespoke tables)                                                                                                     | done    | 400     | —        |
| [canonicalize-nested-autosave-blocks](stories/canonicalize-nested-autosave-blocks.md)                                                 | Canonicalize nested-attributes autosave describe blocks (Rails-guided + HasOne/HasMany autosave)                                                                            | done    | 350     | —        |
| [canonicalize-nested-belongs-to-block](stories/canonicalize-nested-belongs-to-block.md)                                               | Canonicalize TestNestedAttributesOnABelongsToAssociation makeModels() block                                                                                                 | done    | 180     | —        |
| [canonicalize-nested-has-one-assoc-block](stories/canonicalize-nested-has-one-assoc-block.md)                                         | Canonicalize TestNestedAttributesOnAHasOneAssociation makeModels() block                                                                                                    | done    | 200     | —        |
| [canonicalize-nested-in-general-block](stories/canonicalize-nested-in-general-block.md)                                               | Canonicalize TestNestedAttributesInGeneral bespoke per-test classes                                                                                                         | done    | 400     | —        |
| [canonicalize-nested-small-blocks](stories/canonicalize-nested-small-blocks.md)                                                       | Canonicalize ~15 single-test nested-attributes describe blocks (lines 1864-2680)                                                                                            | done    | 300     | —        |
| [canonicalize-nested-top-block](stories/canonicalize-nested-top-block.md)                                                             | Canonicalize NestedAttributesTest top block (bespoke per-test class pairs, lines 202-564)                                                                                   | done    | 250     | —        |
| [collection-proxy-targets-by-pk-canonical-coverage](stories/collection-proxy-targets-by-pk-canonical-coverage.md)                     | collection-proxy-targets-by-pk-canonical-coverage                                                                                                                           | done    | null    | —        |
| [composite-hmt-composite-pk-target-convergence](stories/composite-hmt-composite-pk-target-convergence.md)                             | Composite has_many :through with composite-PK target convergence                                                                                                            | done    | null    | —        |
| [consolidate-duplicate-cpk-test-models](stories/consolidate-duplicate-cpk-test-models.md)                                             | Consolidate duplicate CPK test-model definitions (cpk.ts vs cpk/) with divergent primary keys                                                                               | done    | 150     | —        |
| [converge-integration-test-canonical-developer](stories/converge-integration-test-canonical-developer.md)                             | Converge integration.test.ts to canonical Developer/Firm/fixtures                                                                                                           | done    | 350     | fixtures |
| [converge-named-scoping-canonical](stories/converge-named-scoping-canonical.md)                                                       | Converge scoping/named-scoping.test.ts to canonical models                                                                                                                  | done    | 250     | fixtures |
| [converge-partial-decl-models-updated-at](stories/converge-partial-decl-models-updated-at.md)                                         | Converge partial-declaration models that mask updated_at (cache-key/integration/associations/named-scoping)                                                                 | done    | 500     | fixtures |
| [cpk-counter-cache-column-demodulize-convergence](stories/cpk-counter-cache-column-demodulize-convergence.md)                         | cpk-counter-cache-column-demodulize-convergence                                                                                                                             | done    | null    | —        |
| [cpk-counter-cache-columns-pending-flush](stories/cpk-counter-cache-columns-pending-flush.md)                                         | fix: CpkOrder.\_counterCacheColumns gets cpk_books_count from pending flush instead of books_count                                                                          | done    | 30      | —        |
| [dup-initialize-dup-convergence](stories/dup-initialize-dup-convergence.md)                                                           | dup-initialize-dup-convergence                                                                                                                                              | done    | null    | —        |
| [encryption-cluster](stories/encryption-cluster.md)                                                                                   | encryption/ suite → canonical schema + Rails fixtures                                                                                                                       | done    | 250     | fixtures |
| [expected-fixtures-rule-recognize-usehandlerfixtures](stories/expected-fixtures-rule-recognize-usehandlerfixtures.md)                 | expected-fixtures-rule-recognize-usehandlerfixtures                                                                                                                         | done    | null    | —        |
| [habtm-custom-pk-owner-write](stories/habtm-custom-pk-owner-write.md)                                                                 | habtm-custom-pk-owner-write                                                                                                                                                 | done    | null    | —        |
| [hm-belongsto-inverse-cache-poisoned-after-collection-load](stories/hm-belongsto-inverse-cache-poisoned-after-collection-load.md)     | hm-belongsto-inverse-cache-poisoned-after-collection-load                                                                                                                   | done    | null    | —        |
| [hm-clients-of-firm-delete-async-validate](stories/hm-clients-of-firm-delete-async-validate.md)                                       | hm-clients-of-firm-delete-async-validate                                                                                                                                    | done    | null    | —        |
| [hm-delete-all-rejects-destroy-dependent](stories/hm-delete-all-rejects-destroy-dependent.md)                                         | hm-delete-all-rejects-destroy-dependent                                                                                                                                     | done    | null    | —        |
| [inheritance-modules-cluster](stories/inheritance-modules-cluster.md)                                                                 | inheritance / modules / reflection → canonical schema + Rails fixtures                                                                                                      | done    | 450     | fixtures |
| [insert-all-test-canonical-conversion](stories/insert-all-test-canonical-conversion.md)                                               | insert-all-test-canonical-conversion                                                                                                                                        | done    | null    | —        |
| [insert-all-test-canonical-conversion-tail](stories/insert-all-test-canonical-conversion-tail.md)                                     | insert-all-test-canonical-conversion-tail                                                                                                                                   | done    | null    | —        |
| [inverse-associations-fixture-port](stories/inverse-associations-fixture-port.md)                                                     | inverse-associations.test.ts → canonical Human/Face/Interest fixtures                                                                                                       | done    | 400     | fixtures |
| [inverse-associations-unskip-blocked](stories/inverse-associations-unskip-blocked.md)                                                 | inverse-associations-unskip-blocked                                                                                                                                         | done    | null    | —        |
| [inverse-cpk-build-composite-pk-child](stories/inverse-cpk-build-composite-pk-child.md)                                               | inverse-of: composite-PK build sets inverse on child (Cpk::Author/Book/Order)                                                                                               | done    | null    | fixtures |
| [inverse-hasone-through-inverse-of](stories/inverse-hasone-through-inverse-of.md)                                                     | inverse-of: has_one :through automatic inverse (Firm/Project/Developer lead_developer)                                                                                      | done    | null    | fixtures |
| [inverse-hmt-build-through-plural-invert](stories/inverse-hmt-build-through-plural-invert.md)                                         | inverse-of: belongs_to finds has_many through plural inversion (Book/Subscriber)                                                                                            | done    | null    | fixtures |
| [inverse-polymorphic-eager-load-preload](stories/inverse-polymorphic-eager-load-preload.md)                                           | inverse-of: polymorphic eager-load preloading shares parent instance                                                                                                        | done    | null    | fixtures |
| [inverse-relation-or-unscope-guard](stories/inverse-relation-or-unscope-guard.md)                                                     | inverse-of: .or/.unscope mark relation non-inversable                                                                                                                       | done    | null    | fixtures |
| [materialize-declares-rollout-waves](stories/materialize-declares-rollout-waves.md)                                                   | Materialize model declares: roll the generator across test-helpers/models in waves                                                                                          | done    | 300     | —        |
| [misc-core-cluster](stories/misc-core-cluster.md)                                                                                     | explain / strict-loading / suppressor / unsafe-raw-sql → canonical schema                                                                                                   | done    | 350     | fixtures |
| [mysql-explain-helpers-canonical-schema](stories/mysql-explain-helpers-canonical-schema.md)                                           | Converge mysql-explain.test.ts trails-only EXPLAIN probes to canonical schema                                                                                               | done    | 150     | —        |
| [nested-attr-hasmany-fk-from-reflection](stories/nested-attr-hasmany-fk-from-reflection.md)                                           | nested-attr-hasmany-fk-from-reflection                                                                                                                                      | done    | null    | —        |
| [persistence-auto-populated-column-order](stories/persistence-auto-populated-column-order.md)                                         | Restore test_populates_autoincremented_id_pk_regardless_of_its_position (positioned PK + auto_populated reflection)                                                         | done    | null    | —        |
| [persistence-becomes-restricted-name-dirty](stories/persistence-becomes-restricted-name-dirty.md)                                     | Restore test_becomes_includes_changed_attributes (restricted-name dirty-tracking fidelity)                                                                                  | done    | null    | —        |
| [persistence-dup-cluster](stories/persistence-dup-cluster.md)                                                                         | persistence / dup / clone / insert-all → canonical schema + Rails fixtures                                                                                                  | done    | 450     | fixtures |
| [persistence-non-pk-autoincrement-writeback](stories/persistence-non-pk-autoincrement-writeback.md)                                   | Restore test_populates_non_primary_key_autoincremented_column (non-PK auto-increment write-back)                                                                            | done    | null    | —        |
| [persistence-pg-uuid-pk-create](stories/persistence-pg-uuid-pk-create.md)                                                             | Restore PG uuid-PK create tests (chat_messages / chat_messages_custom_pk)                                                                                                   | done    | null    | —        |
| [persistence-port-destubbed-rails-tests](stories/persistence-port-destubbed-rails-tests.md)                                           | Port de-stubbed persistence Rails tests (cpk/becomes-sti/readonly/uuid) to canonical                                                                                        | done    | 450     | —        |
| [persistence-port-residual-cluster](stories/persistence-port-residual-cluster.md)                                                     | persistence-port-residual-cluster                                                                                                                                           | done    | null    | —        |
| [persistence-returns-object-even-if-validations-failed](stories/persistence-returns-object-even-if-validations-failed.md)             | persistence-returns-object-even-if-validations-failed                                                                                                                       | done    | null    | —        |
| [persistence-shared-topics-ddl-isolation](stories/persistence-shared-topics-ddl-isolation.md)                                         | Restore becomes_default_sti_subclass + reset_column_information_resets_children (shared-topics DDL isolation)                                                               | done    | null    | —        |
| [persistence-test-canonical](stories/persistence-test-canonical.md)                                                                   | persistence-test-canonical                                                                                                                                                  | done    | null    | —        |
| [persistence-test-canonical-wave10](stories/persistence-test-canonical-wave10.md)                                                     | persistence.test.ts canonical burndown wave10 (remaining defineSchema blocks)                                                                                               | done    | 300     | —        |
| [persistence-test-canonical-wave11](stories/persistence-test-canonical-wave11.md)                                                     | persistence-test-canonical-wave11                                                                                                                                           | done    | null    | —        |
| [persistence-test-canonical-wave12](stories/persistence-test-canonical-wave12.md)                                                     | persistence-test-canonical-wave12                                                                                                                                           | done    | null    | —        |
| [persistence-test-canonical-wave13](stories/persistence-test-canonical-wave13.md)                                                     | persistence-test-canonical-wave13                                                                                                                                           | done    | null    | —        |
| [persistence-test-canonical-wave2](stories/persistence-test-canonical-wave2.md)                                                       | persistence-test-canonical-wave2                                                                                                                                            | done    | null    | —        |
| [persistence-test-canonical-wave3](stories/persistence-test-canonical-wave3.md)                                                       | persistence-test-canonical-wave3                                                                                                                                            | done    | null    | —        |
| [persistence-test-canonical-wave4](stories/persistence-test-canonical-wave4.md)                                                       | persistence-test-canonical-wave4                                                                                                                                            | done    | null    | —        |
| [persistence-test-canonical-wave5](stories/persistence-test-canonical-wave5.md)                                                       | persistence-test-canonical-wave5                                                                                                                                            | done    | null    | —        |
| [persistence-test-canonical-wave6](stories/persistence-test-canonical-wave6.md)                                                       | persistence-test-canonical-wave6                                                                                                                                            | done    | null    | —        |
| [persistence-test-canonical-wave7](stories/persistence-test-canonical-wave7.md)                                                       | persistence-test-canonical-wave7                                                                                                                                            | done    | null    | —        |
| [persistence-test-canonical-wave8](stories/persistence-test-canonical-wave8.md)                                                       | persistence-test-canonical-wave8                                                                                                                                            | done    | null    | —        |
| [persistence-test-canonical-wave9](stories/persistence-test-canonical-wave9.md)                                                       | persistence-test-canonical-wave9                                                                                                                                            | done    | null    | —        |
| [polymorphic-through-composite-owner-convergence](stories/polymorphic-through-composite-owner-convergence.md)                         | Polymorphic-through with composite owner PK convergence                                                                                                                     | done    | null    | —        |
| [port-activesupport-expand-cache-key](stories/port-activesupport-expand-cache-key.md)                                                 | Port ActiveSupport CacheKeyTest (expand_cache_key) against real code                                                                                                        | done    | 200     | fixtures |
| [primary-key-reflects-nil-for-idless-tables](stories/primary-key-reflects-nil-for-idless-tables.md)                                   | primary-key-reflects-nil-for-idless-tables                                                                                                                                  | done    | null    | —        |
| [relation-core-cluster](stories/relation-core-cluster.md)                                                                             | relation / relations / querying core → canonical schema + Rails fixtures                                                                                                    | done    | 500     | fixtures |
| [relation-field-ordered-values-canonical](stories/relation-field-ordered-values-canonical.md)                                         | relation/field-ordered-values.test.ts → canonical Post/Book/Author + fixtures (field_ordered_values_test.rb)                                                                | done    | 250     | fixtures |
| [relation-mutation-cluster](stories/relation-mutation-cluster.md)                                                                     | relation/ mutation cluster → canonical schema + Rails fixtures                                                                                                              | done    | 350     | fixtures |
| [relation-order-test-canonical](stories/relation-order-test-canonical.md)                                                             | relation/order.test.ts → canonical Book/Author + fixtures (order_test.rb)                                                                                                   | done    | 250     | fixtures |
| [relation-select-order-cluster](stories/relation-select-order-cluster.md)                                                             | relation/ select + order cluster → canonical schema + Rails fixtures                                                                                                        | done    | 400     | fixtures |
| [relation-select-test-canonical](stories/relation-select-test-canonical.md)                                                           | relation/select.test.ts → canonical Post + posts/comments fixtures (select_test.rb)                                                                                         | done    | 300     | fixtures |
| [relation-where-cluster](stories/relation-where-cluster.md)                                                                           | relation/ where + predicate cluster → canonical schema + Rails fixtures                                                                                                     | done    | 450     | fixtures |
| [relation-with-test-canonical](stories/relation-with-test-canonical.md)                                                               | relation/with.test.ts → canonical Post/Comment/Company + fixtures (with_test.rb)                                                                                            | done    | 350     | fixtures |
| [require-table-teardown-burndown](stories/require-table-teardown-burndown.md)                                                         | Burn down the require-table-teardown exclude list (18 files, 3 dropAllTables)                                                                                               | done    | 200     | fixtures |
| [require-table-teardown-burndown-migration](stories/require-table-teardown-burndown-migration.md)                                     | Burn down require-table-teardown: migration/DDL feature tests (invertible-migration, migration, query-cache, reserved-word, schema-dumper, schema-introspection, timestamp) | done    | 300     | —        |
| [require-table-teardown-burndown-pg-adapters](stories/require-table-teardown-burndown-pg-adapters.md)                                 | Burn down require-table-teardown: 6 postgresql adapter test files (collation, invertible-migration, range, schema, uuid, virtual-column)                                    | done    | 250     | —        |
| [require-table-teardown-burndown-schema-statements](stories/require-table-teardown-burndown-schema-statements.md)                     | Burn down require-table-teardown: abstract-mysql active-schema + schema-statements-on-adapter test files                                                                    | done    | 200     | —        |
| [require-table-teardown-ratchet-burndown](stories/require-table-teardown-ratchet-burndown.md)                                         | Burn down require-table-teardown exclude baseline (18 files)                                                                                                                | done    | 300     | —        |
| [require-table-teardown-rule-recognize-loops](stories/require-table-teardown-rule-recognize-loops.md)                                 | Harden require-table-teardown rule to recognize loop/array-based teardown                                                                                                   | done    | 60      | —        |
| [scoping-suite](stories/scoping-suite.md)                                                                                             | scoping/ suite → canonical schema + Rails fixtures                                                                                                                          | done    | 300     | fixtures |
| [secure-token-cluster](stories/secure-token-cluster.md)                                                                               | secure-password / token cluster → canonical schema + Rails fixtures                                                                                                         | done    | 250     | fixtures |
| [serialization-cluster](stories/serialization-cluster.md)                                                                             | serialization + store cluster → canonical schema + Rails fixtures                                                                                                           | done    | 350     | fixtures |
| [setbelongsto-composite-fk-inference-convergence](stories/setbelongsto-composite-fk-inference-convergence.md)                         | setBelongsTo composite foreign-key inference convergence                                                                                                                    | done    | null    | —        |
| [shared-table-convergence](stories/shared-table-convergence.md)                                                                       | Converge collision-prone scratch tables (people / posts / items / HABTM joins)                                                                                              | done    | 300     | fixtures |
| [sqlite3-adapter-test-canonical](stories/sqlite3-adapter-test-canonical.md)                                                           | Port sqlite3-adapter.test.ts to canonical schema or isolated-by-design                                                                                                      | done    | 400     | fixtures |
| [timestamp-alias-resolution-fidelity](stories/timestamp-alias-resolution-fidelity.md)                                                 | Resolve attribute aliases in timestamp/cache-key reads (Rails timestamp.rb parity)                                                                                          | done    | 200     | fixtures |
| [validations-suite](stories/validations-suite.md)                                                                                     | validations/ suite → canonical schema + Rails fixtures                                                                                                                      | done    | 400     | fixtures |
| [associations-test-drop-exclude-final](stories/associations-test-drop-exclude-final.md)                                               | Drop associations.test.ts from canonical-schema exclude list                                                                                                                | blocked | 50      | —        |
| [converge-integration-namedscoping-remainder](stories/converge-integration-namedscoping-remainder.md)                                 | Converge integration.test.ts cacheKey + named-scoping STI partial-decl models (warming remainder)                                                                           | blocked | 350     | fixtures |
| [hmt-disable-joins-conversion](stories/hmt-disable-joins-conversion.md)                                                               | has-many-through disable-joins conversion (framework-blocked) → canonical schema + fixtures                                                                                 | blocked | 150     | fixtures |

## Changelog

- 2026-06-16: status → active (reopened). This RFC gates RFC 0030's `test:compare` un-skip campaign — un-skipping on still-grandfathered files adds bespoke-`defineSchema` debt, so the canonical conversion must come first. Added the strict-rule + RFC-0030-relationship + multi-PR breakdown section; prioritized the association conversion stories (assoc-eager/join-model/has-one/habtm/cascaded = priority 1; associations/has-many/inverse/left-outer/bidirectional = priority 2) and flipped them ready, since 5 agents are live in those files.
- 2026-06-15: status → closed; shelved for now. The ~104 open stories stay as the historical record and can be reopened by flipping status back to active.
- 2026-06-09: initial RFC; supersedes 0014-fixtures-adoption.
- 2026-06-09: review (PR #14) — added `deps: shared-table-convergence` to
  `relation-where-cluster` and `attribute-types-cluster` (known `people`/`items`
  colliders) and removed the conditional collision notes; split the
  framework-blocked `has-many-through-disable-joins-associations.test.ts` out of
  `associations-disable-joins-cluster` into its own `hmt-disable-joins-conversion`
  story with an explicit `blocked-by`.
- 2026-06-09: re-review (PR #14) — added `deps: shared-table-convergence` to
  `inheritance-modules-cluster` (known `people` collider in `reflection.test.ts`)
  with a definitive note; repointed `hmt-disable-joins-conversion`'s `blocked-by`
  from `0015-ar-framework-gaps` to `0005-activerecord-gaps` (the association-gaps
  RFC) since both blockers are association-layer, not dirty/readonly.
