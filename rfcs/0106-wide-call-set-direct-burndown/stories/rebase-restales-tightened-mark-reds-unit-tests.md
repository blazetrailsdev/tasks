---
title: "A rebase can re-stale an already-tightened mark, and it reds Unit Tests"
status: in-progress
updated: 2026-08-21
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6816
claim: "2026-08-21T12:50:30Z"
assignee: "alert-on-stats-sync-failure"
blocked-by: null
closed-reason: null
---

# A rebase can re-stale an already-tightened mark, and it reds Unit Tests

## Context

Surfaced by PR #6725 (RFC 0106 wave 4d), which lost a CI round to it.

Every story in this RFC deletes exclude rows and then runs
`pnpm parity:api:calls:tighten <shard>`. That leaves the branch with a _lowered_
mark. When `main` subsequently advances and the branch rebases, git takes
main's copy of the mark shard whenever the branch's own commit did not conflict
with it — **silently, with no conflict and nothing in the rebase output**. The
row deletion still stands, so the tight value is now lower than the restored
mark and the shard is stale again.

Concretely on #6725:

```console
$ # branch: deleted 1 row from associations/has-one-association.json, tightened 9 -> 8
$ git rebase origin/main      # clean, no conflict
$ pnpm parity:api:calls
call-mismatches unreviewed ratchet: STALE high-water mark
  - activerecord/associations/has-one-association.json  mark 8, only 7 unreviewed
```

### Why it is worse than it looks

Two CI jobs go red and only one of them names the ratchet:

- `Rails API/Test Comparison` — the expected STALE message.
- `Unit Tests` — `scripts/api-compare/lint-call-mismatches.test.ts:382`,
  `AssertionError: expected [ [ "activerecord/associations/has-one-association.json", 8 ] ] to deeply equal []`.

That test asserts the mark set carries no stale entries, so a **baseline-only**
edit surfaces as a **unit-test** failure with no visible connection to the
diff. On a PR whose diff is two source lines, that reads as an unrelated flake,
and the documented advice for this repo is to not debug flakes in feature PRs —
so the real cause is easy to dismiss.

This is structurally likely for this RFC specifically: its PRs are, by
construction, mark-lowering PRs, and they are long-lived enough to rebase.
PR #6725 hit it twice — once mid-flight and once when a sibling PR (#6717) landed
touching the same two shards.

## Possible shapes (triage decides)

1. **Auto-tighten in the gate.** `lint-call-mismatches.ts` already prints "A
   mark only shrinks, so tightening is always safe" before telling the author
   to run a command that does exactly that. If it is always safe, the gate
   could do it and report what it lowered instead of failing.
   **Counter-argument to weigh:** the error is also a _signal_ that a row
   retired, which a reviewer may want surfaced rather than silently applied.
   A middle option is to auto-tighten only shards the PR already modifies and
   keep failing for any others.
2. **Narrow the blast radius.** Have the ratchet compare against the merge-base
   rather than the working tree's shard value, so a rebase that restores main's
   mark is not treated as drift.
3. **At minimum, make the failure legible.** Have
   `lint-call-mismatches.test.ts`'s assertion message name the remedy
   (`parity:api:calls:tighten <shard>`) so the `Unit Tests` red is
   self-explanatory.

Option 3 is cheap and strictly an improvement regardless of which of 1/2 is
chosen.

## Related

`api-build-lower-unreviewed-marks-on-drop` (0083, done) fixed the analogous gap
for `parity:api:build`, which knew exactly which shards it had rewritten and so
could lower just those. The rebase case has the same "we know which shards are
affected" property — the PR's own diff names them.

## Acceptance criteria

- [ ] A branch that deletes an exclude row, tightens, and then rebases onto a
      `main` that touched the same shard does NOT red either
      `Rails API/Test Comparison` or `Unit Tests` without the author having to
      re-run `tighten` by hand — or, if triage prefers to keep the manual step,
      the failure message names the exact remedy in both jobs.
- [ ] Only-shrink is preserved: no path may raise a mark.
- [ ] A shard reaching 0 is still deleted, not written as `{"max": 0}`.
- [ ] `scripts/api-compare/lint-call-mismatches.test.ts` covers the
      rebase-restores-a-higher-mark case explicitly.
