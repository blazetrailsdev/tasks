---
title: "trailties-test-application-configuration-harness-remainder"
status: ready
updated: 2026-11-27
rfc: "0248-trailties-parity-100"
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

trailties-test-application-configuration-part-1 / part-6 ported the
lightweight-app tests of `vendor/rails/v8.0.5.2/railties/test/application/configuration_test.rb`
into `packages/trailties/test/application/configuration.test.ts`. These remain
Miss; each needs the generated app (`test/support/isolation/abstract-unit.ts`
`buildApp` + Rack::Test) or a lib change:

- `:116`, `:125` log tags by default (needs generated `config/environments/*`, `restore_default_config`).
- `:134` lib dir is on LOAD_PATH during config (`add_to_top_of_config`).
- `:150` raises if cache does not support recyclable cache keys.
- `:162`, `:203` renders an exception on pending migration (single / multiple DBs).
- `:308`, `:321` application root can be set / is Dir.pwd without config.ru.
- `:332`, `:342` `Rails.root` / `Rails.public_path` should be a Pathname — `Trails.root()` returns a string (`packages/trailties/lib/trails.ts:155`), `publicPath` a string; converge to `Pathname`.
- `:374`-`:536` eager loading of controller/mailer actions and attribute methods (8 tests).
- `:541` application can be eager loaded with no frameworks.
- `:677` config.to_prepare is forwarded to ActionDispatch (needs a `get "/"`).
- `:3341`-`:3411` stylesheet_link_tag / javascript_include_tag link header (4 tests, need request).
- `:3450` ActiveJob::Base.retry_jitter can be set by config — Rails relies on `ActiveJob::Base` loading lazily after the config write (`activejob/lib/active_job/railtie.rb:55`); trails loads Base eagerly.

## Acceptance criteria

- [ ] Each test above is ported under its Rails name in `configuration.test.ts`, with lib fixes, or parked `PERMANENT-SKIP:` citing a ratified CLAUDE.md section.
- [ ] No Miss left for those lines in `pnpm parity:test -- --package trailties`.
