---
title: "Converge schema invalidation onto Rails' push-only DescendantsTracker model (eager subclass registration, delete the per-read pull fallback)"
status: blocked
updated: 2026-08-18
rfc: "0078-sti-schema-reflection-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 260
priority: null
pr: null
claim: "2026-08-18T18:14:58Z"
assignee: "port-test-date-strftime-different-format"
blocked-by: "The eager-registration hook the story asks for does not exist in the JS object model, so the pull apparatus cannot be deleted. `class X extends Y {}` performs exactly two observable operations: it reads `Y.prototype` (ClassDefinitionEvaluation step 6) and it sets X's [[Prototype]] to Y. Neither is a hook on Y that receives X: [[SetPrototypeOf]] fires on X, which does not exist yet as a value the base can see, and a `get` trap for `prototype` on a proxied Base fires BEFORE the class object is created, so it has no X to pass to registerSubclass (packages/activerecord/src/inheritance.ts:398). The only receiver-bearing hook is a `get` trap firing on the first inherited STATIC read (receiver === X) — which is still a pull, fires later than Ruby's `inherited`, and would mean proxying Base, an invention with no Rails counterpart and a cost on every static access. The remaining candidates are the ones #6705 already rejected: a decorator or an explicit registerSubclass call, both of which the acceptance criteria forbid. So schemaStaleAgainstAncestors / _staleCheck / _schemaRevision (model-schema.ts:47-102) cannot be deleted without leaving reloadSchemaFromCache's recursive push (model-schema.ts:920-922) partial, and blazetrails/schema-memo-read-through-guard stays load-bearing. Needs an RFC 0078 owner decision on which second-best shape to take (proxied-Base get trap, a codegen/lint-enforced registration call at every `extends`, or ratifying the pull fallback as a TS language shortcoming)."
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

## Superseded in part by PR #6809 (2026-08-21)

The blocker below concluded the pull apparatus "cannot be deleted" without an
eager-registration hook. That is now falsified: #6809 deleted
`schemaStaleAgainstAncestors`, `_staleCheck`, the `_schemaRevision` epoch, `ownProp`
and the eslint rule, via a route the analysis did not consider — trails has a
**second** subclass registry, the `ActiveSupport::DescendantsTracker` that
`_defaultAttributes` registers into (`packages/activemodel/src/attribute-registration.ts`),
which covers classes `Inheritance`'s `_subclasses` misses. `Inheritance#subclasses`
(`packages/activerecord/src/inheritance.ts:90`) now reads both, so
`reloadSchemaFromCache`'s recursive push reaches them and the per-read prototype
walk is gone from the `new Model()` hot path.

What remains is the deviation #6809 shipped in its place, and it is what this
story should now converge:

**Rails has exactly ONE registry.** Ruby's `Class#subclasses` is VM-maintained,
so `DescendantsTracker.subclasses(klass)` is a plain delegation to it
(`vendor/rails/activesupport/lib/active_support/descendants_tracker.rb:97-100`),
and `inherited` fills it the moment `class X < Y` is evaluated. trails fills two
by hand and unions them at read time. The union is a bridge, not a mirror: it is
still lazy (both registries are filled by later calls, not by `extends`), so a
subclass that never triggers either one is still invisible to the push.

The converged shape is unchanged — one registry, eagerly filled — and the
eager-registration hook is still the open problem. The blocker analysis below
remains accurate about `class X extends Y {}` offering no receiver-bearing hook;
it is only its conclusion about the pull apparatus that #6809 overtook.

## Acceptance criteria

- [ ] STI subclass registration is eager, so `reloadSchemaFromCache`'s recursive
      push reaches every descendant without an explicit `registerSubclass` call.
- [x] `schemaStaleAgainstAncestors`, `_staleCheck` and the `_schemaRevision`
      epoch are deleted; per-read prototype walking is gone from the
      `new Model()` hot path. (#6809)
- [x] `blazetrails/schema-memo-read-through-guard` and its test are deleted, and
      the `eslint.config.mjs` block with them. (#6809)
- [ ] `model-schema-sync-load.test.ts`'s "resetting the STI base propagates to
      subclasses" no longer needs its explicit `registerSubclass(Circle)` call —
      that call is the visible symptom of the push side being partial.
      (Unverified after #6809: the two-registry union may already have made it
      redundant. Check before assuming work is needed.)
- [ ] `Inheritance#subclasses` reads ONE registry, not a union of two
      (`inheritance.ts:90`), and `descendants` recurses through it.
- [ ] parity:api and parity:test deltas non-negative.
