---
title: "Gate extractors ignore supports_X? polarity, inverting a conjoined feature claim"
status: done
updated: 2026-07-30
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: 5683
claim: "2026-07-30T21:33:20Z"
assignee: "gate-extractors-ignore-feature-predicate-polarity"
blocked-by: null
closed-reason: null
---

## Context

`scan_run_condition` (`scripts/test-compare/extract-ruby-tests.rb:663-690`)
records `supports_X?` predicates **polarity-blind** — it appends to
`acc[:features]` regardless of the `negated` parity it is already tracking for
`current_adapter?`. That was harmless while a positive adapter set was dropped
next to any feature, because the emitted gate was feature-only and the
comparison treats a feature key as "this capability is involved".

PR 5602 made the positive adapter set survive a pure conjunction, so the two
dimensions are now emitted together and a NEGATED feature inverts the claim.
`if current_adapter?(:PostgreSQLAdapter) && !supports_insert_returning?` extracts
`adapters=[postgresql] features=[insert_returning]` — "runs on PostgreSQL where
insert_returning IS supported" — the exact opposite of the truth.

`gates.ts:184-188` is polarity-blind in the same deliberate way
(`gateFromGuardExpr`'s `featureMatches`), so the TS side inverts identically.

No Rails test hits this today. The only `current_adapter?(…) && <negated
feature>` site in the vendored suite is
`vendor/rails/activerecord/test/cases/migration/foreign_key_test.rb:96`, and its
predicate rides `@connection.send(:supports_rename_index?)`, which
`call_ident_name` cannot see — so it is invisible rather than inverted (that path
is [[ts-gate-exclusion-ignores-run-disjunction]]). This is therefore a latent
trap: the next Rails test written in that shape mis-gates silently, and the
mis-gate points the wrong way, which is worse than dropping the adapter set.

## Acceptance criteria

- Decide the rule for a negated feature predicate in an otherwise pure
  conjunction and apply it to BOTH extractors so they stay in lockstep: either
  track feature polarity (emitting Rails' own `no_<feature>` guard vocabulary,
  which `gate_from_run_condition` already produces on the `unless` path) or drop
  the adapter set when a negated feature is present.
- `pnpm parity:test --gates` gate-mismatch count does not rise; diff the
  `--gates` output before and after.
- Unit coverage for `if current_adapter?(:X) && !supports_y?` in
  `scripts/test-compare/extract-ruby-gates.test.ts` and the TS twin in
  `extract-ts-gates.test.ts`. Both files currently pin the polarity-blind
  behavior ("extracts adapterSupports() feature predicates polarity-blind"), so
  update those pins deliberately rather than leaving two contradictory
  expectations.
- Keep the polarity-blind behavior where it is still correct: a feature under
  `||`, and the `unless` path, both already have their own handling.
