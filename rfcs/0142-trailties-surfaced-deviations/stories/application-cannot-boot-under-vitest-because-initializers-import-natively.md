---
title: "trailties: an application cannot boot under vitest, because config/initializers are imported outside vite's module graph"
status: draft
updated: 2026-10-03
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trailmap#30 (trails pin `9e17ddc98d`).

`packages/trailties/src/engine.ts:373-378` (`load_config_initializers`) hands each file under
`config/initializers` to `loadConfigInitializer`, which loads it with
`await import(pathToFileURL(initializer).href)` (`engine.ts:243`). That is Node's own loader. Under
vitest the rest of the application is loaded through vite's module graph, where a `.js` specifier
resolves to its `.ts` source; a natively imported initializer is outside that graph, so its own
`.js` imports of `.ts` files do not resolve and the boot raises.

Rails: `vendor/rails/v8.0.2/railties/lib/rails/engine.rb` `load_config_initializer` calls `load`,
the same loader the test process uses for everything else, so `rails test` boots the application
in-process (`test_helper.rb` requires `config/environment`).

Workaround in the application, which is the finding: trailmap cannot `import
"config/environment.js"` in a test. `test/helpers/app-helpers-in-views.test.ts` spawns
`tsx scripts/app-helpers-probe.ts` as a child process and reads one line of JSON from it, and
`test/support/controller-test-case.ts` imports `config/application.js` and `config/routes.js`
without ever running the initializers.

## Expected shape

A generated application's test can import `config/environment` and get a booted application in the
vitest process, as `rails test` does. Whether that is the framework loading initializers through
the host's module loader when one is present, or the generated vitest config resolving them, is the
story's first decision.

## Acceptance criteria

- [ ] A freshly generated application with one file in `config/initializers` that imports an application `.ts` module by its `.js` specifier boots inside a vitest test.
- [ ] trailmap can delete the child-process probe and boot in-process.
