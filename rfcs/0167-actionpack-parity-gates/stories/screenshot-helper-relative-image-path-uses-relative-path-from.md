---
title: "screenshot-helper-relative-image-path-uses-relative-path-from"
status: done
updated: 2026-10-19
rfc: "0167-actionpack-parity-gates"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9053
claim: "2026-10-19T01:10:20Z"
assignee: "block-param-burndown-actiondispatch"
blocked-by: null
closed-reason: null
---

## Context

Rails' `ScreenshotHelper#relative_image_path` is `"#{absolute_path.relative_path_from(Rails.root)}.png"` (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/system_testing/test_helpers/screenshot_helper.rb:102-104`), over `absolute_path` (`:90-92`, `Rails.root.join(screenshots_dir, image_name)`). trails' `relativeImagePath` (`packages/actionpack/src/action-dispatch/system-testing/test-helpers/screenshot-helper.ts`) joins `screenshotsDir()` and `imageName` directly, because ruby-compat's `Pathname` has no `relative_path_from`, and it reads the project root through the module-private `projectRoot()` rather than `Rails.root`. The call gate flags the missing `root` call; it carries a `@missingRailsCall root — CONVERGEABLE` receipt pointing here.

## Acceptance criteria

- ruby-compat's `Pathname` answers `relativePathFrom` (MRI's `Pathname#relative_path_from`, `vendor/ruby/v3.3.11/ext/pathname/lib/pathname.rb`), with its tests.
- `relativeImagePath` is `${absolutePath.call(this).relativePathFrom(<Rails.root>)}.png`, the receipt is removed, and `pnpm parity:api:calls` stays green.
