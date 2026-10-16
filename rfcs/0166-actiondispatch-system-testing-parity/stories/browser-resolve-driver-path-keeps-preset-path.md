---
title: "Browser#resolveDriverPath keeps a preset driver path"
status: done
updated: 2026-10-16
rfc: "0166-actiondispatch-system-testing-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#8984
claim: "2026-10-16T16:44:58Z"
assignee: "browser-resolve-driver-path-keeps-preset-path"
blocked-by: null
closed-reason: null
---

## Context

Rails' `Browser#resolve_driver_path`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/system_testing/browser.rb:65-72`)
assigns `namespace::Service.driver_path` from `DriverFinder`, which keeps a
driver path that is already set. `driver_test.rb:166-176` ("does not
overwrite existing driver_path during preload") and `:31-39` / `:49-57`
(custom `driver_path = "bin/test"`) rely on that. trails'
`Browser#resolveDriverPath` (`packages/actionpack/src/action-dispatch/system-testing/browser.ts`)
always reads `namespace.executablePath()` and overwrites
`options.executablePath`, and throws when the file is missing. So the ported
tests in `dispatch/system-testing/driver.test.ts` (trails#8980) can only assert
that the stubbed Playwright path is unchanged, and the custom-path tests must
use an existing file.

## Acceptance criteria

- A preset driver path (the trails carrier for `Service.driver_path`) survives
  `preload`, as DriverFinder keeps it.
- "does not overwrite existing driver_path during preload" asserts the preset
  path is unchanged, and the custom-path tests set `"bin/test"` as Rails does.
