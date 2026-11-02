---
title: "rails-controller-seats-reach-every-entry"
status: ready
updated: 2026-11-02
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/trailties/src/index.ts` seats `Trails.HealthController`, `InfoController`, `PwaController`, `WelcomeController` and `TopLevel.Rails = Trails`, so a process entering below the index resolves no `Rails::HealthController`. Rails autoloads them at `vendor/rails/v8.0.2/railties/lib/rails.rb:30-37`. `bin/trails` (`dist/bin.js`) was not traced. `manifest-and-rails-namespace-seats` mentions a `Rails` object since deleted.

## Acceptance criteria

- Every trailties entry (`bin.ts`, `server-bin.ts`, `commands`) resolves `Rails::HealthController`, by `Trails.autoload` or an index import, with a test per entry.
