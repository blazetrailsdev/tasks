---
title: "system-test-helper-initializer-includes-synchronously"
status: done
updated: 2026-11-16
rfc: "0219-actiontext-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10151
claim: "2026-11-16T00:23:10Z"
assignee: "system-test-helper-initializer-includes-synchronously"
blocked-by: null
closed-reason: null
---

# `action_text.system_test_helper` includes `SystemTestHelper` synchronously

## Context

- Rails: `initializer "action_text.system_test_helper"`
  (`vendor/rails/v8.0.2/actiontext/lib/action_text/engine.rb:77-82`) runs
  `require "action_text/system_test_helper"` and then `include ActionText::SystemTestHelper`
  inside `ActiveSupport.on_load(:action_dispatch_system_test_case)`. The `require` is synchronous,
  so the include is done by the time `run_load_hooks` returns.
- trails#10151 (`packages/actiontext/lib/engine.ts`): the hook is `async` and runs
  `await import("@blazetrails/actiontext/system-test-helper")` before `include`.
  `runLoadHooks` / `executeHook` (`packages/activesupport/lib/lazy-load-hooks.ts:39,61`) are sync
  and drop the promise. So the include lands on a later microtask, and a rejected import goes
  unreported.
- A static `import { SystemTestHelper } from "./system-test-helper.js"` fails
  `scripts/layout/server-path-closure.test.ts`: `engine.js` → `system-test-helper.js` counts as a
  testing module on the server path (RFC 0223).

## Acceptance criteria

- The hook body is synchronous, and `SystemTestCase` answers `fillInRichTextarea` right after
  `runLoadHooks("action_dispatch_system_test_case", …)` returns, pinned by a test.
- `server-path-closure` stays green. Either `system-test-helper.ts` is not classified as testing
  code (it is ActionText production lib code, `action_text/system_test_helper.rb`), or the closure
  gate admits an import that only an `on_load` hook reaches, the way it already admits an
  own-package bare-specifier `import()`.
