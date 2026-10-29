---
title: "TSETracker ports ERBTracker#add_dependencies / add_dynamic_dependency / add_static_dependency"
status: closed
updated: 2026-10-29
rfc: "0176-actionview-helpers"
cluster: null
packages: ["actionview"]
deps:
  - port-ruby-tracker-and-converge-tse-tracker-to-erb-tracker
deps-rfc: []
est-loc: 80
priority: null
pr: trails#9358
claim: "2026-10-27T01:18:07Z"
assignee: "credit-helpers-eager-load-bang-in-api-compare"
blocked-by: null
closed-reason: "landed in trails#9358/#9368: origin/main tse-tracker.ts:106-130 defines addDependencies/addDynamicDependency/addStaticDependency and renderDependencies routes through them as erb_tracker.rb does"
---

## Context

`pnpm parity:api --package actionview` on origin/main (7a1140c7b2) reports
`dependency_tracker/erb_tracker.rb` → `dependency-tracker/tse-tracker.ts` at
10/13. Missing: `ActionView::DependencyTracker::ERBTracker#add_dependencies`,
`#add_dynamic_dependency`, `#add_static_dependency`. `TSETracker`
(`packages/actionview/src/dependency-tracker/tse-tracker.ts:57`) ports the rest
of ERBTracker but folds these three private helpers into its callers.

## Acceptance

- Port the three private methods onto `TSETracker` with Rails' names/arity,
  and route `render_dependencies` / `explicit_dependencies` arms through them
  as `erb_tracker.rb` does.
- `pnpm parity:api --package actionview` shows `erb_tracker.rb` 13/13; the
  tracker tests stay green.
