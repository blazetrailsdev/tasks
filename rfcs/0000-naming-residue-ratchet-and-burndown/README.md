---
rfc: "0000-naming-residue-ratchet-and-burndown"
title: "Ratchet the call-argument naming residue, then burn it down to the gate flip"
status: draft
created: 2026-09-16
updated: 2026-09-16
owner: "@deanmarano"
packages:
  - activerecord
  - activesupport
  - activemodel
  - arel
clusters:
  - naming-residue
related-rfcs:
  - "0095-call-argument-parity"
  - "0096-naming-identifier-burndown"
  - "0117-arel-extra-surface-burndown"
  - "0123-blocked-convergence-holding"
  - "0126-fidelity-tooling-continuation"
---

<!-- Unnumbered until merge: keep `rfc:` as 0000-naming-residue-ratchet-and-burndown
     and the H1 below number-free. `scripts/finalize-rfc.mjs` swaps 0000 for the
     assigned number at merge. -->

# RFC — Ratchet the call-argument naming residue, then burn it down to the gate flip

## Summary

The call-argument gate (RFC 0095) enforces `shape` rows and only reports
`naming` rows: a call site where TS passes what Rails passes under a different
identifier. `naming-gate-flip`, the closing story of the RFC 0096 burndown,
would make `naming` enforcing too. It cannot land, because it needs the
convergeable naming count inside the ActiveRecord require-closure to be zero.
That count has gone up since RFC 0096 closed, and no RFC owns bringing it down.

This RFC owns that work, in two halves, and **the ratchet comes first**:

1. **An only-shrink, per-package naming-residue mark.** It is the naming twin of
   the RFC 0117 extra-surface mark and the RFC 0126 parameter-name mark. It is
   seeded at today's measured count, so a PR that adds a convergeable `naming`
   row fails CI when the row is written.
2. **Burndown waves** that converge the existing rows, one package slice per
   PR, each tightening the mark behind it.

When the closure's mark reaches zero, `naming-gate-flip` is rehomed here and
runs unchanged.

## Motivation

The residue went down while RFC 0096 was draining it, then went back up. New
ports add naming residue faster than waves remove it:

| measured             | repo-wide `burndown` | `module-mixin-receiver` | convergeable total | in-closure `burndown` (AR + AS + AM + arel) |
| -------------------- | -------------------: | ----------------------: | -----------------: | ------------------------------------------: |
| 2026-08-18           |                  249 |                      10 |                259 |                                           — |
| 2026-08-21           |                    — |                       — |                255 |                                           — |
| 2026-08-27           |                    — |                       — |                202 |                                          50 |
| 2026-08-30           |                  214 |                       9 |                223 |                        81 (63 + 16 + 1 + 1) |
| **2026-09-16** (now) |              **249** |                   **8** |            **257** |                    **84 (66 + 15 + 2 + 1)** |

Since 08-30, repo-wide convergeable residue rose by 34 (+15%), and the in-closure
`burndown` count rose by 3 more, on top of the +31 between 08-27 and 08-30.
No story owned draining it in those two and a half weeks, and nothing stops
growth except a reviewer happening to run `parity:api:calls:args:report`.

The same pattern has been met before in this repo, and the answer each time was
a ratchet:

- arel's extra surface grew on every measured day from 2026-08-05 to 08-22,
  until RFC 0117 armed a mark (`extra-surface-mark.ts`, module comment);
- the call-set population, until RFC 0047/0084 made its baseline only-shrink;
- parameter names, where RFC 0126's mark (`param-name-mark.ts`) holds every
  enrolled package at its measured count.

RFC 0096 had waves and no ratchet. It closed with no owner for what was left,
and the count has risen since. Adding more waves without a ratchet would repeat
that.

## Residue inventory

Measured on trails `3c6616b0f1` (= `origin/main` at measurement):

```sh
pnpm build && API_COMPARE_FORCE=1 pnpm parity:api --calls && pnpm parity:api:calls:args:report
```

Per-class and per-package cells were split with `classifyRow` from
`scripts/api-compare/naming-taxonomy.ts`, using the same `thisTypedFunctions`
input as the report. The report's own "by package" section merges
`module-mixin-receiver` into `burndown`.

**Artifact:** 486 call-argument mismatches across 225 files (8712 call sites
compared). 134 are `shape` and 352 are `naming`.

### By class (repo-wide)

