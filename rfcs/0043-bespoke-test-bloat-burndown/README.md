---
rfc: "0043-bespoke-test-bloat-burndown"
title: "ActiveRecord bespoke TS-only test-bloat burndown"
status: active
created: 2026-06-21
updated: 2026-06-24
owner: "@deanmarano"
packages:
  - "activerecord"
clusters:
  - "extra-burndown"
related-rfcs:
  - "0030-ar-test-compare-residual-burndown"
---

<!-- Unnumbered until merge: keep `rfc:` as 0000-bespoke-test-bloat-burndown and
     the H1 number-free. `scripts/finalize-rfc.mjs` swaps 0000 for the assigned
     number at merge. -->

# RFC — ActiveRecord bespoke TS-only test-bloat burndown

## Summary

`@blazetrails/activerecord` carries **3403 "extra" (TS-only) tests** — `it`
declarations in Rails-mirrored `*.test.ts` files that match no Rails test. They
are a fidelity smell: files ballooned with bespoke / non-Rails assertions that
make the suite slower and obscure true Rails parity. This RFC defines the
campaign to burn the per-file `extra` count toward zero, one `*.test.ts` file per
deletion PR, while leaving the `test:compare` parity metrics (`matched`,
`matchedSkipped`, `missing`, `wrongDescribe`, `misplaced`) **bit-for-bit
unchanged** — only `extra` / `totalExtra` may drop.

This is the deletion counterpart to **RFC 0030**
(`0030-ar-test-compare-residual-burndown`), which _un-skips mapped_ tests (moving
`matchedSkipped` → `matched`). RFC 0030 changes the parity metrics by design;
this campaign must not touch them. The two are disjoint: 0030 owns the matched
tests Rails has; this RFC owns the unmatched tests Rails does not.

## Motivation

