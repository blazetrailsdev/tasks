---
rfc: "0153-naming-residue-ratchet-and-burndown"
title: "Ratchet the call-argument naming residue, then burn it down to the gate flip"
status: active
created: 2026-09-16
updated: 2026-09-16
owner: "@deanmarano"
packages:
  - activerecord
  - activesupport
  - activemodel
  - arel
  - i18n
  - globalid
  - activerecord-test-support
clusters:
  - naming-residue
related-rfcs:
  - "0095-call-argument-parity"
  - "0096-naming-identifier-burndown"
  - "0117-arel-extra-surface-burndown"
  - "0123-blocked-convergence-holding"
  - "0126-fidelity-tooling-continuation"
---

# RFC 0153 — Ratchet the call-argument naming residue, then burn it down to the gate flip

## Summary

The call-argument gate (RFC 0095) enforces `shape` rows and only reports
`naming` rows: a call site where TS passes what Rails passes under a different
identifier. `naming-gate-flip`, the closing story of the RFC 0096 burndown,
would make `naming` enforcing too. It cannot land, because it needs the
convergeable naming count inside the ActiveRecord require-closure to be zero.
That count has gone up since RFC 0096 closed, and no RFC owns bringing it down.

This RFC owns that work, in two halves, and **the ratchet comes first**:

1. **A receipt tag plus a per-package enrollment set — no counts file.** A new
   `@missingRailsName` JSDoc tag receipts each permanent `naming` row at its
   call site. An only-grow list of enrolled packages turns every un-receipted
   `naming` row in an enrolled package red. Nothing in the mechanism is a shared
   number, so converging a row never touches a file another agent is also
   editing.
2. **Burndown waves** that converge the existing rows by rename, one package
   slice per PR. A wave that empties a package ends by enrolling it.

`naming-gate-flip` has been rehomed here and stays blocked until every closure
package is enrolled.

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

The ratchet this RFC adopts is not a fourth counts file, though. Those three
precedents are also the repo's evidence for where counts files hurt (§ Design,
"Why not a counts file").

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

| class                   | permanent | rows | disposition                             |
| ----------------------- | :-------: | ---: | --------------------------------------- |
| `burndown`              |    no     |  249 | converge (rename); never receipted      |
| `module-mixin-receiver` |    no     |    8 | converge (rewire to `this`-typed mixin) |
| `ivar-underscore`       |    yes    |   46 | `@missingRailsName`, one shared reason  |
| `no-js-equivalent`      |    yes    |   20 | `@missingRailsName`, one shared reason  |
| `js-reserved-word`      |    yes    |   14 | `@missingRailsName`, one shared reason  |
| `implicit-to-s`         |    yes    |    7 | `@missingRailsName`, one shared reason  |
| `module-mixin-call`     |    yes    |    5 | `@missingRailsName`, one shared reason  |
| `block-idiom`           |    yes    |    2 | `@missingRailsName`, one shared reason  |
| `ivar-reflection`       |    yes    |    1 | `@missingRailsName`, one shared reason  |
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
`naming-gate-flip` already names it next to `burndown`. It gets no receipt.

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

The closure permanent rows (73) are the population `naming-gate-flip`
criterion 2 addresses; under this RFC they are receipted, not baselined (§3).

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

The ratchet has three parts: a receipt for the rows that never converge (§1),
an enrollment set that decides where "receipt or rename" is enforced (§2), and
waves that converge by rename and end by enrolling (§4). §3 argues why the
receipt cannot do the job alone, and §5 records what this design gives up.

### Why not a counts file

The first revision of this RFC proposed `naming-residue-mark.ts` + `.json`: a
per-package `total` and per-Ruby-file `byFile` count, gated only-shrink and
lowered by a tighten script. It was measured, it was deterministic, and it was
the wrong shape for this repo.

- **Every converging PR writes the same cell.** A wave, or any drive-by rename,
  lowers the package `total`. A dozen agents work this tree in parallel. Every
  one of those PRs edits the same JSON line, and every rebase over a sibling's
  tighten either conflicts or silently re-stales the mark. That is not
  hypothetical: the `parity:api:calls` high-water marks were sharded per file
  **because** a wide shared counter conflicted, and a rebase still routinely
  re-stales a tightened mark.
- **The first revision had already paid for it in its own schedule.** It had to
  serialise W3 → W4 → W5 on the shared `activerecord` row, although their file
  sets do not overlap. The serialisation came from the counter, not from the
  work.
