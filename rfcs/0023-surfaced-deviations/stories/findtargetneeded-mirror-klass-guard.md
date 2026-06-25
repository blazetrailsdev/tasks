---
title: "findTargetNeeded: mirror Rails find_target? && klass factor"
status: ready
updated: 2026-06-25
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
---

## Context

`Association#findTargetNeeded` (`packages/activerecord/src/associations/association.ts:472`)
mirrors Rails `find_target?` (vendor/rails/activerecord/lib/active_record/associations/association.rb:320):

```ruby
def find_target?
  !loaded? && (!owner.new_record? || foreign_key_present?) && klass
end
```

trails returns `!isNew || foreignKeyPresent()` and omits the trailing
`&& klass` factor. When `klass` is nil (e.g. an unresolvable polymorphic
type), Rails short-circuits and does NOT attempt a query; trails would still
return true and proceed into `doAsyncFindTarget`. Surfaced during PR #4112
review (loadtarget-stale-state-guard-and-find-target-query) — out of scope
there because that PR only touched the `loadTarget` guard, not `findTargetNeeded`.

## Acceptance criteria

- [ ] `findTargetNeeded` returns false when the association `klass` is absent
      (nil/undefined), matching Rails `find_target?`'s `&& klass` factor.
- [ ] Polymorphic belongs_to with an unresolvable type does not attempt a query.
- [ ] Existing association suites stay green; test:compare delta non-negative.
