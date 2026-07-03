---
title: "Guard: schema-file-generator index length/expression gating must match define-schema.ts"
status: claimed
updated: 2026-07-03
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: "2026-07-03T11:33:51Z"
assignee: "generator-define-schema-index-gating-parity-guard"
blocked-by: null
closed-reason: null
---

## Context

Follow-up to generator-define-schema-typemap-parity-guard (PR #4464), which guarded the per-adapter _type map_ between `schema-file-generator.ts` and `define-schema.ts` but explicitly scoped out the other parallel re-implementations flagged in that story's context.

The generator still hand-mirrors define-schema.ts's index option gating with no guard:

- Expression-index gating: `schema-file-generator.ts:178-187` uses a coarse `adapterName === "mysql"` skip, whereas define-schema.ts uses the precise runtime `supportsExpressionIndex(adapter)` check (define-schema.ts:214+). These can diverge on MySQL 8.0.13+.
- Sub-part prefix `length:` is MySQL-only DDL, dropped for non-MySQL in both files (`schema-file-generator.ts:196-197`) — another hand-copied rule.

A one-sided edit reintroduces the same silent-drift class PR #4461 fixed for types.

## Acceptance criteria

- Add a guard (unit test) asserting the generator's emitted index options (unique/where/name/order/length/nullsNotDistinct/using/type and the length/expression adapter gating) agree with define-schema.ts's index emission for a representative schema on each adapter.
- Note the expression-index gating coarseness (generator has no DB version; define-schema uses runtime supportsExpressionIndex) as a tracked residual if not cheaply testable without a live adapter.
- Reference PR #4464 and #4461 in the guard comment.
