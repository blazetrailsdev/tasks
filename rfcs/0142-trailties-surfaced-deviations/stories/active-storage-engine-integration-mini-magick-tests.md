---
title: "Port ActiveStorageEngineTest's mini_magick boot tests (Rails 8.0.5.2)"
status: draft
updated: 2026-11-24
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails 8.0.5.2 added three tests to `vendor/rails/v8.0.5.2/railties/test/application/active_storage/engine_integration_test.rb`: "mini magick transformer raises at boot with unsecurable mini magick" (:37), "vips transformer boots with unsecurable mini magick" (:47) and "image magick policy is applied after an initializer replaces mini magick cli env" (:56). They test activestorage's boot-time mini_magick 5.1 requirement and its `ActiveStorage::ImageMagick::POLICY_DIRECTORY` / `MiniMagick.cli_env` wiring. trailties has no `test/application/active-storage/engine-integration.test.ts`. trails#10684 left all three unported.

## Acceptance criteria

- [ ] `packages/trailties/test/application/active-storage/engine-integration.test.ts` exists with the three tests, named as in Rails, on the isolation harness.
- [ ] Lib fixes the tests need, in activestorage's engine/railtie and the mini-magick port, land in the same PR, citing the activestorage engine.rb lines.
