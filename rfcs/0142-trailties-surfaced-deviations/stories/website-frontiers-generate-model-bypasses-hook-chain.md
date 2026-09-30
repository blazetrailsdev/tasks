---
title: "website frontiers generate model bypasses the orm/test_framework hook chain; runtime tests stale"
status: draft
updated: 2026-09-30
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#8270 moved the website's `VfsModelGenerator` (`packages/website/src/lib/frontiers/vfs-generator.ts`) onto `active_record:model`. `trails-cli.ts`'s `generate model` arm now constructs it with `name` / `attributes` / `migration: true` / `timestamps: true` and runs `createMigrationFile`, `createModelFile` and `createModuleFile` directly. It can't go through `ModelGenerator.start`, because `Generators.lookup` probes the real filesystem, and the VFS adapter hides it in the browser.

So the website:

- never reaches `hook_for :test_framework` (`activerecord/lib/rails/generators/active_record/model/model_generator.rb:40`), and writes no `test/models/*.test.ts` or fixture;
- hard-codes the `orm` config values (`activerecord/lib/active_record/railtie.rb:20`) instead of reading them from a loaded app's generators config.

`packages/website/src/lib/frontiers/runtime.test.ts` is also stale on `main`, independent of #8270. It expects `class User extends Base` and `this.attribute("name", "string")` from `generate model`, which the generator has not emitted for a long time, and "creates test file alongside model" now fails too. CI runs only `packages/website/scripts/` (`.github/workflows/ci.yml:1610`), so none of this is caught.

## Acceptance criteria

- The frontiers `generate model` runs the same hook chain as the CLI: `rails:model` → `active_record:model` → `test_unit:model`, with the generators config the AR and test-unit trailties seed. That means generator lookup has to work under the VFS adapter, or be pre-registered.
- `runtime.test.ts`'s `generate model` / `generate migration` expectations match the current generator output, and the file passes.
