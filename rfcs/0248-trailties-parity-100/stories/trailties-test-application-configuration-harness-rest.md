---
title: "trailties-test-application-configuration-harness-rest"
status: draft
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

trails#10837 ported `configuration_test.rb:308`, `:321`, `:332`, `:342` (application root, `Rails.root` / `Rails.public_path` as Pathname) and converged `Trails.publicPath` on `railties/lib/rails.rb:122-124`. Still Miss in `vendor/rails/v8.0.5.2/railties/test/application/configuration_test.rb`, each needing the isolation harness (`packages/trailties/test/support/isolation/abstract-unit.ts`) or a lib change:

- `:116`, `:125` log tags by default (`restore_default_config`, generated `config/environments/*`).
- `:134` lib dir is on LOAD_PATH during config: `addToTopOfConfig` writes into the `static {}` block, which cannot await the `require` (packages/trailties/CLAUDE.md, "A `require` in the `Application` class body runs after the class").
- `:150` raises if cache does not support recyclable cache keys.
- `:162`, `:203` renders an exception on pending migration (single / multiple DBs).
- `:374`-`:536` eager loading of controller/mailer actions and attribute methods (8 tests).
- `:541` application can be eager loaded with no frameworks.
- `:677` config.to_prepare is forwarded to ActionDispatch.
- `:3341`-`:3411` stylesheet_link_tag / javascript_include_tag link header (4 tests).
- `:3450` ActiveJob::Base.retry_jitter can be set by config (`activejob/lib/active_job/railtie.rb:55` relies on lazy `ActiveJob::Base` load).

## Acceptance criteria

- [ ] Each test above ported under its Rails name in `packages/trailties/test/application/configuration.test.ts`, with lib fixes, or parked `PERMANENT-SKIP:` citing a ratified CLAUDE.md section.
- [ ] No Miss left for those lines in `pnpm parity:test -- --package trailties`.
