---
title: "Model-agnostic generated delegator + STI carrier module inheritance"
status: in-progress
updated: 2026-07-09
rfc: "0058-module-generation-mechanism"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: 2
pr: 4815
claim: "2026-07-09T01:22:34Z"
assignee: "delegation-model-agnostic-delegator-sti-carrier-inheritance"
blocked-by: null
closed-reason: null
---

## Context

trails' per-model prototype carriers (`perModelCarrier` in
`packages/activerecord/src/relation/delegation.ts`) include ONLY the model's own
`generatedRelationMethods(modelClass)` module — deliberately NOT Rails'
`include_relation_methods` superclass recursion
(`superclass.include_relation_methods(delegate) unless base_class?`,
`vendor/rails/activerecord/lib/active_record/relation/delegation.rb:57-60`).

Root cause of the divergence: Rails' generated method body is **model-agnostic**
— `def m(...); scoping { model.m(...) }; end` reads `self.model` dynamically
(delegation.rb:76-88) — so an ancestor's generated module is safe to inherit
down an STI chain. trails' `classMethodDelegator` (delegation.ts:465-487)
instead **captures** a specific `modelClass` + bound class method and
scopes/guards that captured model, so a parent model's delegator installed onto
an STI child carrier would dispatch to the parent (wrong scope + wrong STI type
condition). trails works around this correctly by re-deriving a per-subclass
delegator via the Proxy miss path (keyed by the relation's real `_modelClass`),
which yields **behavior identical to Rails** — but costs one extra miss-path
pass per (subclass, method) instead of inheriting the ancestor's compiled
delegator.

Filed at reviewer (Codex) request on PR #4793; the divergence is documented at
the include site in `perModelCarrier`.

## Acceptance criteria

- [ ] Make the generated relation-method delegator model-agnostic (dispatch off
      the relation's live `model`/`_modelClass` at call time rather than a
      captured `modelClass`), matching Rails' `scoping { model.m(...) }`, so a
      single delegator is correct on any model in an STI hierarchy.
- [ ] With model-agnostic delegators, mirror Rails' `include_relation_methods`
      superclass recursion in `perModelCarrier`: an STI child carrier includes
      each ancestor model's generated module (up to `base_class`) plus its own,
      so inherited generated methods resolve without re-entering the miss path.
- [ ] STI correctness preserved: a child relation's delegated class method still
      scopes the child model and applies the child's STI type-condition
      (`DelegationCachingTest` + STI delegation coverage hold).
- [ ] No observable behavior change; the only delta is fewer miss-path passes
      for STI subclasses. `api:compare` / `test:compare` deltas non-negative.