- **The repo has stated where it is heading.** trails CLAUDE.md § "Before you
  open the PR", step 4, on why gated packages move to receipts: "a receipt lives
  in the file you are already editing, so it never conflicts the way a shared
  counter does." A new counts file walks back toward what the extra-surface
  gate is migrating away from.

The replacement keeps the property that mattered (a new convergeable row reds
CI where it is written) and puts every write either in the file under edit (a
receipt) or in a list that changes once per wave (enrollment).

### 1. `@missingRailsName`: a receipt for permanent rows

A new JSDoc tag, the naming twin of `@missingRailsArgs`:

```text
@missingRailsName <ruby_identifier> — PERMANENT|CONVERGEABLE <story-id>
```

- **Key.** `<ruby_identifier>` is the Ruby-side identifier of the differing
  `ref:` pair in the `naming` row (Ruby `klass` where TS passes `this`, Ruby
  `class` where TS passes `klass`). It is placed in the JSDoc of the TS
  declaration whose body holds the call, as `@missingRailsArgs` and
  `@missingRailsCall` are, and it suppresses the `naming` rows of that
  declaration whose Ruby identifier matches.
- **Permanence discipline**, the same one the repo already enforces on
  `@noRailsEquivalent` and `@missingRailsArgs` (the shared
  `classifyReason` in `missing-rails-call-tags.ts`):
  - the reason must open with `PERMANENT` or `CONVERGEABLE`;
  - a tag claiming neither is an **error**, not an assumed `PERMANENT`;
  - a bare `CONVERGEABLE` with no story id is only half a receipt, and is an
    error too.
- **Receipt shape.** Per trails CLAUDE.md § "No extra abstraction", a receipt
  carries no prose: `PERMANENT` alone, or `CONVERGEABLE <story-id>`. The
  per-class reason lives once, in `NAMING_CLASSES`, which already prescribes one
  shared reason per permanent class. The tag does not restate it.
- **A receipt on a convergeable row is an error**, whichever token it opens
  with. The gate classifies the row it suppresses with `classifyRow`; if that
  class is `permanent: false` (`burndown`, `module-mixin-receiver`), the tag is
  rejected and the row stays red. `CONVERGEABLE <story-id>` exists for the
  permanent classes only — a row the taxonomy files as `no-js-equivalent` today
  whose TS side a named story is expected to make expressible.
- **Stale receipts.** A tag that suppresses no row is reported, as
  `@missingRailsArgs` already reports tags "on a COMPARED pair that suppressed
  no mismatch" (`call-args-baseline.ts`). It gates in enrolled packages, so a
  receipt cannot outlive the rename that made it unnecessary.

**Why a new tag, not `@missingRailsArgs`.** `@missingRailsArgs` keys the Ruby
**call** name and is honoured only for `kind: "args"` `shape` rows
(`scripts/api-compare/call-mismatch-baseline.ts:96`, `shardKeyOf`, and
`gatedRows` in `call-args-baseline.ts`). A `naming` row's unit is not the call
but one identifier inside its argument list: one call can carry a permanent
`js-reserved-word` identifier and a convergeable `burndown` identifier side by
side. Reusing the call-keyed tag would suppress both, which is exactly the
receipt-on-convergeable-row this RFC forbids. The identifier key keeps them
apart.

**Who writes them.** The 95 `permanent: true` rows repo-wide carry the tag, one
row per receipt, and each lands in the wave that enrolls its package (§4). The
tag lives in the file the author is already editing, so no two PRs contend on
it.

### 2. A per-package enrollment set, with no counts

An only-grow list of packages, `NAMING_ENROLLED_PACKAGES`, in the module that
gates `naming` rows. For an enrolled package the rule is the constant one:

> Every `naming` row in the package is either renamed away or carries a
> matching `@missingRailsName` receipt. Anything else is red.

A package that is not enrolled is measured by
`parity:api:calls:args:report` as today and not gated.

- **Joining.** A package joins once its convergeable rows are zero and its
  permanent rows are receipted. The PR that achieves that adds the package to
  the list in the same diff, and the gate proves the claim on that PR's head.