| class                   | permanent | rows | disposition at the flip                 |
| ----------------------- | :-------: | ---: | --------------------------------------- |
| `burndown`              |    no     |  249 | converge (rename); never baselined      |
| `module-mixin-receiver` |    no     |    8 | converge (rewire to `this`-typed mixin) |
| `ivar-underscore`       |    yes    |   46 | one shared reason                       |
| `no-js-equivalent`      |    yes    |   20 | one shared reason                       |
| `js-reserved-word`      |    yes    |   14 | one shared reason                       |
| `implicit-to-s`         |    yes    |    7 | one shared reason                       |
| `module-mixin-call`     |    yes    |    5 | one shared reason                       |
| `block-idiom`           |    yes    |    2 | one shared reason                       |
| `ivar-reflection`       |    yes    |    1 | one shared reason                       |
| **convergeable**        |           |  257 | 73.0% of naming                         |
| **permanent**           |           |   95 | 27.0% of naming                         |

The permanent share is 27% repo-wide and 45% inside the closure (below). RFC
0095's ~6% (a 32-row sample) was far too low. PR #6459's ~73% unconvergeable
for activerecord (RFC 0096 README) was too high: activerecord measures 47
permanent of 115 naming rows today (41%). This is why the RFC works from the
measured taxonomy rather than either earlier estimate.

**`module-mixin-receiver` must reach zero.** It is `permanent: false` in
`NAMING_CLASSES`, and its reason reads "Converges by rewiring to the
`this`-typed mixin idiom, not by renaming. Never baseline it." Criterion 2b of
`naming-gate-flip` already names it next to `burndown`. It gets no shared
reason.

### By package

| package                   | `burndown` | `module-mixin-receiver` | convergeable | permanent | in closure |
| ------------------------- | ---------: | ----------------------: | -----------: | --------: | :--------: |
| activerecord              |         66 |                       2 |       **68** |        47 |    yes     |
| activesupport             |         15 |                       2 |       **17** |        14 |    yes     |
| activemodel               |          2 |                       0 |        **2** |         6 |    yes     |
| arel                      |          1 |                       0 |        **1** |         0 |    yes     |
| i18n                      |          0 |                       0 |            0 |         4 |    yes     |
| globalid                  |          0 |                       0 |            0 |         2 |    yes     |
| activerecord-test-support |          0 |                       0 |            0 |         0 |    yes     |
| **closure subtotal**      |     **84** |                   **4** |       **88** |    **73** |            |
| actiondispatch            |         74 |                       3 |           77 |         1 |     no     |
| actionview                |         36 |                       0 |           36 |         9 |     no     |
| actioncontroller          |         31 |                       1 |           32 |         7 |     no     |
| rack                      |         15 |                       0 |           15 |         1 |     no     |
| trailties                 |          6 |                       0 |            6 |         2 |     no     |
| rack-test                 |          2 |                       0 |            2 |         2 |     no     |
| rack-session              |          1 |                       0 |            1 |         0 |     no     |
| **out of closure**        |    **165** |                   **4** |      **169** |    **22** |            |

The closure permanent rows (73) are the seeding population for criterion 2 of
`naming-gate-flip`.

### Where the closure's 88 convergeable rows live

They are spread across 58 files. The largest slices:

- `activerecord/connection-adapters/**`: 26 rows (abstract and postgresql
  `schema-statements.ts` 4 each, `abstract/database-statements.ts` 3, then
  singletons).
- `activerecord/relation*`: 16 rows (`relation/calculations.ts` 6,
  `relation.ts` 4, `predicate-builder.ts` 2, `query-methods.ts` 2, and
  `finder-methods.ts` and `spawn-methods.ts` 1 each).
- the rest of `activerecord`: 26 rows (`attribute-methods/primary-key.ts` 3,
  `database-configurations/url-config.ts` 3, `associations.ts` 2,
  `tasks/database-tasks.ts` 2, then singletons across associations, persistence,
  migration, fixtures and encryption).
- `activesupport`: 17 rows (`values/time-zone.ts` 4, then singletons across
  cache, message-pack, testing and core-ext).
- `activemodel` + `arel`: 3 rows (`attribute-set/builder.ts`,
  `serialization.ts`, `visitors/dot.ts`).

## Design

### 1. The naming-residue mark (lands first)

This is a new `scripts/api-compare/naming-residue-mark.ts` +
`naming-residue-mark.json` pair. It follows the `param-name-mark.ts` contract
(RFC 0126) and uses the `extra-surface-mark.ts` vocabulary (RFC 0117). It does
not add a new mechanism.

