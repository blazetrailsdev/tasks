---
title: "gate-positive-adapter-drop-rule-differs-between-extractors"
status: draft
updated: 2026-08-31
rfc: "0126-fidelity-tooling-continuation"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in review of PR #7306 (`gate-inverted-feature-guard-not-comparable`),
which made `no_<feature>` a comparable signed feature. That change turned a
previously-silent extractor divergence into a reportable one.

The two extractors resolve the "drop a positive adapter set" rule in DIFFERENT
SPACES, and they disagree for the `skipIf(A || B)` / `skip if A || B` shape.

- Ruby (`scripts/test-compare/extract-ruby-tests.rb:1063-1066`):

  ```ruby
  mixed = !adapters.empty? &&
          (!acc[:guards].empty? ||
           (any_feature && (acc[:or_true] || !positive)) ||
           (acc[:or_true] && !neg_adapters.empty?))
  ```

  The feature term is gated on `acc[:or_true] || !positive` — SOURCE space. On
  the `skip if` path `!positive` is unconditionally true, so any feature term
  drops the adapter set regardless of the operator.

- TS (`scripts/test-compare/gates.ts`, `gateFromGuardExpr`):

  ```ts
  const mixed = adapterIsPositive
    ? guards.length > 0 || (anyFeature && runIsDisjunctive)
    : runIsDisjunctive;
  ```

  `runIsDisjunctive` is RUN space (`runsWhenTrue ? text.includes("||") :
text.includes("&&")`). TS reasons that under `skipIf` the run condition is the
  De Morgan conjunction, so the adapter ∩ feature intersection is exactly what
  runs and BOTH dimensions are sound — deliberately more precise than Ruby,
  documented in that function's docstring and pinned by
  `extract-ts-gates.test.ts` ("keeps a positive adapter set with a feature
  under the standard skip idiom").

The two only coincide when the guard is conjunction-shaped. Verified divergence
(both sides run against the real extractors, PR #7306 branch):

| shape                                                                        | Ruby                           | TS                                                          | classify     |
| ---------------------------------------------------------------------------- | ------------------------------ | ----------------------------------------------------------- | ------------ |
| `skip if !current_adapter?(:Mysql2Adapter) \|\| !supports_expression_index?` | `guards:[no_expression_index]` | `adapters:[mysql] features:[expression_index]`              | `wrong-gate` |
| `skip if current_adapter?(:Mysql2Adapter) \|\| supports_expression_index?`   | `guards:[no_expression_index]` | `adapters:[postgresql,sqlite] guards:[no_expression_index]` | `wrong-gate` |

No call site in the suite has this shape today (`pnpm parity:test --gates` is at
0 gate-mismatch on that PR), so this is a latent trap, not a live red — but the
first test written that way is reported as a `wrong-gate` neither side is
actually wrong about.

**NOT a gap (checked, do not re-derive):** Ruby's third disjunct
`(acc[:or_true] && !neg_adapters.empty?)` has no TS twin because TS cannot
represent the state it guards. Both adapter reads are single-match
(`gates.ts:201` and `:223` use `text.match`, not `matchAll`, and the
`currentAdapter` block is consulted only when no `adapterType` term matched), so
TS never holds a positive adapter set and a separate negated-adapter list at the
same time. TS's own "the first adapter term wins" rule already covers it.

## Acceptance criteria

- Pick ONE space for the positive-adapter drop rule and apply it to BOTH
  extractors — either teach Ruby the run-space reading (the more precise one, so
  `gate_from_run_condition` stops withholding a sound decomposition on the
  `skip if A || B` path), or make TS match Ruby's source-space conservatism.
  Whichever is chosen, both sides change in the same PR; leaving them in
  different spaces is what this story exists to end.
- Unit coverage on BOTH sides for the two shapes in the table above, asserting
  the two extractors now produce the same adapter/signed-feature key.
- `pnpm parity:test --gates` gate-mismatch count does not rise; diff the
  `--gates` output before and after. Any newly-surfaced real divergence is fixed
  in the same PR or registered as its own story.
- If the run-space reading wins, re-check whether `runIsDisjunctive`'s textual
  `includes("||")` / `includes("&&")` is the right predicate for it, or whether
  it needs the sexp-level parity Ruby's `scan_run_condition` has — a textual
  `||` anywhere in the expression is deliberately coarse on both sides today.
