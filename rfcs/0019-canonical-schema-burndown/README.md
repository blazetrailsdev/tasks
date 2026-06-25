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

Each story is a **cluster**, not a single PR. `est-loc` is the per-PR slice
ceiling (≤500, the claimable unit), **not** the cluster total — large clusters
(`calculations`, `eager`, `relations`, `has-many`, `associations`) span several
PRs and register continuation stories via `pnpm tasks new` as they progress.

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