- **Only-grow.** No package is ever removed to turn a red run green. This is
  the direction both existing enrollment precedents already take:
  - `GATED_PACKAGES` in `scripts/api-compare/extra-surface-mark.ts:139`. Its
    module comment at `:42` spells out the other half of the rule: activemodel
    "has no burndown behind it yet, and widening GATED_PACKAGES without one is
    exactly the not-mechanical step this comment has always warned about".
    Enrollment here follows the same rule. A package enrolls behind a wave that
    emptied it, never as a mechanical edit.
  - The `files` lists for `blazetrails/unbacked-internal-needs-receipt`
    (RFC 0121), which live in `eslint.config.mjs` **and**
    `eslint/rails-private-jsdoc.config.mjs` and must stay in sync by hand.
- **One list, not two.** The eslint precedent's split exists because two lint
  configs each run the rule. This gate reads the call-argument artifact, not
  the AST, so it runs in one place (`lint-call-args.ts`, or a sibling script
  over the same artifact read — Open question 3). The enrollment set is one
  exported constant with nothing to keep in sync. If implementation ever needs
  a second copy, it gets a test that asserts the two are equal, not a comment.
- **It changes once per wave, not once per converged row.** This is the reason
  for the design. A rename is a change to its own file and nothing else. A
  receipt is a change to its own file and nothing else. The list is written
  roughly once per package over the RFC's life, by the wave that finishes that
  package. Converging waves in different packages or directories never touch a
  shared file, so W3, W4 and W5 no longer need to run in order.
- **Build-state independence.** The gate still depends on `classifyRow`, whose
  only outside input is `thisTypedFunctions` (from `output/ts-api.json`). It
  decides whether a `ref:call` row is `module-mixin-call` (permanent) or
  `burndown`. The concern is smaller than it was under a counts file, because
  the gate asks per row instead of summing, but the rules carry over. CI
  regenerates the artifact and the manifest in the same job, as
  `parity:api:calls` already does. If step 1 finds that a forced and a warm run
  on the same tree classify a row differently, the gate classifies without
  `thisTypedFunctions`, the arm `classifyRow` already takes when the set is
  absent. That arm files the 5 `module-mixin-call` rows as `burndown`. They
  are genuinely permanent, though, and a rename cannot remove them, so under
  the fallback a naive receipt check would deadlock: no rename, no legal
  receipt, and activerecord and activesupport could never enroll. So the
  receipt-on-convergeable-row error (§1) is decided with `classifyRow`'s
  **mixin-aware** arm whenever a manifest is present, and only the
  row-counting side falls back. A receipt on a `ref:call` row is then accepted
  exactly when some build classifies it `module-mixin-call`, and a unit test
  pins that the fallback never rejects one of those 5 receipts. A spurious red on an unrelated PR is still the one outcome the
  ratchet cannot afford.
- **Wiring.** The check runs in the `rails-comparison` CI job beside the
  `shape` gate, and never baselines a `naming` row. Receipts replace baseline
  rows for this dimension. trails CLAUDE.md § "Before you open the PR" step 2
  and CONTRIBUTING.md name the tag and the gate in the step-1 PR.

### 3. Why a receipt tag alone is not enough

The obvious question: if permanent rows carry a receipt, why not gate "receipt
or rename" everywhere on day one and drop enrollment altogether?

Because there are **257 convergeable rows today**, and there is nothing a PR can
write at those sites except the rename itself:

- A convergeable row must **never** get a receipt. `permanent: false` in
  `NAMING_CLASSES` means converge, never ratify. trails CLAUDE.md § "A
  documented deviation is debt, not permission" makes that repo-wide:
  "Never widen an allowlist to cover new work", and a deviation-convergence
  story "always converges". A `CONVERGEABLE` receipt on a `burndown` row would
  be exactly the broadened register that section forbids. §1 makes it an
  error for that reason.
- So a global "receipt or rename" gate reds all 257 rows on the day it lands.
  The only ways to green it are 257 renames in the step-1 PR, far past the
  LOC ceiling, or a baseline of those rows, which `NAMING_CLASSES` forbids.

Per-package enrollment carries the transition. The gate is fully armed inside
enrolled packages and absent outside them, and a package crosses the line only
when its rows are gone. At no point does the design need a shared number to say
"this many are allowed for now". That number is the counts file this RFC
replaced.

### 4. Waves converge by rename, then enroll

Each wave is one PR that converges one slice. It is sized to fit the PR LOC
ceiling (most rows are a one-identifier rename at a call site, plus the
parameter or local it reads). **Its acceptance criterion is that the slice's
convergeable rows are zero. A wave that finishes a package also receipts that
package's permanent rows and adds it to `NAMING_ENROLLED_PACKAGES`.** This
replaces "tighten the mark": there is nothing to tighten.

