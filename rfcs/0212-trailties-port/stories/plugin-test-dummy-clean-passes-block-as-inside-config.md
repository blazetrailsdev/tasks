---
title: "PluginBuilder#testDummyClean passes its block in inside()'s config slot"
status: claimed
updated: 2026-11-06
rfc: "0212-trailties-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: "2026-11-06T16:17:50Z"
assignee: "test-helper-constant-row-loads-without-test-case"
blocked-by: null
closed-reason: null
---

## Context

`PluginBuilder#test_dummy_clean` (`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/plugin/plugin_generator.rb`, `inside dummy_path do ... end`) is ported at `packages/trailties/src/generators/trails/plugin/plugin-generator.ts:210` as `this.inside(this.dummyPath(), async () => {...})`. Thor's port has the Ruby signature `inside(dir = "", config = {}, &block)` (`packages/thor/src/actions.ts:229-234`, `vendor/thor/v1.3.2/lib/thor/actions.rb` `inside`). So the block lands in `config`, `block` is `undefined`, and `inside` throws `TypeError: Cannot read properties of undefined (reading 'length')` at `actions.ts` (`block.length`). The same crash hit `AppBuilder#config` in trails#9735 and was fixed there by passing `{}`. The host interface at `plugin-generator.ts:19` (`inside(path, block)`) hides the mismatch from the type checker.

## Acceptance criteria

- `testDummyClean` calls `this.inside(this.dummyPath(), {}, async () => ...)`, as Ruby's block call does, and `PluginBuilderHost#inside` declares Thor's `(dir, config, block)` signature.
- A test runs `trails plugin new --dummy-path` (or the builder step directly) and asserts the dummy app's `.node-version`, `db`, `package.json` and `lib` are removed.
