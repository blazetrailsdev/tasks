---
title: "Ruby gate extractor's unless path still unions or_true, treating unless A || B as a disjunction"
status: closed
updated: 2026-08-07
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6172
claim: null
assignee: null
blocked-by: null
closed-reason: "Closed as not worth doing: the divergence only under-claims (a negated feature lands polarity-blind in :features instead of a no_x guard) — no test is mis-gated and no gate-mismatch row depends on it. Refining our own extractors past the point of observable gain is not port fidelity work; reopen if a real gate-mismatch is ever traced to the unless-path union."
---

## Context

PR #6126 taught `scan_run_condition` to read each boolean at its own negation
parity (`scripts/test-compare/extract-ruby-tests.rb`), replacing the textual
`has_or`/`has_and` with run-space `or_true`/`or_false`. One conservatism was
deliberately kept to hold the existing pin set fixed:

    run_has_or = positive ? acc[:or_true] : (acc[:or_false] || acc[:or_true])

The `|| acc[:or_true]` on the `unless` path is not sound-driven. `unless A || B`
runs on `!A && !B` — a pure CONJUNCTION — so `run_has_or` should be false there and
the polarity split should fire. Keeping `or_true` in the union means every `unless`
condition containing any boolean at all is treated as a disjunction, exactly as the
pre-#6126 `has_and || has_or` did.

The fidelity target is `gateFromGuardExpr` (`scripts/test-compare/gates.ts:186-215`),
which reads polarity at run-condition level with no such union. This is the last
place the two extractors disagree by construction.

The effect is under-claiming, not unsoundness: a withheld decomposition means a
negated feature gets lumped polarity-blind into `:features` instead of becoming a
`no_x` guard, and a sound negated-adapter exclusion is not emitted. It is still a
divergence between the run condition and what the extractor believes.

## Converged shape

    run_has_or = positive ? acc[:or_true] : acc[:or_false]

Then diff the per-gate JSON across the whole vendored suite before/after, as #6126
did — `output/rails-tests.json`, per test, NOT the summary count, which can stay
flat while gates move. #6126's baseline for that diff was 22,903 tests / 1,916
gated / 0 moved. Any test that moves here is a real gate change and needs its own
justification in the PR body; `pnpm parity:test --gates` gate-mismatch count must
not rise.

## Acceptance criteria

- [ ] The `|| acc[:or_true]` union is gone from the `unless` path.
- [ ] Every existing pin in `extract-ruby-gates.test.ts` still passes, or a moved
      pin is justified against `gates.ts`'s reading of the same shape.
- [ ] A pin covers `unless A || B` answering the conjunction path.
- [ ] Per-gate diff of `output/rails-tests.json` reported in the PR body.