`test:compare` now reports a per-file **Extra** column (TS-only tests matching no
Rails test) plus `--sort-extra` / `--min-extra=N` triage flags, and emits
per-file `extra` / per-package `totalExtra` in `convention-comparison.json`
(shipped in trails PR #3825, `scripts/test-compare/test-compare.ts`).

That surfaced the problem. Snapshot — `pnpm test:compare --cached --package
activerecord --sort-extra`, **2026-06-21**: `@blazetrails/activerecord` carries
**3403 extra (TS only)** tests. Top offenders:

| File                   | Extra | Rails tests |
| ---------------------- | ----: | ----------: |
| `relations.test.ts`    |   414 |         279 |
| `calculations.test.ts` |   320 |         233 |
| `finder.test.ts`       |   154 |         261 |
| `base.test.ts`         |   148 |         170 |
| `enum.test.ts`         |   107 |           — |
| `migration.test.ts`    |   107 |           — |

(Blank "Rails tests" cells are values not captured in the 2026-06-21 snapshot;
each deletion story re-derives its file's exact Rails count from the fresh
`--json` run.) …with a long tail across ~21 files at extra ≥ 50.

Why this is debt, not coverage:

- **Fidelity.** Our north star is Rails parity. A test with no Rails counterpart
  asserts behavior Rails never specified — it pins trails to an _invented_
  contract that may itself be a deviation, and it inflates the suite the
  `test:compare` gate is meant to keep honest.
- **Cost.** The AR suite forks 6 workers per invocation; 3403 redundant tests are
  pure CI tax (the very `mysql:8` DDL cost RFC 0028 is fighting).
- **Noise.** Bespoke tests are where shared-table flakes and bespoke-schema
  divergences breed (see the canonical-schema burndown, RFC 0019).

The Extra column makes the debt measurable and rankable for the first time, so it
can be retired story-by-story with a hard, machine-checkable invariant.

## Design

### The triage decision (per extra test)

For every `it`/`test` counted as `extra` in a file, classify it:

1. **Genuine Rails test in the wrong place → MOVE.** It exists in Rails but under
   a different file/describe. This is _misplaced_, not extra-to-delete, and is
   **out of scope** for this RFC's deletion stories — handle it under the
   existing misplaced/wrong-describe workflow. (If `test:compare` already counts
   it as `misplaced`/`wrongDescribe` it is not in the `extra` bucket anyway.)

2. **TS-only, no Rails equivalent, no trails-specific invariant → DELETE.** The
   default disposition. The test asserts behavior Rails does not specify and that
   is not a deliberate trails contract. Delete it.

3. **TS-only but guards a real trails-specific invariant → RELOCATE.** A small
   minority guard genuine trails-only behavior (a TS porting hazard, an esbuild
   class-rename trap, a sync-validation guarantee — the kinds of things captured
   in project memory). These must **not** be lost. Move them _out_ of the
   Rails-mirrored `*.test.ts` into a clearly-marked non-mirrored file so they stop
   counting as `extra`. Convention: a sibling file named `*.trails.test.ts`
   (e.g. `relations.trails.test.ts`), which `test:compare` does not pair against
   any `*_test.rb` and therefore excludes from the `extra` tally. The relocated
   test keeps its assertion verbatim; only its home file changes.

**How to decide MOVE vs DELETE vs RELOCATE.** Read the corresponding Rails test
file first (the same rule as everywhere in this repo — never reword a test to
make it match). Then:

- If an equivalent assertion exists in Rails under another name/file → it is
  matched or misplaced, not extra; leave it (or fix placement under the misplaced
  workflow). Not this campaign.
- If no Rails equivalent exists, ask: _does this guard a deliberate, documented
  trails deviation or a TS-specific hazard?_ Evidence required to RELOCATE rather
  than DELETE: a tracked deviation/convergence story, a project-memory entry, an
  `@internal` note, or an inline `// trails-specific:` rationale already present.
  Absent such evidence, the default is DELETE — a bespoke assertion with no Rails
  basis and no recorded invariant is bloat.
- When genuinely unsure whether an invariant is real, **relocate, don't delete** —
  relocation is reversible and still zeroes the `extra` count; a wrong deletion
  loses coverage silently. Note the uncertainty in the PR body.

### One file per deletion PR

Each deletion PR touches **exactly one** `*.test.ts` file. This mirrors the
repo's one-agent-per-PR / non-overlapping-files model and avoids sibling-agent
conflicts on shared test files (multiple agents editing `relations.test.ts`
concurrently would collide). A RELOCATE PR may additionally create the single
sibling `*.trails.test.ts` for that one source file — that is still
"one file's worth" of churn and is allowed, but a deletion PR that also edits a
_second, unrelated_ `*.test.ts` is not.

### LOC-ceiling carve-out

Pure-deletion PRs registered under this RFC are **exempt from the 500 LOC
ceiling** (CLAUDE.md "PR size ceiling: 500 LOC"). The ceiling exists to bound
review cost on _added_ code; it actively penalizes the cleanup we want here,
where the whole point is large negative diffs. Proposed CLAUDE.md wording
(added to the "PR size ceiling" bullet):

> **Exemption — RFC <n> test-deletion PRs.** A PR registered under RFC <n>
> (bespoke TS-only test-bloat burndown) that _only_ deletes lines from exactly
> one `*.test.ts` file (optionally creating one sibling `*.trails.test.ts` for
> relocated trails-specific invariants) is exempt from the 500 LOC ceiling. The
> exemption is forfeit the moment the PR adds any _other_ code: a PR that mixes
> deletions with additions outside the single relocation sibling is **not**
> exempt and is measured normally.

`git diff --shortstat` guard adjustment: the existing check
`git diff --shortstat origin/main...HEAD -- ':!**/pnpm-lock.yaml'
':!**/__snapshots__/**' ':!**/*.md'` stays as the _measurement_, but for an
RFC-<n> deletion PR the gate passes when the diff is deletion-dominant —
concretely, when `insertions == 0` outside an optional single `*.trails.test.ts`
relocation sibling. Reviewers verify "deletions-only (plus at most one relocation
sibling)" rather than "≤ 500 changed lines".

