---
title: "Emit expression-position begin and case via the invoked-arrow wrapper"
status: closed
updated: 2026-08-05
rfc: "0086-prism-codegen-productionization"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Superseded by the 2026-08-05 prism-codegen coverage audit: the generator is being retired (0084-wide-call-set-burndown/retire-prism-codegen-tooling), so improving its output is work on a deleted directory. Evidence: 0 shipped lines from codegen:apply, 963 tsc errors across all 10 emitted files, 81.8% whole-corpus node coverage that does not translate to usability."
---

## Context

Left over from #6113 (`blocks-conditionals-rescue-images`), which took the
control/blocks bucket to zero for lambdas, expression-position multi-statement
if/unless, chained rescues, and trailing-splat multi-assign. Two adjacent
expression-position shapes still emit `__PRISM_TODO` in the generated corpus.

**1. `BeginNode` in expression position.** `BeginNode` is registered with
`r.onStmt` only (`scripts/prism-codegen/handlers/control.ts`), so a `begin`
used as a value declines. Live instances in the corpus, all the memoization
idiom `x ||= begin ... end`:

- `out/persistence.js:116` — `values[primary_key] ||= begin ... end`
- `out/model-schema.js:128` — `@attributes_builder ||= begin ... end`
- `out/model-schema.js:140` — `@_returning_columns_for_insert ||= begin ... end`
- `out/core.js:201` — `@generated_association_methods ||= begin ... end`
- `out/core.js:220` — `@inspection_filter ||= begin ... end`

The statement handler already builds the whole try/catch/finally, and #6113 added
`conditionalIife` for exactly this problem on the `if` side — an invoked arrow
wrapping the statement form, with `e.stmts(..., true)` yielding the last value
and an `await`ed async arrow when the body contains `await`. The same wrapper
applies.

**2. `MultiWriteNode` whose value is a `CaseNode`.** `out/relation/query-methods.js:74`
declines `method_name, default = case name when ... end`
(`vendor/rails/activerecord/lib/active_record/relation/query_methods.rb:162-168`).
The destructure itself now emits since #6113; what declines is the `case` in
expression position, which needs the same IIFE treatment as `caseStmt`'s
statement form (`control.ts`).

Both are the same missing capability — "wrap an existing statement handler in an
invoked arrow when the node appears in expression position" — so they are one
story, and a shared helper is likely the right factoring rather than a third
copy of the wrapper.

## Acceptance criteria

- [ ] Expression-position `BeginNode` emits; the five `||= begin` sites above
      lose their `__PRISM_TODO` markers.
- [ ] Expression-position `CaseNode` emits, so the `query_methods.rb:162`
      multi-assign emits end to end.
- [ ] The IIFE wrapper is factored once, not copied per node kind (the `if`
      side's `conditionalIife` folds into it).
- [ ] 0 parse errors invariant holds; golden snapshots regenerated and the JS
      diff reviewed; tests per construct.
- [ ] Any convergence-guard rows the new coverage surfaces are handled per
      [[converge-guard-rows-surfaced-by-blocks-conditionals-coverage]] — verify
      each is pre-existing port debt, hand-add via `serializeBaseline`, never
      `--write`.