- **`burndown` rows:** rename the TS local or parameter to the Rails
  identifier, camelCased (trails CLAUDE.md, "Locals and parameters"). Where the
  identifier is also a parameter, the RFC 0126 `params` gate shrinks too.
- **`module-mixin-receiver` rows:** rewire the receiver-as-first-parameter
  function to the `this`-typed mixin idiom (trails CLAUDE.md § "Module mixins").
  This is not a rename.
- **Permanent rows (enrolling wave only):** add `@missingRailsName <id> —
PERMANENT` at each site. A row whose classification looks wrong is not
  receipted: the wave files a taxonomy story under this RFC (Non-goals).
- **Recorder-shape rows:** a row with no differing `ref:` pair classifies as
  `burndown` by default (`classifyRow`). **None exist in the closure today:**
  all 84 in-closure `burndown` rows carry at least one differing `ref:` pair, so
  each is a real rename. If one appears, the wave converges the call if the TS
  really differs. If the recorder misreads an identical call, the wave files a
  recorder fix as a story under this RFC. It never receipts the row and never
  adds a permanent class to absorb it.
- **A rename can surface a `shape` row.** Once the identifiers match, the
  recorder may compare a position it skipped before. That row is gated by the
  existing `parity:api:calls:args` and is converged in the same wave.

Waves, in closure order (counts as of `3c6616b0f1`):

| wave | slice                                 | convergeable rows | permanent receipts | enrolls at end           |
| ---- | ------------------------------------- | ----------------: | -----------------: | ------------------------ |
| —    | step 1 (tag + gate)                   |                 0 |                  6 | 3 empty closure packages |
| W1   | activemodel + arel                    |                 3 |                  6 | activemodel, arel        |
| W2   | activesupport                         |                17 |                 14 | activesupport            |
| W3   | activerecord `connection-adapters/**` |                26 |                  — | —                        |
| W4   | activerecord `relation*`              |                16 |                  — | —                        |
| W5   | activerecord, remaining               |                26 |                 47 | activerecord             |
| W6   | `naming-gate-flip`                    |                 — |                  — | (closure fully enrolled) |

W1 and W2 include their packages' `module-mixin-receiver` rows (0 and 2); W5
includes activerecord's 2. The three closure packages with no convergeable rows
today (`i18n`, `globalid`, `activerecord-test-support`) are enrolled by step 1
itself, with their 6 permanent receipts, which proves the mechanism on real
rows before any wave depends on it.

activerecord enrolls once, at the end of W5, because enrollment is per package
and its 68 rows span three waves. W3 and W4 converge their directories and
enroll nothing. Their rows are not protected until W5 lands; §5 records that.
W3 and W4 place activerecord's permanent receipts in the files they touch
anyway, when the site is in their slice, so W5 is not left holding all 47.

A wave larger than one PR once measured splits by directory into sibling stories
under this RFC, filed with `tasks new`. It never fans out into PRs from one
agent. Because no wave writes a shared counter, W1, W2 and W3 can run in
parallel. W4 depends on W3 and W5 on W4 only so that activerecord's closing
enrollment is measured over a tree that already carries both earlier slices.
That is a scheduling choice, not a conflict: they share no file, and dropping
the W3 → W4 edge to run them in parallel would be safe. W6 depends on all five.

Sizing: a rename touches the call site plus every read of that local or
parameter in the method body, so a row is typically 2–6 changed lines. 26 rows
is an estimated 50–150 LOC, inside the ceiling. A receipt is one JSDoc line.
W5's 47 receipts are ~50 LOC on top of its renames. If that puts W5 over the
ceiling, the receipts for sites outside its slice move into W3 and W4 as above.

