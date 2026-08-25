---
title: "replace's persisted-owner arm applies the diff twice, once in-memory and once in persistReplacePlan"
status: draft
updated: 2026-08-20
rfc: "0075-collection-association-target-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in PR #6752 (RFC 0114), which made `CollectionProxy#replace` the
one-line delegation Rails writes and routed it at
`CollectionAssociation#replace`.

Rails applies the replace diff **exactly once**
(`vendor/rails/activerecord/lib/active_record/associations/collection_association.rb:242-256`):

```ruby
def replace(other_array)
  other_array.each { |val| raise_on_type_mismatch!(val) }
  original_target = skip_strict_loading { load_target }.dup

  if owner.new_record?
    replace_records(other_array, original_target)
  else
    replace_common_records_in_memory(other_array, original_target)
    if other_array != original_target
      transaction { replace_records(other_array, original_target) }
    else
      other_array
    end
  end
end
```

trails' persisted-owner arm
(`packages/activerecord/src/associations/collection-association.ts`, the `else`
branch of `replace`) applies it **twice**, because the RFC 0068 split makes
`replace` synchronous:

1. the sync body splices the dropped records out of `target` and
   `setOwnerAttributes` + `addToTarget`s the gained ones, then returns a
   `ReplacePlan`;
2. `persistReplacePlan` restores `pending.originalTarget` into `_targetStore`
   and runs `replaceRecords` — the real Rails body — over the same diff.

Step 1 is not in Rails at all. It exists so a property setter that cannot
`await` still reflects the assignment in memory, but every awaitable caller
(`writer`, `idsWriter`, and now `CollectionProxy#replace`) reaches step 2 and
redoes the work.

PR #6752 had to paper over one consequence: step 1's `addToTarget` was firing
`before_add`/`after_add`, and step 2's `concat` fired them **again**, so every
gained record got doubled callbacks. That PR passed `skipCallbacks: true` at the
step-1 site to stop the doubling. **That is a patch on the deviation, not its
removal** — the diff is still computed and applied twice, and any other
observable side effect of step 1 (inverse wiring via `setOwnerAttributes`,
`loadedBang()`, `_replacedOrAddedTargets` membership) is still applied on a
baseline `persistReplacePlan` then throws away.

Note `syncWrite` already **refuses** the persisted-owner case outright
(`CollectionPersistedAssignmentError`), so step 1 has no non-awaitable caller
that reaches it for a persisted owner — which is what makes this removable
rather than load-bearing.

Related, both narrower and already filed: the guard spelling
(`replace-persisted-guard-diverges-from-rails-array-compare`) and the missing
`skip_strict_loading { load_target }` baseline
(`collection-association-replace-missing-skip-strict-loading`). This story is the
third leg — the double application itself.

## Converged shape

Make the persisted-owner arm apply the diff once, in `replace_records`, inside
`transaction`, as Rails does. Concretely: the sync `replace` should not mutate
`target` for a persisted owner at all; it returns the plan and
`persistReplacePlan` runs `replace_common_records_in_memory` + the
`other_array != original_target` guard + `replace_records`. The
`skipCallbacks: true` at the step-1 `addToTarget` site is then deleted with the
step it guarded, and `addToTarget` goes back to Rails' unguarded call
(`collection_association.rb:281-283`).

## Acceptance criteria

- [ ] The persisted-owner arm of `CollectionAssociation#replace` no longer
      applies the diff in the synchronous body; `persistReplacePlan` is the only
      place `replace_records` runs for that arm.
- [ ] The `skipCallbacks: true` argument added by PR #6752 at the step-1
      `addToTarget` site is gone, along with the comment justifying it.
- [ ] `before_add`/`after_add` still fire exactly once per gained record —
      `collection-proxy-replace-diff.trails.test.ts` ("adds only the records the
      new target gained") stays green without the suppression.
- [ ] `pnpm parity:api:calls` / `:args` add zero rows for
      `collection-association.ts`.
