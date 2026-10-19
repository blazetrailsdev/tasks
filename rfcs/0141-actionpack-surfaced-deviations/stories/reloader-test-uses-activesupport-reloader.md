---
title: "reloader.test.ts drives a real ActiveSupport::Reloader subclass, not a stub"
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

`packages/actionpack/src/action-dispatch/dispatch/reloader.test.ts` runs
`ActionDispatch::Reloader` against a hand-written `StubReloader` (its own
`prepareHooks` / `completeHooks` / `check`). Rails' test builds
`Class.new(ActiveSupport::Reloader)` with `reloader.check = check`, and clears it
in teardown with `ActiveSupport::Reloader.reset_callbacks :prepare` / `:complete`
(`vendor/rails/v8.0.2/actionpack/test/dispatch/reloader_test.rb:5-9,130-143`). Its
`call_and_return_body` and `middleware` wrap the app in `Rack::Lint` (`:130-137`).
`executor.test.ts` already uses a subclass of activesupport's `Executor`.

## Acceptance criteria

- `reloader.test.ts` uses a subclass of activesupport's `Reloader`, with its
  `check` set and `toPrepare` / `toComplete` callbacks, and wraps the app in
  `Lint` as Rails' `middleware` helper does.
- `StubReloader` is deleted, and the test names and assertions stay unchanged.
