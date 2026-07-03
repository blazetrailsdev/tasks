---
title: "Extractor: detect include(Host, Mod) calls outside top-level scope so deferred-mixin hosts keep attribution"
status: done
updated: 2026-07-03
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 4484
claim: "2026-07-03T14:33:52Z"
assignee: "extractor-detect-non-top-level-includes"
blocked-by: null
closed-reason: null
---

## Context

api-compare's TS extractor folds mixed-in methods into a host class **only**
when it finds a top-level `include(Host, Mod)` expression statement:
`scripts/api-compare/extract-ts-api.ts:706-738` iterates `ts.forEachChild(sourceFile, ...)`
and matches `ts.isExpressionStatement(n)` at source-file scope.

PR #4458 (fix-define-schema-import-tdz) had to move
`connection-adapters/abstract-adapter.ts`'s `include(AbstractAdapter, SchemaStatements)`
(and its DatabaseStatements/QueryCache/Quoting/Savepoints/DatabaseLimits siblings)
out of top-level statements into a guarded `ensureAbstractAdapterMixinsApplied()`
function to break a module-evaluation TDZ crash. Because those `include(...)`
calls are no longer top-level, the extractor stopped attributing exec_delete /
exec_insert / exec_query / exec_update / select_all / select_value /
cacheable_query to abstract-adapter.ts, and 16 wide call-mismatch baseline
entries went stale (had to be hand-removed from
`scripts/api-compare/call-mismatches-wide-exclude.json`).

This is a latent tooling gap: any host that applies its Rails `include`s from a
helper/apply function (a legitimate pattern for breaking init cycles) loses
mixin-method attribution in api:compare.

## Acceptance criteria

- [ ] Extractor detects `include(Host, Mod)` calls that are not direct
      top-level expression statements (e.g. inside a module-level function such
      as `ensureAbstractAdapterMixinsApplied`), so the host regains the folded
      mixin surface.
- [ ] AbstractAdapter re-acquires attribution of the DatabaseStatements /
      QueryCache / SchemaStatements methods it includes, restoring the 16
      wide-call pairs (net-neutral: they'd re-flag and can be re-baselined, or
      converge).
- [ ] No regression in existing extractor include-detection tests
      (`extract-ts-api.test.ts`).
