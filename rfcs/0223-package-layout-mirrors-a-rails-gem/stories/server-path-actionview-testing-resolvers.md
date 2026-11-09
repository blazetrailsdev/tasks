---
title: "server-path-actionview-testing-resolvers"
status: ready
updated: 2026-11-09
rfc: "0223-package-layout-mirrors-a-rails-gem"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/layout/server-path-closure.ts` (RFC 0223) finds
`packages/actionview/dist/index.js` importing `testing/resolvers.js` (one row
of `scripts/layout/server-path-closure-exclude.json`). Rails'
`action_view.rb` only autoloads `ActionView::FixtureResolver` /
`InMemoryResolver` via `action_view/testing/resolvers`
(`vendor/rails/v8.0.2/actionview/lib/action_view.rb`).

## Acceptance criteria

- [ ] `@blazetrails/actionview`'s `.` entry no longer imports
      `testing/resolvers`; its row is deleted from the exclude list.
