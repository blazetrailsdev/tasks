---
title: "config.x set at boot reads empty in request code under trails server (development)"
status: draft
updated: 2026-10-26
rfc: "0142-trailties-surfaced-deviations"
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

trailmap's `config/application.ts` sets `config.x.tasks.dir = env.TASKS_DIR` in its application class's static block.

- Booting through `config/environment` in a plain `tsx` process keeps the value.
- Under `bin/trails server` in development (Vite, reloading on), request code reads `Trails.application.config.x.tasks.dir` as unset, even though the process environment carries `TASKS_DIR`. Seen 2026-10-26.
- Production hides it only because trailmap's `TASKS_DATABASE` ends in `.git/tasks.db`, and `tasksContentDir()` derives the checkout from that path.

In Rails, `config.x` is one `Rails::Application::Configuration::Custom` per application (`railties/lib/rails/application/configuration.rb`, `def x`), and it is the same object at boot and inside a request.

The root cause is not verified. The first suspect is a second module instance of the application under Vite's SSR graph.

## Acceptance criteria

- [ ] Reproduce with a generated app that sets a `config.x` value in its application class and reads it in a controller under `trails server` in development.
- [ ] Request code reads the value set at boot. A test pins it.
