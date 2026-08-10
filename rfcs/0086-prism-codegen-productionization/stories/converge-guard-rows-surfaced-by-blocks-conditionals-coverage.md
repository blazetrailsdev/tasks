---
title: "converge-guard-rows-surfaced-by-blocks-conditionals-coverage"
status: closed
updated: 2026-08-05
rfc: "0086-prism-codegen-productionization"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Superseded by the 2026-08-05 prism-codegen coverage audit: the generator is being retired (0084-wide-call-set-burndown/retire-prism-codegen-tooling), so improving its output is work on a deleted directory. Evidence: 0 shipped lines from codegen:apply, 963 tsc errors across all 10 emitted files, 81.8% whole-corpus node coverage that does not translate to usability."
---

## Context

PR #6113 (`blocks-conditionals-rescue-images`) taught the prism-codegen handlers
four more constructs (LambdaNode, expression-position multi-statement
if/unless, chained rescue, trailing-splat MultiWriteNode). Seven defs that
previously emitted `__PRISM_TODO(...)` — and were therefore not "clean", and so
invisible to the convergence guard — now generate a full body and get compared
against the port. All seven diverge, and all seven divergences predate #6113:
the coverage increase only made them visible.

They were added to `scripts/prism-codegen/convergence-baseline.json` in #6113
to keep the guard green, with no per-row sign-off. This story burns them down.

The rows, with the guard's `--verbose` skeletons as of #6113:

- `active_record/inheritance.rb :: setBaseClass`
  gen: `ref:base_class if if throw new:ActiveRecordError ref:name if ref:superclass if ref:abstractClass ref:superclass ref:baseClass ref:superclass`
  port: `if ref:call ref:hasOwnProperty ref:prototype ref:computedBaseClass ref:getPrototypeOf if if ref:prototype if ref:name ref:computedBaseClass ...`
- `active_record/model_schema.rb :: resetTableName`
  gen: `ref:tableName if if ref:abstractClass ref:tableName ref:superclass if ref:abstractClass ref:superclass ref:tableName ref:superclass if ref:computeTableName ref:computeTableName`
  port: `ref:tableName if ref:name if ref:abstractClass ref:getPrototypeOf if ref:tableName ref:tableName ref:tableName ref:tableName ref:resolveTableName ref:tableName`
- `active_record/persistence.rb :: queryConstraintsList`
- `active_record/relation.rb :: currentScopeRestoringBlock`
  gen: `ref:currentScope ref:model ref:currentScope ref:model if ref:block`
  port: `ref:model ref:currentScope ref:setCurrentScope if ref:block`
  — likely the settled `setX()` idiom for a Ruby `x=` that must be async, i.e.
  a sign-off candidate rather than a convergence, but confirm against
  `relation.rb`'s `_scoping` / `current_scope=` before deciding.
- `active_record/relation.rb :: execQueries`
  gen: `ref:skipQueryCacheIfNecessary if ref:scheduled ref:future_result ref:future_result ref:result ref:execMainQuery ref:instantiateRecords if ref:skipPreloadingValue ref:preloadAssociations if ref:readonlyValue ref:each ref:readonlyBang if ref:strictLoadingValue loop ref:strictLoadingBang ref:strictLoadingValue`
  port: `ref:execMainQuery ref:instantiateRecords`
  — the port's `exec_queries` drops Rails' whole tail (skip_query_cache
  wrapper, scheduled/future_result arm, preload, readonly!, strict_loading!).
  Check whether those live in a different method in the port before treating
  the whole tail as missing.
- `active_record/relation/calculations.rb :: typeCastPluckValues`
- `active_record/relation/query_methods.rb :: buildWhereClause`

## Acceptance criteria

- [ ] Each of the seven rows is either converged (port body matches the Rails
      body skeleton) or carries a reviewed per-row reason in
      `convergence-signoff.json` naming the language shortcoming — no row is
      left as bare baseline residue.
- [ ] Every row that converges is deleted from
      `convergence-baseline.json` by hand (the baseline is only-shrink; do not
      `--write`/reseed).
- [ ] `pnpm codegen:score --guard` green; `pnpm parity:api:calls` / `parity:api:calls`
      non-negative.
- [ ] Any row that genuinely cannot converge is blocked with the specific
      blocker, not re-justified in place.
