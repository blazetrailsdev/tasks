---
title: "converge-relation-cross-helper-model-reads"
status: ready
updated: 2026-07-26
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 90
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Lowest-value residue from `converge-relation-subfile-model-accessor-reads`
(#5325). A handful of wide-ratchet `model` entries survive that PR not because
the read bypasses the accessor, but because trails split the Rails body across
helpers: the mapped TS function delegates, and the actual `model` read happens
in a trails-invented helper in another function or file. The gate scores the
mapped body, so it still reports the call as missing.

Survivors after #5325 and after #5346 (which made delegating wrappers
transparent to the gate, dissolving several of these already):

- `relation/calculations.ts` — `execute_simple_calculation`,
  `type_cast_pluck_values`, `type_for` (reads live in `singleAggregate`,
  `pluckCastTypeForKnownColumn`, `resolveColType`),
  `execute_grouped_calculation` (`klass` arm is `association.klass.base_class`,
  which lives in the grouped-assoc helper)
- `relation/query-methods.ts` — `build_select`, `preprocess_order_args`,
  `build_join_buckets` (reads live in `selectListColumns` and
  `resolveOrderMatcher`; `build_join_buckets` additionally lacks Rails'
  `joins.last.base_klass == model` stashed-eager-load branch entirely)
- `relation/merger.ts` — `merge_joins`, `merge_outer_joins`, `merge_preloads`
  (thin wrappers over the folders in `merge-joins.ts` / `merge-preloads.ts`,
  which #5325 DID route through `.model`; the fold lives in a sibling file so
  the merger.ts body still scores as missing the call)

Convergence here means moving the read back into the body Rails puts it in, or
letting the gate follow the delegation. Note `build_join_buckets` is the odd
one out: it has a genuine missing branch, not just a relocated read.

This is deliberately filed at low priority. If the api-compare gate grows
deeper delegation-following (the #5346 direction), several of these dissolve
for free and this story should be closed as superseded rather than worked.

## Acceptance criteria

- For each survivor, decide and record one of: (a) relocate the read into the
  mapped body so it matches Rails' structure, (b) port the genuinely missing
  branch (`build_join_buckets`), or (c) justify keeping the split and convert
  the wide-gate entry to a per-entry verified exclusion with a reason naming
  the Rails `file:line`.
- No blanket restructuring: helpers that exist for a real reason (shared by
  several callers, or isolating async) stay, with the exclusion reasoned.
- Reseed with `pnpm api:calls:wide:reseed`; `pnpm api:calls:wide` stays green
  and the baseline does not grow.
- 500 LOC ceiling; split by file if needed.

Hard rules: no `node:*` imports; no `process.*`; async fs only; no new
third-party runtime deps; no stacked PRs; test names match Rails verbatim.
