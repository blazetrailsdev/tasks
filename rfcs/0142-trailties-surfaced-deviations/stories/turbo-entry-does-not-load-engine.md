---
title: "turbo-entry-does-not-load-engine"
status: draft
updated: 2026-11-22
rfc: "0142-trailties-surfaced-deviations"
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

`turbo-rails.rb` begins with `require "turbo/engine"` (vendor/turbo-rails/\*/lib/turbo-rails.rb:1), so
`Bundler.require` boots the engine (helpers such as `turboStreamFrom`, `Broadcastable` on
`ActiveRecord::Base`, the streams channel). trails' entry `packages/turbo/lib/turbo-trails.ts` imports the
engine only as a type, so an app that lists `@blazetrails/turbo` gets no engine: views raise
`turboStreamFrom is not defined` and models lack `broadcastAppendTo`. A direct `import "./engine.js"`
cycles: `engine.ts` reads `Turbo` while its module evaluates (`isolateNamespace(Turbo)`, `Turbo.Engine = Engine`).
Pointing the package entry at an `index.ts` that imports both (the stimulus / vite-trails shape) works at
run time but moves the class-path walk off `turbo-trails.ts`, and `pnpm parity:class-paths` then deletes
four constant tables and reports seven new walked exports (trails#10605 CI). examples/chatter imports
`@blazetrails/turbo/engine` in config/application.ts as a workaround.

## Acceptance criteria

- An app whose package.json lists `@blazetrails/turbo` boots the engine through `Bundler.require`, with no
  explicit engine import.
- `pnpm parity:class-paths --check` stays clean, with turbo's constant tables intact.
- examples/chatter's explicit `import "@blazetrails/turbo/engine"` is removed.
