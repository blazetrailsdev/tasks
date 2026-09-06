---
title: "api-compare's TS-member claim resolves by file order, not by which match is better"
status: draft
updated: 2026-09-06
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`api-compare-pairs-a-ruby-predicate-and-instance-new-onto-one-ts-member`
(PR #7557) made a TS member answerable to at most ONE Ruby member, keyed
`(tsFile, tsName, reader|writer)` in `tsMemberClaims`
(`scripts/api-compare/compare.ts`, in the per-package `main()` loop). That
closed the mispairings it was filed for — duplicate scored pairs across the
whole population are now zero, verified against
`output/call-skeletons.json`.

It resolves contention by **first claimer wins**, not by which claimant is the
better match. That story's acceptance criterion asked for "the better match
wins"; first-claimer was shipped instead because a genuine ranking needs a
pre-pass over every Ruby file in the package before scoring begins, and the
`seen` map that supplies the candidates is built inside the per-file loop, so
the data is not available early enough without duplicating ~500 lines of its
construction.

First-claimer is deterministic — the Ruby file loop is sorted by filename and
`seen` preserves Ruby source order — so results are stable across runs and no
row flaps. But the winner is chosen by file ordering, not by fit. Where Rails
defines a name in two files (`safe_constantize` in
`activesupport/lib/active_support/inflector/methods.rb:315` and
`core_ext/string/inflections.rb:86`; `delete` in
`activerecord/lib/active_record/base.rb` and `persistence.rb`), the
alphabetically-earlier Ruby file takes the TS body regardless of which one the
port actually mirrors. If the loser is the real counterpart, the call gates
score nothing for it — it falls through to the include / mixin / misplaced arms
and is held out of the CALL gates via `checkArity`'s `skipCalls`.

Measured blast radius today: the claim rule fires on a small number of pairs
(the matched/missing counters are unchanged at 14338/16405 overall, 8139/8139
data layer), so this is a precision question, not a coverage regression.

## Converged shape

- Rank candidates rather than taking the first: prefer the claimant whose
  matched candidate has the LOWEST index in `rubyMethodToTsForFqn`'s list (its
  primary spelling matched, not a fallback), then the one whose Ruby file maps
  to `expectedTs` under `rubyFileToTs` (the conventional path, over a mixin or
  misplaced-cluster arm), then filename order as the final tie-break.
- That needs the claims resolved BEFORE the scoring loop. Either hoist `seen`
  construction into its own pass over `byFile` whose result the scoring loop
  consumes, or run a cheap first pass that computes only
  `(rubyFile, rubyName) -> matched candidate + rank` and populates
  `tsMemberClaims`, leaving the scoring loop to read it.
- The `reader|writer` dimension of the key stays as-is; it is correct and not
  what this story changes.

## Acceptance criteria

- [ ] Contention is resolved by candidate rank and pairing path, not by Ruby
      file ordering.
- [ ] Duplicate scored pairs stay at zero (assert over
      `output/call-skeletons.json`, as PR #7557 verified by hand).
- [ ] `pnpm parity:api` deltas non-negative; call / call-args / params /
      extra-surface ratchets green with no baseline widened.
