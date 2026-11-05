---
title: "class-paths pairs same-named generators across Rails/TestUnit/ActiveRecord namespaces"
status: draft
updated: 2026-11-05
rfc: "0171-thor-port"
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

`generator-base-name-reads-ruby-class-path` needs each trailties generator to carry its Ruby path, so that `rbModName` reaches `name.split("::")` in `self.base_name` / `self.generator_name` (`vendor/rails/v8.0.2/railties/lib/rails/generators/base.rb:334-347`). An attempt (local branch `generator-base-name-ruby-path-wip`, off trails#9746) added `"generators/"` to `LAZY_DIRS.trailties` in `scripts/api-compare/class-paths.ts`, so each generator file imports its own `constants.<path>.generated.ts`. Generators load lazily, so this avoids the eager-import problems the story records.

`pnpm parity:class-paths:check --record` then derives the residue from the `rails-api.json` pairing, and two things go wrong:

- Nine walked exports pair with no Ruby class and are reported as "new walked export with no Ruby counterpart": `generators/base.ts::GeneratorBase` (Rails `Rails::Generators::Base`), `trails/app/app-generator.ts::AppGenerator`, `trails/channel/channel-generator.ts::ChannelGenerator`, `trails/job/job-generator.ts::JobGenerator`, `test-unit/channel/channel-generator.ts::ChannelGenerator`, `active-record/{application-record,migration,model}/*-generator.ts`, and `generated-attribute.ts::GeneratorError`. Most are same-short-name collisions across the `Rails::` / `TestUnit::` / `ActiveRecord::Generators` namespaces (`ambiguous` in `collectClassPaths`, class-paths.ts:312-337); `GeneratorBase` is a TS rename.
- `Erb::Generators::*` is renamed to `Tse::Generators::*`, not `TSE::` (`renameTokens`, class-paths.ts:133-145), so `base_name` would answer `tse` with the wrong case.
- The walk derives `Trails::Generators::Db::System::ChangeGenerator`, where Rails has `Rails::Generators::Db::System::ChangeGenerator`. Check that against `rails/db/system/change/change_generator.rb`.

## Acceptance criteria

- [ ] With `"generators/"` in trailties' `LAZY_DIRS`, `pnpm parity:class-paths:check` passes, and every generator table names the Rails path with `Rails` renamed to `Trails`: `Trails::Generators::AppGenerator`, `TestUnit::Generators::ChannelGenerator`, `ActiveRecord::Generators::ModelGenerator`, `Trails::Generators::Base`, and `TSE::Generators::ControllerGenerator`.
- [ ] Same-short-name generators in different Ruby namespaces pair by file path, not by short name.
- [ ] No `@noRailsEquivalent` receipt is added to any of the nine classes.
