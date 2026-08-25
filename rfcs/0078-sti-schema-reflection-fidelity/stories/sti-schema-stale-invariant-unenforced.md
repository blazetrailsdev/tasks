---
title: "STI stale-schema invalidation for unregistered subclasses rests on an unenforced read-through-ownSchemaMemo invariant"
status: done
updated: 2026-08-18
rfc: "0078-sti-schema-reflection-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6705
claim: "2026-08-18T15:10:51Z"
assignee: "port-test-date-parse-formats-iso8601-tests"
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
called (`packages/activerecord/src/inheritance.ts`, `registerSubclass`), which happens lazily —
triggered by `attribute()` / `decorate_attributes()` / `_defaultAttributes()` /
association declarations, not by `class X extends Y {}` alone.

To cover STI subclasses that never registered, PR #5199 added a PULL-based
fallback: `schemaStaleAgainstAncestors`
(`packages/activerecord/src/model-schema.ts:74`) walks the prototype chain on
every schema-memo read and returns the memo as `undefined` when an ancestor's
`_schemaRevision` (a global epoch) is newer. `reloadSchemaFromCache`'s recursive
push (`:920-922`) still only reaches registered subclasses; the pull fallback is
what covers the rest.

**The gap:** correctness now depends on an UNENFORCED invariant — every read of
`_schemaLoaded` / `_columnsHash` / `_columns` / `_attributesBuilder` /
`_virtualAttributesReconciled` must route through `ownSchemaMemo`
(`model-schema.ts:99`) or `isSchemaLoaded`. The PR review verified this holds
today by grepping `packages/activerecord/src/*.ts`, but nothing prevents a
future raw `this._columnsHash` read on a subclass from silently serving a stale
inherited value after an ancestor reset. The
`model-schema-sync-load.test.ts` "resetting the STI base propagates to
subclasses" test having to add an explicit `registerSubclass(Circle)` call is
the visible symptom of the push side only reaching registered subclasses.

Re-verified against `origin/main` 2026-08-09: all of the above still holds, and
this story now also owns the `_schemaRevision` epoch residual left behind by the
closed [[reload-schema-from-cache-sti-apparatus-absent-in-rails]] and
[[reset-column-information-recurse-descendants]].

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
