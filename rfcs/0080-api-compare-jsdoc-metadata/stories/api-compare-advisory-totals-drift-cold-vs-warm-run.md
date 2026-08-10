---
title: "parity:api advisory option-key totals drift between cold and warm runs"
status: done
updated: 2026-07-30
rfc: "0080-api-compare-jsdoc-metadata"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 5662
claim: "2026-07-30T19:29:17Z"
assignee: "api-compare-advisory-totals-drift-cold-vs-warm-run"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while re-baselining the arity summary for PR #5654
(`synthesized-mixin-members-report-zero-params`).

Two consecutive `API_COMPARE_FORCE=1 pnpm parity:api` runs over the SAME
working tree printed different advisory option-key totals:

```text
first run (cold)  Option keys (advisory): 103 pairs compared, 15 with keys missing in TS, 64 differ total
later runs (warm) Option keys (advisory): 104 pairs compared, 15 with keys missing in TS, 65 differ total
```

The 104/65 figure reproduced on `origin/main`, on the branch's first commit,
and on its refactor commit; the 103/64 figure appeared only on the first run
in the session. `API_COMPARE_FORCE=1` was set on every run, so the force flag
does not clear whatever state is responsible — the shared extractor cache
(`shared-cache.ts`, see also the known TS-cache call under-reporting) is the
prime suspect: on a cold run one file's parsed API appears to be missing an
options-shaped trailing parameter that a warm run resolves.

Why it matters: any story asked to state before/after advisory counts (this
RFC requires exactly that for arity) can silently attribute a ±1 to its own
change when it is really a cold-vs-warm artifact. PR #5654's body originally
claimed the option-keys total moved 103→104 because of the change; measuring
both sides warm showed it was unchanged. An agent that measures baseline cold
and result warm gets a fabricated delta.

Arity totals did NOT drift across the same runs (7546 cold and warm on main,
7547 on the branch), so the instability is at least not universal — but it is
not obviously confined to option keys either; nothing was measured enough
times to say.

## Acceptance criteria

- Reproduce the cold-vs-warm split deterministically (run `parity:api` twice
  from a genuinely cold cache on an unchanged tree) and identify which pair
  appears/disappears, and which cache layer drops it.
- Fix the underlying cache-warmth dependence so a summary count is a function
  of the tree, not of run order — or, if a cached-vs-fresh difference is
  unavoidable, make the cold run refuse to print advisory totals rather than
  print wrong ones.
- Confirm `API_COMPARE_FORCE=1` clears everything it claims to; if it does
  not cover this cache, either extend it or document precisely what it skips.
- Add a regression test at whatever layer the bug lives (extractor cache or
  compare aggregation).
