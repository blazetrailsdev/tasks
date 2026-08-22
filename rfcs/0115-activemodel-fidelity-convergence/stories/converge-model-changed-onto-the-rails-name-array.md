---
title: "Model#changed returns a boolean where Rails returns the changed-attribute-name array"
status: done
updated: 2026-08-22
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: 6859
claim: "2026-08-22T14:49:29Z"
assignee: "retire-postgresql-with-binds-onto-postgresql-bind-block"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activemodel/lib/active_model/dirty.rb` defines two separate
readers:

- `changed?` (`:286-288`) — `mutations_from_database.any_changes?`, a boolean.
- `changed` (`:295-297`) — `mutations_from_database.changed_attribute_names`,
  **an array of the names of attributes with unsaved changes**. The rdoc is
  explicit: `person.changed # => ["name"]`.

trails collapses both onto one boolean getter:

```ts
// packages/activemodel/src/model.ts:1748-1750
get changed(): boolean {
  return this._dirty.changed;
}
```

So `changed` returns the wrong type under the Rails name, and `changed?`'s TS
spelling (`isChanged`) does not exist on `Model` at all. The array reader Rails
callers reach for has no spelling either — `DirtyTracker.changedAttributeNames`
(`packages/activemodel/src/dirty.ts:209-217`) computes exactly
`changed_attribute_names` but is only reachable through the private `_dirty`.

This also has a live blast radius: `restore_attributes(attr_names = changed)`
(`dirty.rb:320`) defaults its parameter to the **name array**. A port that
defaults it to a boolean silently restores the wrong set.

Surfaced while landing `move-ar-save-side-dirty-surface-out-of-model` (#6858):
the activemodel tests that had been reaching for the ActiveRecord-only
`changedAttributeNamesToSave` had to be routed through
`Object.keys(x.changedAttributes)` rather than the Rails-correct `x.changed`,
precisely because no `changed` name-array reader exists.

## Converged shape

```ts
/** Mirrors: ActiveModel::Dirty#changed? (dirty.rb:286-288). */
get isChanged(): boolean {
  return this._dirty.changed;
}

/** Mirrors: ActiveModel::Dirty#changed (dirty.rb:295-297). */
get changed(): string[] {
  return this._dirty.changedAttributeNames;
}
```

Both are zero-arg Ruby readers, so both stay accessor properties (CLAUDE.md,
"Generated attribute readers are properties").

## Acceptance criteria

- `Model.changed` returns `string[]`, matching `dirty.rb:295-297`.
- `Model.isChanged` exists and returns the boolean, matching `dirty.rb:286-288`.
- Every `x.changed` call site is audited and moved to `x.isChanged` where it
  wanted the boolean — `grep -rn "\.changed\b"` across `packages/`. The
  boolean-truthiness sites are the risk: `string[]` is always truthy, so a
  missed site silently inverts to always-true.
- `restoreAttributes` defaults its `attrNames` parameter to `changed`
  (`dirty.rb:320`), i.e. to the name array.
- The activemodel dirty tests that #6858 routed through
  `Object.keys(x.changedAttributes)` use `x.changed` instead.
- `pnpm parity:api` / `pnpm parity:test` deltas non-negative; call gates clean.
