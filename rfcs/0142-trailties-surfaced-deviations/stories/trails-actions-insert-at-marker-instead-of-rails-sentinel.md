---
title: "trails-actions-insert-at-marker-instead-of-rails-sentinel"
status: ready
updated: 2026-09-25
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 40
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/trailties/src/generators/trails-actions.ts`'s `route` and
`environment` insert code before a comment marker (`// routes`, `// config`)
through the invented `insertAtMarker` helper. The generated files carry those
markers so the actions have somewhere to insert. Rails uses no markers. It
injects after a sentinel line, and its `environment`
(`railties/lib/rails/generators/actions.rb:206-221`) does:

- application arm: `inject_into_file "config/application.rb", optimize_indentation(data, 4), after: "class Application < Rails::Application\n"`
- env arm: `inject_into_file "config/environments/#{env}.rb", optimize_indentation(data, 2), after: "Rails.application.configure do\n"`
- `Array(options[:env]).each`, so `env:` may be a list
- `alias :application :environment`

`route` (`actions.rb:271-298`) also injects after a sentinel
(`/\.routes\.draw do\s*\n/m`) and handles namespaces. The generated env files
now open with `Trails.application!.configure(function () {\n`, so the env
arm's sentinel exists.

## Acceptance criteria

- `environment` injects after the sentinels above, using an
  `optimizeIndentation` port (`actions.rb:487-490`). It accepts an Array
  `env`, and `application` is its alias.
- `route` injects after the routes-draw sentinel, mirroring `actions.rb:271-298`.
- The `// config` / `// routes` markers are gone from generated files, and
  `insertAtMarker` is deleted.
