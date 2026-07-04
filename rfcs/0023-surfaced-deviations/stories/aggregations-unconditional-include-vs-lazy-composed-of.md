---
title: "Aggregations is unconditionally included on Base; Rails includes it lazily via composed_of"
status: claimed
updated: 2026-07-04
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: "2026-07-04T00:07:08Z"
assignee: "aggregations-unconditional-include-vs-lazy-composed-of"
blocked-by: null
closed-reason: null
---

## Context

trails' `base.ts` (~line 4763) unconditionally runs
`include(Base, _Aggregations.InstanceMethods)`, mixing Aggregations onto every
model. In real Rails, `ActiveRecord::Aggregations` is NOT unconditionally
included in `base.rb` — it is pulled in lazily only when a model declares
`composed_of` (see vendor/rails/activerecord/lib/active_record/aggregations.rb
around lines 228-229). Surfaced during PR #4519 (include-last-mixin-wins).

The reload override is behaviorally fine (trails' `_Aggregations.reload`,
aggregations.ts:226, explicitly calls persistenceReload to emulate Ruby's
`super`, and last-included-wins now selects it correctly). The deviation is
the _unconditional_ inclusion of the whole Aggregations module, not the reload
semantics.

## Acceptance criteria

- [ ] Decide whether trails should gate Aggregations inclusion on a
      `composed_of` declaration (matching Rails) or document why unconditional
      inclusion is acceptable in trails' architecture.
- [ ] If converging: models without `composed_of` should not carry
      Aggregations instance methods; `reload`/`initializeDup` composition must
      still behave correctly for models that DO declare `composed_of`.
- [ ] No regression to touch/reload/initializeDup paths.
