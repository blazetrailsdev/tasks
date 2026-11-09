---
title: "zeitwerk-namespace-body-autoloads-own-children"
status: in-progress
updated: 2026-11-09
rfc: "0212-trailties-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9904
claim: "2026-11-09T04:35:25Z"
assignee: "zeitwerk-namespace-body-autoloads-own-children"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/railties/test/application/initializers/load_path_test.rb:57-72`:
`lib/zoo.rb` is `class Zoo ; include ReptileHouse ; end`, so `Zoo::ReptileHouse`
(`lib/zoo/reptile_house.rb`) must autoload while `Zoo`'s body runs. Zeitwerk's lookup is
synchronous and a load is not (`packages/trailties/CLAUDE.md` § "The application loader is
Zeitwerk"); a `static {}` block naming `Zoo.ReptileHouse` sees nothing seated yet. Parked as
`it.skip` in `packages/trailties/src/application/initializers/load-path.test.ts`.

## Acceptance criteria

- Decide how a namespace's class body reaches a constant in its own namespace dir during
  eager load (e.g. eager-load children before running the parent body's include, or a seated
  namespace module), in `packages/zeitwerk`.
- Un-skip "eager loading loads parent classes before children"; it passes.
