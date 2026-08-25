---
title: "Ruby gate extractor's has_or/has_and are textual, blind to negation parity"
status: done
updated: 2026-08-05
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6126
claim: "2026-08-05T12:15:04Z"
assignee: "datetime-new-start-preserves-the-receiver"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in PR #6115, which taught `gate_from_run_condition` that `unless A && B`
runs on `!A || B` by adding a textual `has_and` alongside the textual `has_or`
(`scripts/test-compare/extract-ruby-tests.rb`, `scan_run_condition`):

```ruby
acc[:has_or]  = true if node[0] == :binary && (node[2] == :"||" || node[2] == :or)
acc[:has_and] = true if node[0] == :binary && (node[2] == :"&&" || node[2] == :and)
run_has_or = positive ? acc[:has_or] : (acc[:has_and] || acc[:has_or])
```

Both flags are set from the operator token alone, ignoring the `negated` parity
that the very same walk already tracks for feature and adapter predicates. So a
disjunction introduced or cancelled by an inner `!` is invisible:

- `if !(A && B)` runs on `!A || B` — a disjunction. `has_or` is false, so the
  polarity split fires and the extractor treats it as a pure conjunction.
- `unless !(A || B)` runs on `A || B` — also a disjunction, and `has_and` is
  false, same miss on the other path.

This is the identical class of trap twice closed already
(`ruby-gate-extractor-drops-conjoined-adapter-set`,
`ruby-gate-extractor-unless-path-inverts-feature-polarity`): the run condition
and the source text disagree, and the extractor believes the text.

Latent today. #6115 diffed the per-gate JSON across the whole vendored suite —
1,929 gated tests, zero moved — so no Rails test currently nests a boolean
under a negation. Worth closing before one does.

This is test-extraction tooling with no single Rails counterpart; the fidelity
target is `gateFromGuardExpr` in `scripts/test-compare/gates.ts:186-215`, which
reads polarity at run-condition level and is the side to converge toward.

## Converged shape

- Replace the two textual flags with one parity-aware pair computed during the
  walk: for a binary node at negation parity `negated`, the effective operator
  in "condition is true" space is the token flipped when `negated`. Record
  `or_true` / `or_false` from that, and let
  `run_has_or = positive ? acc[:or_true] : acc[:or_false]`.
- Keep the `if`-path and `unless`-path outcomes identical for every shape that
  contains no negated boolean — that is the whole existing pin set.
- Add pins for `if !(A && B)` and `unless !(A || B)`.

## Acceptance criteria

- [ ] `has_or` / `has_and` replaced by parity-aware run-space flags.
- [ ] All existing pins in `extract-ruby-gates.test.ts` pass unchanged.
- [ ] New pins cover both negated-boolean shapes.
- [ ] `pnpm parity:test --gates` gate-mismatch count does not rise, verified by
      diffing `output/rails-tests.json` per-gate before/after, not the summary
      count alone (the summary can stay flat while gates move).
