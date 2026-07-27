---
title: "Track: Ruby truthiness and fetch-nil residuals"
status: draft
updated: 2026-07-27
rfc: "0082-ruby-ts-idiom-conversion-classes"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# Track: Ruby truthiness and fetch-nil residuals

## Context

Ruby treats only `nil`/`false` as falsy; JS adds `0`, `""`, `NaN`. The helper
`isRubyTruthy` exists (`packages/activerecord/src/ruby-truthy.ts:15`) and the
adoption audit is done (`rails-ruby-truthiness-audit-and-isrubytruthy-adoption`,
0025). Related sub-idiom: Ruby `Hash#fetch` returns a present-but-nil value
where JS `??` falls through to the default
(`fetch-nil-presence-divergences-globalid-rack`, 0032, done). A port using bare
JS truthiness on `0`/`""` flips behavior Rails users rely on, e.g. empty-string
multiparameter attributes.

Existing scattered stories (reference, do not re-home): open —
`converge-pg-dumper-deferrable-truthiness` (0023, draft),
`multiparameter-empty-string-truthiness` (0023, draft). Done precedent —
`columns-memo-read-idiom-mismatch-truthy-vs-nullcheck` (0056),
`encrypted-attr-default-guard-truthiness-not-undefined` (0023).

## Acceptance criteria

- The residual list from the 0025 audit burned down: each remaining bare-JS
  truthiness site on a ported conditional either converged onto
  `isRubyTruthy`/explicit null-check per the Rails body, or justified at the
  call site.
- The two open draft stories above resolved.
- Decide and document (CONTRIBUTING or conventions doc) that `isRubyTruthy` is
  the reviewed spelling for ported Ruby conditionals; no new lint required if
  infeasible — record the decision either way.