**Where these two edits land (cross-repo sequencing).** This RFC merges in the
**tasks** repo, but the "PR size ceiling: 500 LOC" bullet and the
`git diff --shortstat` guard live in **trails** (`CLAUDE.md`) — they cannot land
in this PR. The carve-out is therefore owned by a dedicated **Phase 0** trails
story, `add-rfc-deletion-loc-carve-out`, which edits trails `CLAUDE.md` (and any
CI shortstat check) to add the exemption above with `<n>` resolved to this RFC's
finalized number. That story is a **hard dependency of every deletion story** and
must merge _before_ the first Phase 1 deletion PR — otherwise the very first
deletion PR trips the 500 LOC ceiling it is meant to be exempt from. The deletion
stories carry it as a `deps`/`blocked-by` edge so the scheduler cannot release a
deletion PR ahead of it. See Open question 3.

### The hard invariant: `test:compare` must not move

Deleting _extra_ (unmatched) tests must leave the package's `matched`,
`matchedSkipped`, `missing`, `wrongDescribe`, and `misplaced` counts **identical**
— only `extra` / `totalExtra` may drop (and the overall match % must be
unchanged, since extra tests are not in the % denominator). Any movement in
`matched` / `matchedSkipped` / `missing` means a **real Rails test was deleted** —
reject the PR.

**Per-PR acceptance gate (mandatory).** Capture before/after and diff:

```sh
# before (on origin/main)
pnpm test:compare --cached --json --package activerecord > /tmp/before.json
# after (on the PR branch)
pnpm test:compare --cached --json --package activerecord > /tmp/after.json
# every count must be identical except extra / totalExtra
```

The PR body must paste the before/after `totalExtra` and assert all of
`matched`, `matchedSkipped`, `missing`, `wrongDescribe`, `misplaced`, and
`percent` are unchanged. This is the single hard invariant of the whole campaign;
a story is not done until its PR demonstrates it.

### Refresh the baseline before each story

The 3403 figure is a 2026-06-21 snapshot. Counts drift as 0030 un-skips land and
as deletion PRs merge, so each story **must** re-run
`pnpm test:compare --cached --package activerecord --sort-extra` (and `--json`
for the gate) at start and cite the fresh per-file `extra` it targets.

## Alternatives considered

- **Bulk multi-file deletion PRs.** Faster on paper, but collides with the
  one-agent-per-PR model, produces sibling-agent file conflicts on shared test
  files, and makes the `test:compare` invariant harder to attribute per file.
  Rejected for the same reasons the repo already forbids fan-out.
- **Keep bespoke tests, just tag them.** Tagging without relocating leaves them in
  the `extra` tally and in the fork cost; only relocation out of the mirrored file
  actually removes them from the metric. Rejected except for the genuine-invariant
  minority, which _is_ the RELOCATE path.
- **Fold into RFC 0030.** 0030 deliberately _moves_ parity metrics
  (`matchedSkipped` → `matched`); this campaign's defining constraint is that it
  must _not_. Mixing them would destroy the clean before/after invariant. Kept
  disjoint on purpose.
- **Auto-delete by script.** A blanket "delete every extra" script would silently
  drop the genuine-invariant minority (path 3). Human triage per file is required
  precisely to catch those.

## Rollout

Phased by the `--sort-extra` ranking. One story per file, or a small same-area
cluster of low-extra siblings, each carrying the LOC carve-out note so it does not
read as a ceiling violation.

0. **Phase 0 — land the LOC carve-out (trails):** story
   `add-rfc-deletion-loc-carve-out` edits trails `CLAUDE.md` (and any CI
   shortstat check) to add the exemption wording, with `<n>` = this RFC's
   finalized number. Hard dependency of every deletion story; must merge first.
