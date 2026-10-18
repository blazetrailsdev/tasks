---
title: "actionview abstract-unit sets ActionController::Base.view_paths = FIXTURE_LOAD_PATH"
status: draft
updated: 2026-10-18
rfc: "0176-actionview-helpers"
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

`vendor/rails/v8.0.2/actionview/test/abstract_unit.rb:106-108` reopens `ActionController::Base` with
`self.view_paths = FIXTURE_LOAD_PATH` beside `self.test_routes`. trails'
`packages/actionview/src/test-helpers/abstract-unit.ts` ports `testRoutes` (trails#9036) but not the
`view_paths` line, and actionview has no `FIXTURE_LOAD_PATH` constant (`abstract_unit.rb` defines it
from `FIXTURE_LOAD_PATH = File.expand_path("fixtures", __dir__)`); each controller test hand-builds a
`FixtureResolver` instead (e.g. `packages/actionview/src/actionpack/controller/capture.test.ts`).

## Acceptance criteria

- Define `FIXTURE_LOAD_PATH` in actionview's abstract-unit and set `ActionController.Base.viewPaths(FIXTURE_LOAD_PATH)` as Rails does.
- Tests that relied on per-file resolvers keep passing (or drop their bespoke resolver where the fixture tree now serves them).
