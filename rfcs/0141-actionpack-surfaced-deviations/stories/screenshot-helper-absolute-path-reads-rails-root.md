---
title: "ScreenshotHelper#absolute_path joins Rails.root, not the cwd"
status: draft
updated: 2026-10-18
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ScreenshotHelper#absolute_path` is `Rails.root.join(screenshots_dir, image_name)`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/system_testing/test_helpers/screenshot_helper.rb:90-92`).
trails' `absolutePath` joins `projectRoot()`
(`packages/actionpack/src/action-dispatch/system-testing/test-helpers/screenshot-helper.ts:41,106-108`),
which reads `process.cwd()` rather than `Rails.root` (`TopLevel.Trails!.root`
per root CLAUDE.md "Call-time constant resolution").

Because of it, `screenshot_helper_test.rb`'s path tests, which stub
`Rails.root` and `assert_equal Rails.root.join("tmp/screenshots/0_x.png").to_s, ...`
(`vendor/rails/v8.0.2/actionpack/test/dispatch/system_testing/screenshot_helper_test.rb:14-81,171-185`),
are ported as `toMatch` regexes: 12 kind-mismatch rows in
`packages/actionpack/src/action-dispatch/dispatch/system-testing/screenshot-helper.test.ts`.

## Acceptance criteria

- `absolutePath` / `relativeImagePath` read `Rails.root` through the
  `TopLevel.Trails` seat, as Rails does.
- The screenshot helper tests stub `root` and port Rails' `assert_equal`
  assertions; `pnpm parity:test:assertions` shows 0 rows for the file.
