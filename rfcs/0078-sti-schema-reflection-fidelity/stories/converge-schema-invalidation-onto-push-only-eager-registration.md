---
title: "Converge schema invalidation onto Rails' push-only DescendantsTracker model (eager subclass registration, delete the per-read pull fallback)"
status: ready
updated: 2026-08-18
rfc: "0078-sti-schema-reflection-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 260
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Residual left by [[sti-schema-stale-invariant-unenforced]] (PR #6705), which
took that story's **"Enforce the invariant"** branch: a new eslint rule,
`blazetrails/schema-memo-read-through-guard` (`eslint/`), now flags any raw read
of `_schemaLoaded` / `_columnsHash` / `_columns` / `_attributesBuilder` /
`_virtualAttributesReconciled` in `packages/activerecord/src/*.ts` that does not
route through `ownSchemaMemo` / `isSchemaLoaded`. That makes the pull fallback
**safe**, but it does not make it **Rails**.

Rails invalidates schema state by pushing DOWN through `DescendantsTracker`,
which Ruby's `inherited` hook populates the moment a subclass is defined
(`vendor/rails/activerecord/lib/active_record/model_schema.rb:553-568`;
`descendants` via `ActiveSupport::DescendantsTracker`). There is no per-read
staleness check anywhere in Rails — invalidation is push-only.

trails carries an extra apparatus Rails has no counterpart for:

- `schemaStaleAgainstAncestors` (`packages/activerecord/src/model-schema.ts:74`)
  — a prototype-chain walk run on EVERY schema-memo read, including the
  `new Model()` hot path.
- its `_staleCheck` epoch memo, and the global `_schemaRevision` epoch it
  compares against.
- `ownSchemaMemo` (`model-schema.ts:99`) exists only to apply that walk.

It is there because `registerSubclass` (`packages/activerecord/src/inheritance.ts`)
is LAZY — triggered by `attribute()` / `decorate_attributes()` /
`_defaultAttributes()` / association declarations, not by `class X extends Y {}`
— so `reloadSchemaFromCache`'s recursive push (`model-schema.ts:920-922`)
reaches only subclasses that happened to register.

## Converged shape

Make STI subclass registration EAGER so the recursive push reaches every
descendant, as Rails' `inherited` hook does, and then delete the pull apparatus
outright: `schemaStaleAgainstAncestors`, `_staleCheck`, the `_schemaRevision`
epoch, and `ownSchemaMemo`'s staleness arm (the own-property check stays — Ruby
class ivars are not inherited and JS statics are).

The eslint rule added by #6705 becomes unnecessary at that point and should be
deleted with it; it is scaffolding for an invariant that would no longer exist.

The open question is the eager-registration hook. JS has no `inherited`, and
PR #6705 did not find a mechanism that runs per `class X extends Y {}` without a
decorator or an explicit call — that is the thing to solve here. If it genuinely
cannot be solved in the JS object model, `pnpm tasks block` this with the
specific blocker at a trails `file:line`; do NOT close it by re-justifying the
pull fallback.

## Acceptance criteria

- [ ] STI subclass registration is eager, so `reloadSchemaFromCache`'s recursive
      push reaches every descendant without an explicit `registerSubclass` call.
- [ ] `schemaStaleAgainstAncestors`, `_staleCheck` and the `_schemaRevision`
      epoch are deleted; per-read prototype walking is gone from the
      `new Model()` hot path.
- [ ] `blazetrails/schema-memo-read-through-guard` and its test are deleted, and
      the `eslint.config.mjs` block with them.
- [ ] `model-schema-sync-load.test.ts`'s "resetting the STI base propagates to
      subclasses" no longer needs its explicit `registerSubclass(Circle)` call —
      that call is the visible symptom of the push side being partial.
- [ ] parity:api and parity:test deltas non-negative.
