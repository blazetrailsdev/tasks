---
title: "Memoize GlobalID#modelClass / SignedGlobalID#modelClass per Ruby's @model_class ||="
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Not Rails-convergent: a per-instance memo (@model_class ||=) whose only effect is skipping a constantize lookup; the story itself scopes the cost to 'a Map lookup plus two prototype walks'. No observable behavioral divergence."
---

## Context

Rails memoizes `GlobalID#model_class`:

```ruby
def model_class
  @model_class ||= begin
    model = model_name.constantize
    ...
  end
end
```

(`vendor/globalid/lib/global_id/global_id.rb:56-64`)

trails' getter resolves on every access with no memo:

- `packages/globalid/src/global-id.ts:136` — `get modelClass()` calls
  `constantize(this.modelName)` then runs the `isOrExtends` guard each time.
- `packages/globalid/src/signed-global-id.ts:337` — the peer copy, same
  shape.

Pre-existing (the old `lookupClass` path had the same gap); PR #5471 left it
unchanged deliberately, and the reviewer flagged it as unaddressed rather
than introduced. Cost is a Map lookup plus two prototype-chain walks per
access — small, but `Locator.locate` / `locateMany` read `modelClass` per GID,
so it is per-record on batch locates.

## Acceptance criteria

- Both `modelClass` getters memoize on first resolution, matching Ruby's
  `@model_class ||=`.
- The memo is per-instance (GlobalID instances are immutable value objects —
  `modelName` cannot change after construction, so a plain private field is
  enough; no invalidation hook needed).
- Confirm the memo does not cache across a `_resetConstants()` in tests —
  if a suite re-registers a different class under the same name between
  locates, decide and document whether Rails' behavior (memoized, stale) is
  the one to keep. Rails memoizes unconditionally; prefer fidelity.
- Existing globalid tests stay green; no new public surface.
