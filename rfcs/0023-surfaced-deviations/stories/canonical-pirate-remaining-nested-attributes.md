---
title: "Add remaining accepts_nested_attributes_for declarations to canonical Pirate model"
status: done
updated: 2026-06-24
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 4075
claim: "2026-06-24T18:26:41Z"
assignee: "canonical-pirate-remaining-nested-attributes"
blocked-by: null
---

## Context

The canonical `Pirate` model
(`packages/activerecord/src/test-helpers/models/pirate.ts`) is missing most of
the `accepts_nested_attributes_for` declarations that Rails'
`vendor/rails/activerecord/test/models/pirate.rb:49-54` declares. PR #4068 added
only the four callback-bearing collections
(`parrotsWith{Method,Proc}Callbacks`, `birdsWith{Method,Proc}Callbacks`).

Still missing vs pirate.rb:

- `accepts_nested_attributes_for :parrots, :birds, allow_destroy: true, reject_if: proc(&:empty?)`
- `accepts_nested_attributes_for :ship, allow_destroy: true, reject_if: proc(&:empty?)`
- `accepts_nested_attributes_for :update_only_ship, update_only: true`
- `accepts_nested_attributes_for :birds_with_reject_all_blank, reject_if: :all_blank`

These were omitted from #4068 to bound blast radius (they flip `autosave: true`
on `birds`/`parrots`/`ship`, which several has-one/habtm tests consume).

## Acceptance criteria

- Add the remaining `acceptsNestedAttributesFor` declarations to the canonical
  `Pirate` model matching pirate.rb:49-54 (`reject_if` empty/all_blank,
  `updateOnly` for `updateOnlyShip`).
- Resolve any has-one-associations / habtm / dirty test fallout from the
  newly-`autosave` reflections (fix impl/tests; do not re-bespoke the model).
- No test:compare or api:compare regression.
