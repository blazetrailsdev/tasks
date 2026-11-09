---
title: "ActionCable::Engine lives in trailties and roots via an invented ENGINE_CALLED_FROM export"
status: draft
updated: 2026-11-09
rfc: "0142-trailties-surfaced-deviations"
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

Rails defines `ActionCable::Engine` in the actioncable gem
(`vendor/rails/v8.0.2/actioncable/lib/action_cable/engine.rb`), so its
`called_from` is that file's dir and `find_root` climbs to the gem root.
trails defines it in `packages/trailties/lib/trailties/action-cable.ts`, and
trails#9897 had to root it at actioncable through a new export,
`ENGINE_CALLED_FROM` (`packages/actioncable/lib/action-cable.ts`, receipted
`@noRailsEquivalent PERMANENT`), because `import.meta.resolve` is unavailable
under vitest. Before that it was rooted at `packages/trailties` and its
`lib/tasks` glob loaded trailties' own task sources.

## Acceptance criteria

- [ ] `ActionCable::Engine` registers with the `import.meta.dirname` of a file
      that lives in the actioncable package (the Rails file location,
      `action_cable/engine.rb` → `packages/actioncable/lib/engine.ts`), wired
      so actioncable does not take a runtime dependency on trailties beyond
      what Rails' `require "rails"` in engine.rb implies — or the dependency
      direction is settled by the owner.
- [ ] `ENGINE_CALLED_FROM` is deleted.
- [ ] `test/trailties/action-cable.trails.test.ts`'s root assertion still
      passes.
