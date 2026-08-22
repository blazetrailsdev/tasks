---
title: "restore_attribute! guards on the assignment map, so an in-place mutation is never restored"
status: ready
updated: 2026-08-22
rfc: "0115-activemodel-fidelity-convergence"
cluster: null
packages: []
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

Surfaced landing PR #6859 (`converge-model-changed-onto-the-rails-name-array`),
which gave `restoreAttributes` Rails' `attr_names = changed` default
(`vendor/rails/activemodel/lib/active_model/dirty.rb:319-322`):

    def restore_attributes(attr_names = changed)
      attr_names.each { |attr_name| restore_attribute!(attr_name) }
    end

`changed` is `mutations_from_database.changed_attribute_names` (`:295-297`),
which includes an attribute changed **in place** — a mutated String or Hash
whose reference never moved. Rails' `restore_attribute!` (`:414-420`) then
guards on `attribute_changed?`, which is likewise true for an in-place change,
so the mutated value IS restored.

trails' `DirtyTracker#restoreAttribute`
(`packages/activemodel/src/dirty.ts:579-586`) instead guards on
`this._changedAttributes.has(name)` — the assignment map only. An in-place
mutation lives in the attribute's own `changedInPlace()` seat (which
`changedAttributeNames` and `attributeChanged` both consult), so
`restoreAttributes` walks the right names and then silently skips every
in-place one. The pre-#6859 `_dirty.restore()` had the same hole, so this is a
carried-over divergence, not a regression.

## Converged shape

`restoreAttribute` guards on the full `attributeChanged(name)` predicate — the
port of `attribute_changed?` (`dirty.rb:299-301`) it already has one line above
— rather than on `_changedAttributes.has(name)`, and restores the attribute's
`originalValue` for the in-place arm, mirroring `restore_attribute!`'s
`__send__("#{attr_name}=", attribute_was(attr_name))` + `clear_attribute_change`.

May be subsumed by `converge-dirty-tracker-onto-rails-mutation-trackers`
(same RFC), which replaces the whole tracker; converge there if that lands
first.

## Acceptance criteria

- [ ] `restoreAttributes` restores an attribute mutated in place (a serialized
      Hash, a mutated String), mirroring `dirty.rb:414-420`.
- [ ] A test drives an in-place mutation through `restoreAttributes()` and
      asserts the original value comes back and `changed` empties.
- [ ] `pnpm parity:api:calls` / `:args` green; all three adapter lanes green.
