---
title: "Ruby gate extractor inverts feature polarity on the unless path"
status: done
updated: 2026-08-05
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 70
pr: 6115
claim: "2026-08-05T02:45:04Z"
assignee: "row-count-is-debt-not-seeded-reasons"
blocked-by: null
closed-reason: null
---

## Context

PR #5683 made both gate extractors read feature-predicate polarity while the run
condition is a pure conjunction. The two sides are deliberately NOT symmetric on
the `unless` / `skipIf` path, and that asymmetry is the remaining half of the
trap #5683 closed.

`gate_from_run_condition` (`scripts/test-compare/extract-ruby-tests.rb:609-625`)
splits polarity only when `positive && !acc[:has_or]`. On the `unless` path it
still inverts its whole feature list **textually**
(`extract-ruby-tests.rb:673-682`), so:

- `skip if !supports_x?` — run condition `supports_x?` — emits
  `guards: [no_x]` where the truth, and what `gates.ts` now emits, is
  `features: [x]`.
- `skip "x" if current_adapter?(:Mysql2Adapter) && !@connection.send(:supports_rename_index?)`
  (`vendor/rails/activerecord/test/cases/migration/foreign_key_test.rb:96`) —
  run condition `!mysql || rename_index` — emits `guards: [no_rename_index]`,
  the inverted claim, though as a guard it is non-comparable and therefore
  currently harmless. Pinned in `extract-ruby-gates.test.ts` by the test named
  `reads a supports_X? predicate reached through send`.

`gateFromGuardExpr` (`scripts/test-compare/gates.ts:186-215`) instead splits
whenever `!runIsDisjunctive`, reading polarity at run-condition level
(`negated = runsWhenTrue ? negatedInText : !negatedInText`).

**Why Ruby was not simply made to match.** `acc[:has_or]` is textual — it is set
only for a literal `||`/`or` in the condition sexp. But `unless A && !B` runs on
`!A || B`, a disjunction `has_or` never sees. Splitting the `unless` path
without first teaching `has_or` about `unless`-induced disjunction would trade a
harmless non-comparable guard for an actively under-claiming feature gate. The
wholesale inversion is safely uninformative; a naive split is not.

**No Rails test hits this today.** The only conjoined-polarity sites in the
vendored suite are `insert_all_test.rb:282` and `:403`, both on the
run-when-true path and both fixed by #5683. This is latent, not live — the same
class of trap #5683 itself closed, so it is worth converging before the next
Rails test lands in the `skip if !supports_x?` shape.

## Acceptance criteria

- Teach the Ruby extractor to recognize `unless`-induced disjunction (the run
  condition of `unless A && B` is `!A || B`) so `has_or` reflects the RUN
  condition rather than the source condition, then apply the same
  pure-conjunction polarity split the `if` path already uses.
- `skip if !supports_x?` extracts `features: [x]` on both sides; the
  `foreign_key_test.rb:96` `send` shape resolves to a non-comparable gate rather
  than an inverted `no_` guard. Update the two pins in
  `extract-ruby-gates.test.ts` deliberately rather than leaving contradictory
  expectations.
- `pnpm parity:test --gates` gate-mismatch count does not rise. Diff the
  `--gates` output AND the per-gate JSON (`output/rails-tests.json`,
  `output/ts-tests.json`) before and after — the summary count can stay flat
  while individual gates move, which is how #5683's two real changes surfaced.
- Keep the `if`-path and disjunctive behavior #5683 established unchanged.

Hard rules: NO `node:*` imports. NO `process.*` references. Async fs only. No
new third-party runtime deps. Test names match Rails verbatim.
