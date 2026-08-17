---
title: "port-attribute-mutation-tracker-force-change"
status: done
updated: 2026-08-17
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6619
claim: "2026-08-16T22:56:16Z"
assignee: "activemodel-instance-validates-with"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by PR #6558 (RFC 0096 wave-4 naming burndown for activemodel). One
`class: "naming"` row could not converge as a rename because the underlying
Rails object is not ported.

Rails `ActiveModel::Dirty#attribute_will_change!` is one line
(`vendor/rails/activemodel/lib/active_model/dirty.rb:409-411`):

    def attribute_will_change!(attr_name)
      mutations_from_database.force_change(attr_name.to_s)
    end

and `AttributeMutationTracker#force_change`
(`vendor/rails/activemodel/lib/active_model/attribute_mutation_tracker.rb:63-65`)
resolves the current value itself:

    def force_change(attr_name)
      forced_changes[attr_name] = fetch_value(attr_name)
    end

trails' `packages/activemodel/src/dirty.ts:581-583` instead reads

    return this._dirty.forceChange(attrName, this._attributes.fetchValue(attrName));

because there is no `AttributeMutationTracker` port: `_dirty` is a bespoke
tracker, `mutationsFromDatabase` (dirty.ts:278) is a plain
`Record<string, [unknown, unknown]>` rather than the tracker object, and
`forceChange` (dirty.ts:406) takes a second `currentValue` argument that Rails
resolves internally.

Rails also has a second `force_change` on
`ForcedMutationTracker` (attribute_mutation_tracker.rb:121-123) with a
`attribute_changed?` guard, which trails does not distinguish either.

## Acceptance criteria

- [ ] `attributeWillChangeBang` reads `this.mutationsFromDatabase.forceChange(attrName)`
      — one argument, the Rails receiver — or the port is `pnpm tasks block`ed
      with the specific blocker.
- [ ] `forceChange` resolves the value itself via `fetchValue`, matching
      attribute_mutation_tracker.rb:63-65.
- [ ] The `dirty.ts` / `force_change` naming row no longer appears in
      `pnpm parity:api:calls:args:report`, and no new `shape` row appears.
- [ ] No baseline row added or widened.
- [ ] activemodel and activerecord dirty-tracking suites green on all three lanes.