- **What it counts:** `naming` rows in
  `output/call-arg-mismatches.json` whose `classifyRow` class is
  `permanent: false`, which today means `burndown` + `module-mixin-receiver`. The
  count is read from `NAMING_CLASSES`, not from a hard-coded list, so a class
  that is added or reclassified moves the mark in a reviewed diff.
  `thisTypedFunctions` comes from `thisTypedFunctionsByPackage` in
  `report-call-args.ts`, so the mark and the report cannot disagree.
- **Shape:** one row per gated package, with `total` and a per-Ruby-file
  `byFile`, like `PackageMark` in `param-name-mark.ts`. The `byFile` counts
  close the hole that module's comment names: a rename converged in one file and
  a new row introduced in another leave the total unchanged.
- **Only-shrink:** CI fails on any increase in `total` or in any `byFile` cell.
  The remedy is to pass the Rails identifier, never to raise the mark.
- **Tighten, never reseed:** `pnpm parity:api:calls:args:naming:tighten` writes
  a stale-high mark down to the measurement, with the same only-down
  `--tighten` semantics as `parity:api:params:tighten` and
  `parity:api:extra:tighten`. There is no reseed verb. A mark can only go up as
  a reviewed line in the diff of a story that justifies it, the same rule RFC
  0129 set for ruby-compat.
- **Enrollment:** every package that appears in the artifact today is enrolled
  at its measured count, as `param-name-mark.ts`'s `GATED_PACKAGES` is. The
  out-of-closure packages are included. They are outside the flip, but the
  ratchet costs them nothing and stops their 169 rows from growing. Enrollment
  is only-grow.
- **End states:** once a closure package reaches `total: 0`, it moves to a
  **rowless** set, as in `extra-surface-mark.ts`'s `ROWLESS_PACKAGES`. Its count
  is pinned at the constant 0, it carries no row, and the gate fails if a row is
  added back. arel and activemodel are expected to become rowless in the first
  wave. A package with nothing left to count needs a rule, not a number.
- **Wiring:** `lint-call-args.ts` already runs in the `rails-comparison` CI job
  over the same artifact. The mark check runs in that job next to the `shape`
  gate, as `pnpm parity:api:calls:args:naming`. It reports what the ratchet
  measured and never changes whether `naming` rows are baselined. They stay
  report-only until `naming-gate-flip`.
- **Docs:** CLAUDE.md § "Before you open the PR" step 2 names the new gate
  beside `parity:api:calls:args` in the same PR, and CONTRIBUTING.md does the
  same.

**Why the ratchet goes first.** This is the RFC's central ordering decision:

- A wave landed without the ratchet converges rows that the next unrelated port
  can undo, and nothing tells that port's author. Between 08-30 and 09-16 the
  convergeable count rose by 34 while no story owned it. That is the net inflow
  every wave would otherwise have to outrun.
- A ratchet at today's count costs no convergence work. It only needs the
  measurement, and it is an estimated ~250-LOC tooling PR (module, JSON, test,
  scripts) copied from a pattern that already exists twice. It is the cheapest thing on the path.
- With the ratchet in place, every wave is permanent: each tighten locks in its
  rows, and the total can only go down. Without it, the order of waves does not
  matter, because none of them sticks.
- Seeding "at today's count" can race a sibling PR that lands a new row between
  measurement and merge. That is the known cost of every ratchet in this repo.
  The seeding PR re-measures on its own rebased head, and a sibling's red run
  is resolved by renaming, never by raising the mark.

### 2. Burndown waves (after the ratchet)

Each wave is one PR that converges one slice. It is sized to fit the PR LOC
ceiling (most rows are a one-identifier rename at a call site, plus the
parameter or local it reads). It ends by running
`parity:api:calls:args:naming:tighten` for its package(s):

- **`burndown` rows:** rename the TS local or parameter to the Rails
  identifier, camelCased (CLAUDE.md, "Locals and parameters"). Where the
  identifier is also a parameter, the RFC 0126 `params` gate shrinks too.
- **`module-mixin-receiver` rows:** rewire the receiver-as-first-parameter
  function to the `this`-typed mixin idiom (CLAUDE.md § "Module mixins"). This
  is not a rename.
