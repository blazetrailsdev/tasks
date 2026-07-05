---
title: "credit-value-accessor-reads-in-wide-call-gate"
status: ready
updated: 2026-07-05
rfc: "0022-relation-arel-ast-convergence"
cluster: null
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

RFC 0022 sibling of `unify-join-values-storage-faithful-accessor` (PR #4645).
That PR unified `.joins` storage into a single insertion-ordered `_joinsValues`
store and converted the join builders (`build_join_buckets`,
`build_join_dependencies`, `build_joins`, `merge_joins`) to read the unified
`this.joinsValues` accessor. It could NOT remove the 10 `joins_values` entries
from `scripts/api-compare/call-mismatches-wide-exclude.json` (build_joins,
build_join_dependencies, build_join_buckets, apply_join_dependency, merge_joins,
associated) because the wide-call extractor cannot credit the reads.

Root cause: `extractCalls` in `scripts/api-compare/extract-ts-api.ts` (visit fn
~line 1698) records only `ts.isCallExpression` callees. A Rails value-method
read like `joins_values` is a method call in Ruby, but its faithful TS mirror is
a get-accessor READ (`this.joinsValues`) — a `PropertyAccessExpression`, never a
CallExpression — so it is never credited. Only ONE method in the whole repo
credits a value accessor (`countRecords` → `host.limitValue()`, via a host
METHOD). ~38 value-accessor call entries are permanently baselined for this same
reason.

Measured impact of crediting property-access reads in `extractCalls`
(add a branch for `ts.isPropertyAccessExpression(n) && !isCallCallee(n)` →
`names.add(n.name.text)`): the wide ratchet shifts by **+234 new / −868
converged** entries. The +234 arise because methods with previously-empty call
sets (`if (!tsCandidateSets || tsCandidateSets.length === 0) return;` in
compare.ts ~line 1384) become subject to the gate once their reads count. This
is a cross-package tooling change, not a joins change.

## Acceptance criteria

- Enhance `extractCalls` (or the wide-call comparison) so a ported body that
  READS an accessor-backed value method is credited with that call, matching
  Ruby's reader-call semantics. Decide and document how to handle the ~234
  newly-surfaced mismatches (baseline with reasons vs. implement) — do not
  blindly `--write` a reasonless baseline.
- Reseed `call-mismatches-wide-exclude.json` so all now-converged entries are
  removed, INCLUDING the 10 `joins_values` entries.
- `pnpm api:calls:wide` passes; `pnpm api:compare` unaffected on parity %.
- `scripts/api-compare/extract-ts-api.test.ts` covers the read-crediting rule
  (and that a call's callee is not double-recorded).
