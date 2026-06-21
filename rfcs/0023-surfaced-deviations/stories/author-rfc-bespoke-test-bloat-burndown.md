---
title: "Author RFC: bespoke TS-only test-bloat burndown (one-file-per-deletion-PR, LOC-exempt, test:compare-invariant)"
status: done
updated: 2026-06-21
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 52
claim: "2026-06-21T19:50:43Z"
assignee: "author-rfc-bespoke-test-bloat-burndown"
blocked-by: null
---

## Context

`test:compare` now reports a per-file **Extra** column (TS-only tests that match
no Rails test) plus `--sort-extra` / `--min-extra=N` triage flags and per-file
`extra` / per-package `totalExtra` in `convention-comparison.json` (shipped in
trails PR #3825, `scripts/test-compare/test-compare.ts`). This surfaced that
`@blazetrails/activerecord` carries **3403 extra (TS only)** tests — TS tests
with no Rails counterpart, a fidelity smell (files ballooned with bespoke /
non-Rails tests).

Top offenders (live `pnpm test:compare --cached --package activerecord --sort-extra`,
snapshot 2026-06-21):

- `relations.test.ts` — 414 extra (vs 279 Rails)
- `calculations.test.ts` — 320
- `finder.test.ts` — 154
- `base.test.ts` — 148
- `enum.test.ts` / `migration.test.ts` — 107 each
- long tail across ~21 files with extra ≥ 50

This story is to **author an RFC** (`pnpm tasks new-rfc <slug>`) that defines the
burndown campaign to remove this bespoke-test bloat. It is the planning
prerequisite; the actual deletion stories are scheduled from the RFC once merged.
This is distinct from RFC 0030 (`0030-ar-test-compare-residual-burndown`), which
un-skips _mapped_ tests — that moves matched/skipped; this campaign removes
_unmatched_ extra tests and must leave matched/skipped untouched.

## Acceptance criteria

The RFC README (authored via `pnpm tasks new-rfc`) must specify:

1. **Scope & motivation.** Burn the per-file `extra` count toward zero,
   prioritized by the `--sort-extra` ranking. Baseline: activerecord 3403 extra
   (cite the snapshot; refresh with `pnpm test:compare --cached --package
activerecord --sort-extra` before each story). Each bespoke test is either
   (a) a genuine Rails test in the wrong place → move (not in scope here; that's
   "misplaced"), or (b) a TS-only test with no Rails equivalent → delete, unless
   it guards a real trails-specific invariant, in which case relocate it out of
   the Rails-mirrored `*.test.ts` into a clearly-marked non-mirrored file so it
   stops counting as extra. The RFC must state how to make that call.

2. **One file per PR for deletions.** Each deletion PR touches exactly one
   `*.test.ts` file (mirrors the existing one-agent-per-PR / non-overlapping-files
   model and avoids sibling-agent conflicts on shared test files).

3. **Deletions are exempt from the 500 LOC ceiling.** Pure-deletion PRs under
   this RFC do not count toward the additions+deletions ceiling — the existing
   ceiling rule (CLAUDE.md "PR size ceiling: 500 LOC") penalizes the very cleanup
   we want. The RFC must propose the exact CLAUDE.md carve-out wording (e.g.
   "pure test-deletion PRs registered under RFC <n> are exempt; a PR that mixes
   deletions with any additions is not") and the `git diff --shortstat` guard
   adjustment, so the ceiling change lands with the RFC rather than ad hoc.

4. **`test:compare` must not change.** Deleting extra (unmatched) tests MUST
   leave the package's `matched`, `matchedSkipped`, `missing`, `wrongDescribe`,
   and `misplaced` counts identical — only `extra` / `totalExtra` drops. The RFC
   must mandate, as the per-PR acceptance gate, a before/after diff of
   `pnpm test:compare --cached --json --package activerecord` showing every count
   unchanged except `extra`/`totalExtra` (and the overall match % unchanged). Any
   movement in matched/skipped/missing means a real Rails test was deleted — the
   PR must be rejected. This is the hard invariant of the whole campaign.

5. **Phasing / clusters.** Group deletion stories by the `--sort-extra` ranking
   (e.g. start with files ≥ 100 extra, then `--min-extra=50`, then the tail),
   one story per file or small same-area cluster, with the LOC carve-out noted so
   they don't all read as ceiling violations.

Out of scope: the deletions themselves (separate stories spawned from the merged
RFC) and any matched/skipped convergence (owned by RFC 0030).