- **Recorder-shape rows:** a row with no differing `ref:` pair classifies as
  `burndown` by default (`classifyRow`). **None exist in the closure today:** all
  84 in-closure `burndown` rows carry at least one differing `ref:` pair, so each
  is a real rename. If one appears, the wave converges the call if the TS really
  differs; if the recorder misreads an identical call, the wave files a recorder
  fix as a story under this RFC. It never baselines the row and never adds a
  permanent class to absorb it.
- **A rename can surface a `shape` row.** Once the identifiers match, the
  recorder may compare a position it skipped before. That row is gated by the
  existing `parity:api:calls:args` and is converged in the same wave.

Waves, in closure order (counts as of `3c6616b0f1`):

| wave | slice                                  | rows | notes                                                     |
| ---- | -------------------------------------- | ---: | --------------------------------------------------------- |
| W1   | activemodel + arel                     |    3 | both packages become rowless; proves the end state        |
| W2   | activesupport                          |   17 | includes its 2 `module-mixin-receiver` rows               |
| W3   | activerecord `connection-adapters/**`  |   26 | adapter lanes; run the per-adapter CI                     |
| W4   | activerecord `relation*`               |   16 | `relation/calculations.ts` is the densest file (6)        |
| W5   | activerecord, remaining                |   26 | includes its 2 `module-mixin-receiver` rows; AR → rowless |
| W6   | `naming-gate-flip` (rehomed from 0123) |    — | seeds the 73 closure permanent rows; flips the gate       |

A wave larger than one PR once measured splits by directory into sibling stories
under this RFC, filed with `tasks new`. It never fans out into PRs from one
agent. Waves W1–W5 are independent and can run in parallel, because their file
sets do not overlap. The mark JSON is the one shared file: W3, W4 and W5 all
tighten the `activerecord` row's `total`, so they run **in order** (W3 → W4 →
W5), each rebased on the last. W1 and W2 touch other rows and can run beside them. W6 depends on
all five.

Sizing: a rename touches the call site plus every read of that local or
parameter in the method body, so a row is typically 2–6 changed lines. 26 rows
is an estimated 50–150 LOC, inside the ceiling. A wave that measures over it
splits by directory as above.

The 169 out-of-closure rows are ratcheted but not burned down here. They are
recorded in this RFC's changelog at flip time as `naming-gate-flip` criterion 5
requires, and they want an actionpack-family RFC of their own.

After W6 the naming gate itself enforces the closure, so the mark's closure
packages are already rowless and carry nothing. The out-of-closure rows stay on
the mark until their own RFC flips them.

## Non-goals

- **Baselining any `permanent: false` row.** Not at seeding, not at the flip,
  and not as a "temporary" measure. The mark is a count to shrink, not a register
  of reasons.
- **Changing the taxonomy to make a count go down.** Reclassifying a row as
  permanent is a change to `naming-taxonomy.ts` that needs its own cited Ruby
  site and test. A wave that needs one files it as a separate story.
- **Burning down actionpack-family naming residue.** It is ratcheted but out of
  scope for the drain (see `naming-gate-flip`, Re-scope 2026-08-18).
- **Gating `naming` outside the AR closure** when the flip lands.
- **`shape` rows.** They are already gated by RFC 0095.

## Alternatives considered

- **Waves only, no ratchet.** This is what RFC 0096 did. It closed with no
  owner for the remainder, and the 08-30 → 09-16 measurement shows +34 since.
  Rejected.
