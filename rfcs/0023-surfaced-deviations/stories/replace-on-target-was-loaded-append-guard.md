---
title: "Port replace_on_target's @_was_loaded append guard"
status: draft
updated: 2026-07-27
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `replace_on_target` (`vendor/rails/activerecord/lib/active_record/associations/collection_association.rb:457-490`)
guards its append arm:

```ruby
if index
  target[index] = record
elsif @_was_loaded || !loaded?
  @association_ids = nil
  target << record
end
```

`@_was_loaded` is set to `true` just before the `yield` and cleared in the
method's `ensure`. Neither trails copy ports it:

- `finishReplaceOnTarget` (`packages/activerecord/src/associations/collection-association.ts:1417-1440`)
  appends unconditionally when the index is `-1`.
- `CollectionProxy#_commitToTarget` (`packages/activerecord/src/associations/collection-proxy.ts`)
  does the same.

Both also null `@association_ids` unconditionally (in `beginReplaceOnTarget` /
via `_invalidateAssociationIds`) rather than only on the append arm — a
harmless superset today, but it hides the missing guard.

Surfaced while unifying the collection target with its proxy (#5461), which
made the two copies agree with each other but did not close this gap against
Rails. Noted in that PR body as explicitly unwidened.

## Acceptance criteria

- [ ] `@_was_loaded` is ported (set before the yield, cleared in a `finally`)
      on whichever of the two bodies survives.
- [ ] The append arm runs only when `@_was_loaded || !loaded?`; `@association_ids`
      is nulled on that arm, matching collection_association.rb:485-488.
- [ ] A test pins the case the guard exists for: a loaded collection whose
      `replace_on_target` fires with no `@_was_loaded` must NOT append.
- [ ] No regression in has_many / has_many_through / HABTM suites.
