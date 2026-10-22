---
title: "screenshot-helper.test.ts asserts paths with toMatch where Rails stubs Rails.root and asserts equality"
status: ready
updated: 2026-10-19
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
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
trails' port now reads `TopLevel.Trails!.root()`
(`packages/actionpack/src/action-dispatch/system-testing/test-helpers/screenshot-helper.ts:102,112,128`).

The tests have not followed. `screenshot_helper_test.rb`'s path tests stub `Rails.root`
and `assert_equal Rails.root.join("tmp/screenshots/0_x.png").to_s, ...`
(`vendor/rails/v8.0.2/actionpack/test/dispatch/system_testing/screenshot_helper_test.rb:14-81,171-185`);
the port in `packages/actionpack/src/action-dispatch/dispatch/system-testing/screenshot-helper.test.ts`
still asserts with `toMatch` regexes (6 sites), which are assertion-kind mismatch rows.

## Acceptance criteria

- The screenshot helper tests stub `Trails.root` as Rails stubs `Rails.root` and port Rails'
  `assert_equal` assertions; `pnpm parity:test:assertions` shows 0 rows for the file.
