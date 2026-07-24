---
title: "STI stale-schema invalidation for unregistered subclasses rests on an unenforced read-through-ownSchemaMemo invariant"
status: draft
updated: 2026-07-24
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in review of PR #5199 (removed the STI schema-host redirect;
`refactor(model-schema): remove the STI schema-host redirect`).

Rails invalidates schema state on `reset_column_information` by pushing DOWN
through `DescendantsTracker`, which is populated automatically by Ruby's
`inherited` hook — every subclass is registered the moment it is defined
(`vendor/rails/activerecord/lib/active_record/model_schema.rb:553-568`, and
`descendants` via `ActiveSupport::DescendantsTracker`). JS has no `inherited`
hook, so trails registers subclasses only when `registerSubclass` is explicitly
called (`packages/activerecord/src/inheritance.ts:359`), which happens lazily —
triggered by `attribute()` / `decorate_attributes()` / `_defaultAttributes()` /
association declarations, not by `class X extends Y {}` alone.

To cover STI subclasses that never registered, PR #5199 added a PULL-based
fallback: `schemaStaleAgainstAncestors`
(`packages/activerecord/src/model-schema.ts:60`) walks the prototype chain on
every schema-memo read and returns the memo as `undefined` when an ancestor's
`_schemaRevision` (a global epoch) is newer. `reloadSchemaFromCache`'s recursive
push (`:868`) still only reaches registered subclasses; the pull fallback is
what covers the rest.

**The gap:** correctness now depends on an UNENFORCED invariant — every read of
`_schemaLoaded` / `_columnsHash` / `_columns` / `_attributesBuilder` /
`_virtualAttributesReconciled` must route through `ownSchemaMemo`
(`model-schema.ts:80`) or `isSchemaLoaded`. The PR review verified this holds
today by grepping `packages/activerecord/src/*.ts`, but nothing prevents a
future raw `this._columnsHash` read on a subclass from silently serving a stale
inherited value after an ancestor reset. The
`model-schema-sync-load.test.ts` "resetting the STI base propagates to
subclasses" test having to add an explicit `registerSubclass(Circle)` call is
the visible symptom of the push side only reaching registered subclasses.

## Acceptance criteria

Pick one of:

- **Enforce the invariant**: an eslint rule (or the existing rails-private /
  method-order lint machinery) that flags any raw `this._columnsHash` /
  `this._columns` / `this._schemaLoaded` / `this._attributesBuilder` /
  `this._virtualAttributesReconciled` read in `packages/activerecord/src/` that
  does not go through `ownSchemaMemo` / `isSchemaLoaded`. This makes the
  pull-fallback safe by construction.
- **OR remove the need for the pull fallback**: make STI subclass registration
  eager (e.g. a base-class static-init path or a registration call folded into
  class setup) so `reloadSchemaFromCache`'s recursive push reaches every
  descendant, matching Rails' `inherited`-hook DescendantsTracker. If viable,
  `schemaStaleAgainstAncestors` and its per-read prototype walk (and the
  `_staleCheck` epoch memo) can be deleted.

Investigate which is achievable in the JS object model and record the blocker at
a trails/Rails `file:line` if neither is; this is a standing deviation from
Rails' push-only invalidation, so it converges or documents why it cannot.
