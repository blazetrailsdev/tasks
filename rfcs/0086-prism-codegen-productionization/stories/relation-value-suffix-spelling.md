---
title: "Decide the relation *_value/*_values spelling: converge the port or canon the scorer"
status: closed
updated: 2026-08-05
rfc: "0086-prism-codegen-productionization"
cluster: null
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Superseded by the 2026-08-05 prism-codegen coverage audit: the generator is being retired (0084-wide-call-set-burndown/retire-prism-codegen-tooling), so improving its output is work on a deleted directory. Evidence: 0 shipped lines from codegen:apply, 963 tsc errors across all 10 emitted files, 81.8% whole-corpus node coverage that does not translate to usability."
---

## Context

Measured while sweeping `TOKEN_CANON` for PR #5825. Rails' relation stores its
query state in `*_value` / `*_values` readers; the trails port drops the
suffix. That produces a pure-naming `ref:` mismatch in the scorer's divergent
skeletons on a cluster of `query_methods.rb` defs — the same class of noise
`modelClass: "model"` (#5818) and `arelTable: "table"` (#5825) removed, but
mechanical across a whole family rather than a single receiver.

Measured pairs (gen vs port), each the _only_ difference in that def:

- `readonlyBang`, `relation.rb :: isReadonly` — `ref:readonlyValue` vs `ref:readonly`
- `distinctBang` — `ref:distinctValue` vs `ref:distinct`
- `strictLoadingBang` — `ref:strictLoadingValue` vs `ref:strictLoading`
- `skipQueryCacheBang` — `ref:skipQueryCacheValue` vs `ref:skipQueryCache`
- `skipPreloadingBang` — `ref:skipPreloadingValue` vs `ref:skipPreloading`
- `regroupBang` — `ref:groupValues` vs `ref:groupColumns`
- `annotateBang` — `ref:annotateValues` vs `ref:annotations`

Decide deliberately between two outcomes — they are not equivalent:

1. **Converge the port** to Rails' `*Value` / `*Values` spelling. Higher
   fidelity (fidelity is the primary goal), but a wide rename with many call
   sites, and `groupColumns` / `annotations` are renames of _different_ words,
   not just suffix drops.
2. **`TOKEN_CANON` entries** for the suffix family only. Cheap, denoises the
   review queue, but enshrines a naming deviation in the scorer.

Prefer (1) unless the call-site count makes it infeasible in one PR; do not
add canon entries for `groupColumns` / `annotations`, which would collapse
genuinely differently-named receivers.

## Acceptance criteria

- A decision recorded in the PR body with the measured call-site count for the
  rename option.
- Whichever path is taken, report `pnpm codegen:score` matched count before and
  after and name the defs whose skeletons are cleaned.
- `pnpm codegen:score --guard` stays green.
- If canon entries are added, each gets a scorer unit test that fails without it.
