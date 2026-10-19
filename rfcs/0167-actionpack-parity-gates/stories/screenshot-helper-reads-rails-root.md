---
title: "screenshot-helper-reads-rails-root"
status: draft
updated: 2026-10-19
rfc: "0167-actionpack-parity-gates"
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

Rails' `ScreenshotHelper#absolute_path` and `#relative_image_path` read `Rails.root` (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/system_testing/test_helpers/screenshot_helper.rb:90-92`, `:102-104`), and Rails' tests stub it per test (`Rails.stub :root, Pathname.getwd`, `vendor/rails/v8.0.2/actionpack/test/dispatch/system_testing/screenshot_helper_test.rb`). trails' `screenshot-helper.ts` reads a module-private `projectRoot()` (the process cwd) in both places instead of `TopLevel.Trails!.root()`, which in actionpack's own tests answers `null` (no application). `relativeImagePath` now uses `Pathname#relativePathFrom` (story `screenshot-helper-relative-image-path-uses-relative-path-from`), and carries `@missingRailsCall root — CONVERGEABLE` pointing here for the remaining `Rails.root` read.

## Acceptance criteria

- `absolutePath` and `relativeImagePath` read `TopLevel.Trails!.root()` as Rails' `Rails.root`, and `projectRoot()` is removed.
- `screenshot-helper.test.ts` stubs `Trails.root` to `Dir.pwd()` the way Rails' test stubs `Rails.root`, and passes.
- The `@missingRailsCall root` receipt on `relativeImagePath` is removed and `pnpm parity:api:calls` stays green.
