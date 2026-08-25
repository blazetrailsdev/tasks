---
title: "call-args-ar-current-scope-as-method"
status: done
updated: 2026-08-11
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6377
claim: "2026-08-11T20:50:30Z"
assignee: "arel-append-escape-inline-convergence"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the RFC 0099 `call-args-ar-literal-values` PR.
`activerecord/lib/active_record/scoping.rb:26` declares
`current_scope(skip_inherited_scope = false)` — a METHOD with a parameter —
and `relation.rb:1346` calls it as `model.current_scope(true)`.

`packages/activerecord/src/base.ts:2267` ports it as a GETTER
(`static get currentScope()`), which cannot take the argument. So
`relation.ts#currentScopeRestoringBlock` reaches
`ScopeRegistry.currentScope(modelClass, true)` directly, inlining the hop
`scoping.rb:27` makes and putting the model in argument 1. (That PR did fix
the behavioural half: `true` is now passed, where the port previously
defaulted to `false` and read the INHERITED scope.) Baselined at
`scripts/api-compare/call-mismatches-exclude/activerecord/relation.json`
(`current_scope_restoring_block` / `current_scope` / `["bool:true"]`).

`global_current_scope` (`scoping.rb:34`) has the same shape — check it while
you are here.

## Acceptance criteria

1. `Base.currentScope` is a method taking `skipInheritedScope = false`,
   matching `scoping.rb:26`, with every call site updated.
2. `relation.ts#currentScopeRestoringBlock` calls
   `modelClass.currentScope(true)`, matching `relation.rb:1346`.
3. The baseline row above goes stale and is deleted by hand (only-shrink).
4. `pnpm parity:api` / `pnpm parity:api:extra` non-negative;
   `pnpm parity:api:calls:args` green.
