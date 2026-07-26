---
title: "converge-relation-primary-key-delegate-reads"
status: ready
updated: 2026-07-26
rfc: "0072-api-compare-parity-burndown"
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

Sibling of `converge-relation-subfile-model-accessor-reads` (#5325). That PR
left `primaryKey` reads alone on the grounds that rewriting them to
`this.model.primaryKey` would ADD a `model` call Rails does not make. That
reasoning is correct but incomplete: Rails calls the bare DELEGATE
`primary_key`, and trails has that delegate too —

    # vendor/rails/activerecord/lib/active_record/relation/delegation.rb:106
    delegate :primary_key, :with_connection, :connection, :table_name,
             :transaction, :sanitize_sql_like, :unscoped, :name, to: :model

    // packages/activerecord/src/relation.ts:7726
    get primaryKey(): string | string[];
    get tableName(): string;

So the faithful target is `this.primaryKey` / `this.tableName` (the delegate),
not `this.model.primaryKey`. The subfiles instead read
`this._modelClass.primaryKey` directly, bypassing the delegate, so the ported
bodies omit the call Rails makes. Same class of infidelity as #5325, different
accessor; value-identical at runtime, so the win is call-graph fidelity.

9 wide-ratchet `primary_key` entries: `relation.ts` (5),
`relation/calculations.ts` (2), `relation/batches.ts` (1),
`relation/predicate-builder.ts` (1) — Rails names `calculate`,
`perform_calculation`, `execute_grouped_calculation`, `update_all`,
`expand_from_hash`, `find_by_token_for`, `ensure_valid_options_for_batching!`.
There are also `table_name` and `unscoped` reads in the same delegate family
worth sweeping in the same pass.

Check each read against its Rails counterpart body before rewriting: some
`_modelClass.primaryKey` reads sit in trails-invented helpers with no Rails
counterpart, and some correspond to a Rails body that really does say
`model.primary_key`. A blanket sed would be wrong.

## Acceptance criteria

- Each `_modelClass.primaryKey` / `.tableName` / `.unscoped` read in
  `packages/activerecord/src/relation/` and `relation.ts` is checked against
  its Rails counterpart; those whose Rails body calls the bare delegate are
  routed through `this.primaryKey` / `this.tableName` / `this.unscoped()`.
  The rest are left alone and noted in the PR body.
- Reseed with `pnpm api:calls:wide:reseed`; `pnpm api:calls:wide` stays green
  and the baseline does not grow.
- Behavior-preserving: no test changes expected beyond stub shapes.
- 500 LOC ceiling; split by file if needed.

Hard rules: no `node:*` imports; no `process.*`; async fs only; no new
third-party runtime deps; no stacked PRs; test names match Rails verbatim.
