---
title: "Port AutosaveAssociation#reload (reset marked_for_destruction on reload)"
status: done
updated: 2026-07-13
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 4844
claim: "2026-07-13T19:18:26Z"
assignee: "port-autosave-association-reload-reset-marked-for-destruction"
blocked-by: null
closed-reason: null
---

## Context

trails has NO `AutosaveAssociation#reload` override. Rails'
`ActiveRecord::AutosaveAssociation#reload` (vendor/rails
activerecord/lib/active_record/autosave_association.rb:237-242) resets
in-memory autosave state before delegating to super:

```ruby
def reload(options = nil)
  @marked_for_destruction = false
  @destroyed_by_association = nil
  super
end
```

PR #4527 (aggregations-reload-hardcodes-persistence-skips-autosave-mro) made
`Aggregations#reload` delegate through the inherited `reload` captured at
`includeAggregations` time (aggregations.ts) precisely so this hop stays live
once it is ported — today the chain collapses straight to Persistence#reload
because no autosave override exists.

## Acceptance criteria

- [ ] Port `AutosaveAssociation#reload`: on reload, clear `markedForDestruction`
      (and any `destroyedByAssociation` equivalent) on the record, then delegate
      to the inherited `reload` (Ruby `super`).
- [ ] Wire it into the prototype reload chain BELOW `Aggregations#reload` so MRO
      is Aggregations → AutosaveAssociation → Persistence (see base.ts include
      ordering and aggregations.ts `includeAggregations` inheritedReload capture).
- [ ] Mirror the Rails test `test_a_marked_for_destruction_record_should_not_be_be_marked_after_reload`
      (autosave_association_test.rb) verbatim.
- [ ] No regression to composed_of reload cache-clearing (aggregations.test.ts).
