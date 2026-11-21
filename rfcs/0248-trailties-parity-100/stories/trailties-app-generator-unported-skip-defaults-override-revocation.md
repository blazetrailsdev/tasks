---
title: "trailties-app-generator-unported-skip-defaults-override-revocation"
status: ready
updated: 2026-11-21
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

`test_minimal_rails_app_with_no_skip_implied_option` (`vendor/rails/v8.0.2/railties/test/generators/app_generator_test.rb:1286-1295`): `--minimal --no-skip-action-text` must revoke the implied `skip_active_storage` / `skip_active_job` (`app_base.rb:174-200`, `deduce_implied_options`). trails' `AppGenerator` constructor (`packages/trailties/lib/generators/trails/app/app-generator.ts`, after `implyOptions`) spreads `UNPORTED_SUBSYSTEM_SKIP_DEFAULTS` (`skipActionMailer: true, skipActiveStorage: true`) under the options after the deduction runs, so a revoked `skipActiveStorage` comes back `true`. The same defaults force `app-generator.test.ts` to pass `...UNPORTED` to `create keeps` and `devcontainer`, where Rails passes no flags. Left unported by trailties-test-app-generator-part-3.

## Acceptance criteria

- [ ] Remove the `UNPORTED_SUBSYSTEM_SKIP_DEFAULTS` override (or have it respect revocation), so the options come only from `imply_options`.
- [ ] Port `test_minimal_rails_app_with_no_skip_implied_option`. Drop `...UNPORTED` from `create keeps` and `devcontainer`.
