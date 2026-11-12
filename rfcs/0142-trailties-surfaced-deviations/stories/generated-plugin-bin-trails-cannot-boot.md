---
title: "generated-plugin-bin-trails-cannot-boot"
status: draft
updated: 2026-11-12
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

`with_new_plugin` (`vendor/rails/v8.0.2/railties/test/plugin_helpers.rb:39-42`) generates a plugin and runs `bin/rails g controller`, `db:migrate` and `bin/rails test` inside it (`vendor/rails/v8.0.2/railties/test/generators/scaffold_controller_generator_test.rb:278-296`). A plugin from `trails plugin new bukkits --mountable` (with `node_modules/@blazetrails` symlinked, as `runAppUpdate` in `packages/trailties/test/generators/generators-test-helper.ts` does) cannot run any `bin/trails` command under Node 26:

- `bin/trails g controller dashboard foo` fails with `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX`: `lib/bukkits/engine.ts` (from `packages/trailties/lib/generators/trails/plugin/templates/lib/...`) uses `export namespace`, which strip-only type stripping rejects.
- `bin/trails db:migrate` / `bin/trails test` fail with `Cannot find module .../lib/bukkits.js` imported from `test/dummy/config/boot.ts` (`import "../../../lib/bukkits.js"`); only `lib/bukkits.ts` exists.

## Acceptance criteria

- A freshly generated `--mountable` and `--full` plugin runs `bin/trails g controller dashboard foo`, `bin/trails db:migrate TRAILS_ENV=test` and `bin/trails test` successfully.
- Unblocks `port-plugin-helpers-with-new-plugin`.
