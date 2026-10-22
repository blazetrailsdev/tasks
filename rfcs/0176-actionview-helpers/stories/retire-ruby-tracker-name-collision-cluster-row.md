---
title: "Retire the dead ruby_tracker.rb NAME_COLLISION_CLUSTERS row"
status: done
updated: 2026-10-22
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: trails#9236
claim: "2026-10-22T17:53:24Z"
assignee: "rack-deflater-files-static-builder-specs-take-rails-bodies"
blocked-by: null
closed-reason: null
---

## Context

trails#9175 registered `dependency_tracker/ruby_tracker.rb` as PERMANENT in
`scripts/parity/unported-files/actionview.ts`, so `parity:api` now lists it in
actionview's `excludedFiles`. `NAME_COLLISION_CLUSTERS` in
`scripts/api-compare/compare.ts` (around :4262-4275) still carries
`"actionview:dependency_tracker/ruby_tracker.rb"`. Its JSDoc says the row leaves
when `actionview-dependency-tracker-ruby-tracker-and-render-parser-are-unported`
lands `dependency-tracker/ruby-tracker.ts`. That will never happen under the
2026-10-18 ruling (`packages/actionview/CLAUDE.md` § "`TSETracker` answers what
`RubyTracker` answers"). An excluded file no longer reaches the cluster vote, so
the row is dead. `scripts/api-compare/compare.test.ts:2379` asserts it is present.

## Acceptance criteria

- The row is removed from `NAME_COLLISION_CLUSTERS`, along with its JSDoc
  paragraph and the `compare.test.ts` assertion. The set stays, empty, if
  nothing else uses the mechanism; otherwise drop the mechanism.
- `pnpm parity:api --package actionview` is unchanged: `ruby_tracker.rb` is
  still excluded.