1. **Phase 1 — heavy hitters (extra ≥ 100):** `relations.test.ts` (414),
   `calculations.test.ts` (320), `finder.test.ts` (154), `base.test.ts` (148),
   `enum.test.ts` (107), `migration.test.ts` (107). One story per file.
2. **Phase 2 — `--min-extra=50`:** the ~15 mid-tail files between 50 and 100
   extra. One story per file.
3. **Phase 3 — the tail (`extra` < 50):** remaining files, grouped into
   small same-area clusters (e.g. per `adapters/postgresql/*`) where a single
   agent can clear several low-count siblings without file-overlap risk.

Phase N+1 is scheduled only after Phase N's snapshot is re-taken, so each phase
works against fresh counts. Story IDs are filled in as the deletion stories are
created from this merged RFC.

## Open questions

1. **Relocation file naming.** Proposed `*.trails.test.ts`. The convention map
   is **Ruby-driven**: `rubyToConventionTs` (`scripts/test-compare/test-compare.ts:53-72`)
   turns each `foo_test.rb` into exactly one `foo.test.ts` target — it never
   emits a `foo.trails.test.ts`, so a relocated test is invisible to the
   per-Ruby-file matching pass. The one thing to confirm is whether the `extra`
   counter (trails PR #3825) is _also_ Ruby-driven (counts only TS tests sitting
   in a convention-mapped file with no Ruby partner) or independently sweeps
   _all_ globbed `*.test.ts`; if the latter, a `*.trails.test.ts` would still be
   swept and a suffix/dir the sweep already ignores must be chosen instead.
   First Phase 1 story must read the `extra`-counting code, confirm the suffix is
   excluded, and pin the convention there.
2. **Do relocated `*.trails.test.ts` tests need their own gate?** They run in CI
   like any test but are invisible to `test:compare`. Recommendation: yes — they
   stay subject to normal `vitest` CI; no special gate needed.
3. **Where does the cross-repo carve-out land?** The CLAUDE.md exemption and the
   `git diff --shortstat` guard live in **trails**, but this RFC merges in
   **tasks** — they cannot ride this PR. Recommendation (adopted in the
   LOC-ceiling carve-out section and Rollout Phase 0): a dedicated trails story
   `add-rfc-deletion-loc-carve-out` lands them before any deletion PR, wired as a
   hard `deps`/`blocked-by` edge on every deletion story so the scheduler cannot
   release a deletion PR ahead of it. Confirm at finalize that `<n>` is
   substituted with the assigned RFC number in the CLAUDE.md wording.

## Stories

Deletion stories are created from this RFC after merge, one per file per the
Rollout phases. Each story body must cite its fresh `--sort-extra` per-file
`extra`, carry the LOC carve-out note, and embed the before/after
`test:compare --json` invariant as its acceptance gate.

<!-- generated: stories table -->

| ID                                                                                                                      | Title                                                                                        | Status | Est LOC | Cluster |
| ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------ | ------- | ------- |
| [autosave-destroy-describe-canonical-unskip](stories/autosave-destroy-describe-canonical-unskip.md)                     | Convert + un-skip bespoke TestDestroyAsPartOfAutosaveAssociation block to canonical models   | ready  | 150     | —       |
| [counter-cache-aliased-column-test-canonical-fixtures](stories/counter-cache-aliased-column-test-canonical-fixtures.md) | Converge bespoke legacy_posts/legacy_comments aliased-counter test to canonical Post/Comment | ready  | 30      | —       |
| [immutable-strings-by-default-tests-converge-to-rails](stories/immutable-strings-by-default-tests-converge-to-rails.md) | Converge immutable_strings_by_default tests to Rails schema-inference fidelity               | ready  | 40      | —       |

## Changelog

- 2026-06-21: initial RFC.
