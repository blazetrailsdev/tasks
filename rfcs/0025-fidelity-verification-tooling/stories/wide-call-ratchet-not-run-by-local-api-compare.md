---
title: "Wide call ratchet is CI-only; converging a divergence fails it unexpectedly"
status: in-progress
updated: 2026-07-24
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: 20
pr: 5221
claim: "2026-07-24T13:08:25Z"
assignee: "wide-call-ratchet-not-run-by-local-api-compare"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in #5027 (story `arel-attribute-over-not-in-window-predications`),
which failed CI on the `rails-comparison` job after passing every local check.

`pnpm api:compare` runs the narrow call ratchet only. The wide call ratchet is
a separate CI step (`.github/workflows/ci.yml:1258-1263`):

```sh
pnpm exec tsx scripts/api-compare/compare.ts --wide-calls
pnpm exec tsx scripts/api-compare/lint-call-mismatches-wide.ts
```

The tooling already exists as `pnpm api:calls:wide` (`package.json:29`) — this
is a discoverability gap, not a missing script. Nothing in `CLAUDE.md` or the
fidelity-verification guidance mentions running it before pushing, so an agent
that verifies "api:compare and test:compare deltas non-negative" (the standard
story gate wording) still misses it.

The failure mode is counter-intuitive and therefore likely to recur: the wide
baseline is **only-shrink**, so it fails not just on new mismatches but on
_converged_ ones. Fixing a real divergence makes a baseline entry stale and
turns CI red. In #5027, adding the `String` arm to `visit_Arel_Nodes_Over`
started genuinely calling `quote_column_name`, which made the baselined
"omits quote_column_name" entry stale:

```text
wide call-mismatches ratchet: 1 STALE baseline entr(ies) that no longer flag.
  - arel  visitors/to-sql.ts  visit_Arel_Nodes_Over  quote_column_name
```

Any PR that converges a visitor or method body toward Rails can trip this. The
cost is a full CI cycle plus the agent having to discover the wide tree, and
the correct minimal fix (delete the converged entry, _not_ `--write`, which
reseeds everything — see `wide-calls-exclude-reseed-reorders-untouched-packages`).

## Acceptance criteria

- [ ] `CLAUDE.md` (or the fidelity-verification doc it points to) tells agents
      to run `pnpm api:calls:wide` alongside `api:compare` / `test:compare`
      before pushing, and states that it needs `compare.ts --wide-calls` to
      have regenerated the artifact first.
- [ ] The only-shrink behaviour is stated explicitly: converging a divergence
      makes a baseline entry stale and **fails** the gate; the fix is to remove
      that entry, not to `--write` reseed.
- [ ] Cross-reference the reseed-churn hazard already tracked in
      `wide-calls-exclude-reseed-reorders-untouched-packages`.
- [ ] Consider whether `pnpm api:compare` should run the wide lint itself (or a
      combined `api:gates` script should exist) rather than relying on docs;
      record the decision either way.
