---
title: "api-compare: include()/extend()-mixed methods get empty-body host-file candidates, flag phantom missing calls"
status: done
updated: 2026-07-06
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: 4678
claim: "2026-07-06T14:52:59Z"
assignee: "api-compare-carry-mixin-host-attribution-call-set"
blocked-by: null
closed-reason: null
---

## Context

PR #4656 left four residual `joins_values` (and matching
`left_outer_joins_values`) wide-call entries keyed to `relation.ts`
(`build_joins`, `build_join_buckets`, `build_join_dependencies`,
`apply_join_dependency`) that the read-crediting change could NOT clear even
though the real ports in `relation/query-methods.ts` converged.

Root cause: these Ruby methods are mixed onto `Relation` via `include`/`extend`
(the trails `include()` convention). The api-compare extractor
(`scripts/api-compare/extract-ts-api.ts` `extractFromProgram` include() handling)
attributes the mixed-in method NAME to the host file (`relation.ts`) but carries
NO call-set/body for it — so the host candidate looks like an empty-bodied method
and flags every Ruby call as missing. This double-attribution is pure tooling
noise: the same method already has a real, converged candidate in query-methods.ts.

## Acceptance criteria

- When the extractor attributes an `include()`/`extend()`-mixed method to a host
  file, carry the source module's call-set (or suppress the empty host-file
  duplicate candidate) so compare doesn't emit phantom missing-call mismatches.
- The four `relation.ts` join-builder wide-call entries (and their
  `left_outer_joins_values` siblings) drop from the baseline once the real
  query-methods.ts candidate is the one compared.
- `pnpm api:calls:wide` and `pnpm api:calls` stay green; no regressions in the
  extractor unit tests.