**What the flip becomes.** Once every closure package is enrolled, the
enrollment gate already enforces "receipt or rename" over the closure.
`naming-gate-flip` then folds that check into `parity:api:calls:args` proper,
so there is one gate and not a gate plus a sidecar. Its criterion 2 ("seed the
permanent rows per class, one shared reason") is met by the receipts and the
per-class reasons already in `NAMING_CLASSES`, not by baseline rows. Amending
that story's prose to say so is part of filing this RFC's stories, not of this
README.

### 5. The tradeoff: unenrolled packages are ungated

This design is weaker than the counts file in one respect.

**With no counter, a package that is not enrolled is completely ungated.** A
counts file holds every measured package at its current number from day one.
This design holds nothing until a package is enrolled. While the closure waves
run, residue can grow unchecked in:

- **the out-of-closure packages**, above all `actiondispatch` (77 convergeable,
  74 of them `burndown`) and `actionview` (36), and also `actioncontroller`
  (32), `rack` (15), `trailties` (6), `rack-test` (2) and `rack-session` (1);
- **activerecord and activesupport themselves**, until W2 and W5 enroll them.
  The packages with the most closure traffic are the last to be protected. A
  row W3 converges can be reintroduced by an unrelated port before W5 lands,
  and nothing reds.

That is the net-inflow problem Motivation describes, left open on those
packages for the life of the waves. It should not be read as solved.

**The remedy is to order enrollment, not to keep a contended cell.** A counts
file would close the gap by bringing back the per-PR shared write this RFC
exists to remove, so it is not the remedy. Instead:

- **Small packages first.** Step 1 enrolls the three empty closure packages.
  W1 enrolls activemodel and arel at 3 rows. Every package that can be emptied
  cheaply is enrolled before the large waves start, so inflow can only land in
  the few packages still open.
- **Out-of-closure packages get waves too.** `rack-session` (1), `rack-test`
  (2) and `trailties` (6) are each one small PR to enroll, and `rack` (15) is
  one more. This RFC does not own their waves (Non-goals), but it records the
  exposure. The actionpack-family RFC that owns `actiondispatch`,
  `actionview` and `actioncontroller` should schedule those waves **in
  parallel with** W3–W5, not after the flip. Every week a package goes
  unenrolled is a week its count can grow.
- **Re-measure at every wave.** Each wave's PR body reports the repo-wide
  convergeable count from `parity:api:calls:args:report`, so growth in an
  unenrolled package shows in review even though it does not red. This is
  detection, not prevention, and the RFC does not present it as more.

If the out-of-closure count keeps growing across two waves anyway, that is
evidence for a narrow stopgap on those packages specifically, filed as its own
story with the measurement. It is not grounds to reintroduce a repo-wide
counts file.

## Non-goals

- **Receipting or baselining any `permanent: false` row.** Not at step 1, not
  at enrollment, not at the flip, and not as a "temporary" measure. §1 makes it
  a gate error.
- **Changing the taxonomy to make a package enrollable.** Reclassifying a row as
  permanent is a change to `naming-taxonomy.ts` that needs its own cited Ruby
  site and test. A wave that needs one files it as a separate story.
- **Burning down actionpack-family naming residue.** Out of scope for the drain
  (see `naming-gate-flip`, Re-scope 2026-08-18). This RFC does **not** gate it
  either. §5 records the exposure that leaves, and the ordering that closes it.
- **Gating `naming` outside the AR closure** when the flip lands, beyond what
  enrollment has already reached.
- **`shape` rows.** They are already gated by RFC 0095, and `@missingRailsArgs`
  stays their receipt.

## Alternatives considered

- **Waves only, no ratchet.** This is what RFC 0096 did. It closed with no
  owner for the remainder, and the 08-30 → 09-16 measurement shows +34 since.
  Rejected.
- **A per-package counts file (`naming-residue-mark.ts` + `.json`), tightened
  only-down.** This RFC's first revision. It gates every package from day one,
  which is the one thing it does better (§5). But every converging PR writes a
  shared cell, rebases re-stale it, and three non-overlapping activerecord waves
  had to be serialised on one JSON row. It walks back toward the shared counter
  the repo is migrating off (§ Why not a counts file). Superseded 2026-09-16.
- **A per-file counts file** (shards, as `parity:api:calls`' marks). This
  lowers contention but does not remove it, since two waves in one directory
  can still touch one shard. It keeps the tighten verb and the re-stale-on-rebase
  failure, and it still needs a number for "allowed for now". Rejected.
- **The receipt tag alone, gated everywhere at once.** Reds 257 convergeable
  rows on landing, with no legal receipt for any of them (§3). Rejected.
- **Reuse `@missingRailsArgs` for naming rows.** It keys the call, not the
  identifier, and would suppress a convergeable identifier that shares a call
  with a permanent one (§1). Rejected.
- **Waves first, then arm at zero.** This is how arel's parameter-name mark was
  armed (RFC 0126: enrolled once PRs #7123/#7148 reached zero). Per-package
  enrollment is this alternative applied one package at a time, so the small
  packages are armed early instead of at the very end. Adopted in that form.
- **Flip `naming-gate-flip` now and baseline the convergeable rows as seeded
  debt.** This is exactly what `NAMING_CLASSES` forbids ("Never baseline it"),
  and it turns the closing story into a ratification. Rejected.

## Rollout

Each step is one PR.

1. **`naming-receipt-enrollment-gate`** (trails): the `@missingRailsName` tag
   (a parser in `scripts/api-compare/`, built on `missing-rails-call-tags.ts`
   as `missing-rails-args-tags.ts` is), extractor and `checkCallArgs` support
   keyed by Ruby identifier, the receipt-on-convergeable-row and stale-receipt
   errors, `NAMING_ENROLLED_PACKAGES` with its only-grow gate in the
   `rails-comparison` job, tests, and the trails CLAUDE.md / CONTRIBUTING.md
   lines. It enrolls `i18n`, `globalid` and `activerecord-test-support` with
   their 6 permanent receipts. Estimated ~250–300 LOC: the tag parser reuses
   `missing-rails-call-tags.ts`, and the gate is a filter over rows the report
   already classifies. If it measures over the ceiling, the docs lines and the
   three enrollments move to a follow-up story under this RFC, and the tag
   plus gate land first with an empty set.
2. **W1** `naming-burndown-activemodel-arel`: 3 convergeable rows, 6 receipts.
   Enrolls activemodel and arel.
3. **W2** `naming-burndown-activesupport`: 17 convergeable rows, 14 receipts.
   Enrolls activesupport.
4. **W3** `naming-burndown-activerecord-connection-adapters`: 26 rows.
5. **W4** `naming-burndown-activerecord-relation`: 16 rows.
6. **W5** `naming-burndown-activerecord-remaining`: 26 rows, plus activerecord's
   remaining receipts (47 total across W3–W5). Enrolls activerecord.
7. **W6** `naming-gate-flip`: already rehomed here. Unblocked when steps 2–6
   have merged.

Dependencies: steps 2–6 depend on step 1. Step 5 (W4) depends on step 4 (W3),
and step 6 (W5) on step 5 (W4). Step 7 depends on steps 2–6. The W3 → W4 → W5
edges are for the reasons given in §4, not because of a shared file.

The RFC is active and `naming-gate-flip` is already rehomed. **None of the
story changes below is made by this amendment.** Each is a post-merge action
for whoever files this RFC's stories, done in this order from the main
worktree:

1. **Close the superseded story.** `stories/naming-residue-mark.md` (filed
   before this amendment) still describes the rejected counts file. Its status
   is DB-owned, so it is closed with a verb, never by editing its frontmatter:

   ```sh
   tasks close naming-residue-mark "superseded by the RFC 0153 amendment (tasks#134): counts file replaced by @missingRailsName + NAMING_ENROLLED_PACKAGES; see naming-receipt-enrollment-gate"
   ```

2. **File steps 1–6** with `tasks new 0153-naming-residue-ratchet-and-burndown
<slug> --body-file …`. Each carries this inventory as its Context and the
   `deps:` edges above. Step 1's body names `naming-residue-mark` as the story
   it replaces.
3. **Amend `naming-gate-flip`'s prose** in a markdown PR. Criterion 2 ("seed
   the permanent rows per class") becomes "every in-closure permanent row
   carries a `@missingRailsName` receipt, with its reason in `NAMING_CLASSES`"
   (§4), and `deps:` gains steps 2–6. The story stays blocked, and its status
   is left to `tasks` verbs.

Until those three actions land, the two story files on `main` describe the old
mechanism. This README is authoritative wherever they disagree.

## Verification

- After step 1, on `main`: the enrollment gate is green with `i18n`, `globalid`
  and `activerecord-test-support` enrolled. On a scratch branch, each of these
  reds it, naming the package, the file and the Ruby identifier:
  - a deliberately misnamed local in `globalid`;
  - a `@missingRailsName … — PERMANENT` receipt on a `burndown` row;
  - a receipt with no permanence token, or a bare `CONVERGEABLE`;
  - removing one of the 6 receipts.
- The same misnamed local in an **unenrolled** package does not red. The test
  asserts this, so the §5 tradeoff is pinned rather than accidental.
- Unit test: a receipt keyed on one identifier does not suppress a second
  `naming` row on the same call with a different Ruby identifier.
- Unit test: `NAMING_ENROLLED_PACKAGES` is only-grow. Removing an entry fails a
  guard, the same shape as the extra-surface gate's enrollment guards.
- After each wave: the wave's slice shows 0 convergeable rows in
  `pnpm parity:api:calls:args:report`. An enrolling wave's diff adds exactly its
  package(s) to the list, and its PR body reports the repo-wide convergeable
  count (§5).
- Before W6: in the report's "Naming residue by class", every in-closure row is
  a `permanent` class and receipted; the in-closure `burndown` and
  `module-mixin-receiver` counts are 0; every closure package resolved by
  `ar-closure.ts` is in `NAMING_ENROLLED_PACKAGES`.
- After W6: `naming-gate-flip`'s own acceptance criteria hold, and
  `pnpm parity:api:calls:args` is green on `main`.

## Open questions

1. **Should permanent rows be reported per class?** A per-class receipt tally,
   reported but never gated, would show whether a taxonomy arm is absorbing rows
   it should not. **Recommendation:** report-only, computed from the artifact
   on each run and never committed. A committed tally would be a counts file
   again. **Deferred to `naming-receipt-enrollment-gate`.**
2. **How many `burndown` rows are recorder shape?** **Resolved 2026-09-16:**
   zero of the 84 in-closure rows. Every one carries a differing `ref:` pair,
   so W1–W5 are sized on real renames.
3. **Does the enrollment gate belong in `lint-call-args.ts` or its own script?**
   Folding it in means one CI step and one artifact read, and it is where the
   flip lands anyway. **Recommendation:** fold it in. **Deferred to
   `naming-receipt-enrollment-gate`.**
4. **Does `thisTypedFunctions` make the gate build-state-dependent?** **Design
   decided** (§2 "Build-state independence"). Only the measurement that picks
   the arm is **deferred to `naming-receipt-enrollment-gate`**.

## Changelog

- 2026-09-16: initial RFC. Re-measured on `3c6616b0f1`: 257 convergeable
  repo-wide (was 223 on 08-30), 88 in the closure (84 `burndown` + 4
  `module-mixin-receiver`; `burndown` was 81 on 08-30).
- 2026-09-16: self-review. Measured zero recorder-shape rows in the closure
  (Open question 2 resolved). Serialised the three activerecord waves on the
  shared mark row, added per-wave LOC sizing, deferred every open question to a
  named story, and removed claims the measurements do not support.
- 2026-09-16: review. Enrolled every AR-closure package from `ar-closure.ts`,
  rowless at 0 where it has no rows, so the mark covers the same set the flip
  gates. Committed a deterministic fallback for the `thisTypedFunctions` input.
- 2026-09-16: **amended after merge (tasks#133): replaced the ratchet
  mechanism.** The `naming-residue-mark.ts` + `.json` counts file and its
  tighten script are dropped. A per-package counts cell is written by every
  converging PR, conflicts and re-stales across a dozen parallel agents, and
  forced non-overlapping activerecord waves into series. That is the
  shared-counter shape trails CLAUDE.md step 4 records the repo moving away
  from. In its place: a `@missingRailsName` receipt for the 95 permanent rows
  (§1), an only-grow `NAMING_ENROLLED_PACKAGES` set with no counts (§2), and
  waves whose acceptance criterion is "converge, receipt, enroll" (§4). Step 1
  is now `naming-receipt-enrollment-gate`. Recorded the cost honestly (§5):
  unenrolled packages, including `actiondispatch` (77) and `actionview` (36),
  are ungated until a wave enrolls them. The remedy is enrollment order and
  out-of-closure waves, not a contended counter. The Summary and Motivation are
  re-pointed at the new mechanism; the inventory and measurement are unchanged.
- 2026-09-16: self-review of the amendment. Resolved a deadlock in the
  `thisTypedFunctions` fallback, where permanent `module-mixin-call` rows could
  be neither renamed nor receipted. Added a step-1 size estimate and split
  path, and stated plainly that W3 → W4 → W5 is a scheduling edge.
- 2026-09-16: review (tasks#134). Rollout claimed the superseded
  `naming-residue-mark` story and `naming-gate-flip` criterion 2 were already
  updated; neither is. Restated both as explicit, ordered post-merge actions,
  with the `tasks close` verb for the DB-owned status.