- **Waves first, then arm the mark at zero.** This is how arel's parameter-name
  mark was armed (RFC 0126: enrolled once PRs #7123/#7148 reached zero). It
  works when a population is small and quiet. This one gained 34 rows in two
  and a half weeks, so every wave would race inflow, and the mark would protect
  nothing until the very end. Rejected.
- **Flip `naming-gate-flip` now and baseline the convergeable rows as seeded
  debt.** This is exactly what `NAMING_CLASSES` forbids ("Never baseline it"),
  and it turns the closing story into a ratification. Rejected.
- **Count all `naming` rows, permanent included.** A new reserved-word or
  ivar-underscore row is not a fidelity regression, and gating it would push
  authors toward `@missingRailsArgs` receipts to get the count down. The flip's
  per-class seeding is what bounds permanent rows. Rejected. See Open question 1
  for a milder form.
- **Extend `param-name-mark.json` instead of adding a mark file.** It measures a
  different artifact (`param-names.ts`) at a different unit (declaration, not
  call site). Sharing a file would make tightening one gate touch the other's
  marks. Rejected. The module is copied, not merged.
- **Gate per file only, with no package `total`.** A per-file-only mark cannot
  express a rowless package. Rejected in favour of `total` + `byFile`.

## Rollout

Each step is one PR.

1. **`naming-residue-mark`** (trails): `naming-residue-mark.ts` + `.json` + test,
   the `parity:api:calls:args:naming` and `…:naming:tighten` scripts, CI wiring
   in `rails-comparison`, and CLAUDE.md / CONTRIBUTING.md lines. Seeded on its
   own rebased head.
2. **W1** `naming-burndown-activemodel-arel`: 3 rows. Both packages become
   rowless.
3. **W2** `naming-burndown-activesupport`: 17 rows.
4. **W3** `naming-burndown-activerecord-connection-adapters`: 26 rows.
5. **W4** `naming-burndown-activerecord-relation`: 16 rows.
6. **W5** `naming-burndown-activerecord-remaining`: 26 rows. activerecord
   becomes rowless.
7. **W6** `naming-gate-flip`: rehomed from `0123-blocked-convergence-holding`,
   unblocked when steps 2–6 have merged.

Steps 2–6 depend on step 1. Steps 2 and 3 are independent of the rest; steps
4 → 5 → 6 run in order because they share the mark's `activerecord` row.

The wave stories are **not** filed in the PR that adds this RFC. The RFC lands
`draft`, and stories under a draft RFC never reach `ready`. After merge, from
the main worktree:

```sh
tasks rfc-status <assigned-rfc> active
tasks rehome naming-gate-flip --to <assigned-rfc>
```

Then file steps 1–6 with `tasks new <assigned-rfc> <slug> --body-file …`,
carrying this inventory as their Context. Add `deps:` edges on
`naming-residue-mark` for steps 2–6, `naming-burndown-activerecord-connection-adapters`
for step 5, `naming-burndown-activerecord-relation` for step 6, and on steps
2–6 for `naming-gate-flip`.

## Verification

- `pnpm parity:api:calls:args:naming` is green on `main` after step 1. Adding a
  deliberately misnamed local in a scratch branch reds it, naming the package,
  the Ruby file and the mark.
- `parity:api:calls:args:naming:tighten` on an unchanged tree is a no-op, and it
  cannot raise any cell (unit test, like `param-name-mark.test.ts`).
- After each wave, the mark JSON shows only decreases, and the wave's package
  totals match `pnpm parity:api:calls:args:report`.
- Before W6: in the report's "Naming residue by class", every in-closure row is
  a `permanent` class; the in-closure `burndown` and `module-mixin-receiver`
  counts are 0; and activerecord, activesupport, activemodel and arel are all
  in the rowless set.
- After W6: `naming-gate-flip`'s own acceptance criteria hold, and
  `pnpm parity:api:calls:args` is green on `main`.

## Open questions

1. **Should permanent rows get a soft mark too?** A `permanentTotal` field,
   reported but not gated, would show whether a taxonomy arm is absorbing rows
   it should not. **Recommendation:** report-only. **Deferred to
   `naming-residue-mark`**; gate it only if a wave finds a misclassified row.
2. **How many `burndown` rows are recorder shape?** **Resolved 2026-09-16:**
   zero of the 84 in-closure rows. Every one carries a differing `ref:` pair,
   so W1–W5 are sized on real renames.
3. **Does the mark belong under `parity:api:calls:args` or its own script?**
   Folding it into `lint-call-args.ts` means one CI step and one artifact read.
   A separate script matches `parity:api:params`. **Recommendation:** a separate
   script that reuses the artifact read. **Deferred to `naming-residue-mark`.**
4. **Does `thisTypedFunctions` make the count build-state-dependent?** It is read
   from `output/ts-api.json`. If a stale manifest can flip a `module-mixin-call`
   row to `burndown`, a sibling PR could red spuriously. **Deferred to
   `naming-residue-mark`**,
   which must show the count is stable across a forced and a warm
   `parity:api` run.

## Changelog

- 2026-09-16: initial RFC. Re-measured on `3c6616b0f1`: 257 convergeable
  repo-wide (was 223 on 08-30), 88 in the closure (84 `burndown` + 4
  `module-mixin-receiver`; `burndown` was 81 on 08-30).
- 2026-09-16: self-review. Measured zero recorder-shape rows in the closure
  (Open question 2 resolved). Serialised the three activerecord waves on the
  shared mark row, added per-wave LOC sizing, deferred every open question to a
  named story, and removed claims the measurements do not support.
