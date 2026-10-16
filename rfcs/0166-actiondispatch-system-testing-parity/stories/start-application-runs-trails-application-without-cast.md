---
title: "startApplication runs Trails.application with no cast (structural call on the TopLevel seat)"
status: done
updated: 2026-10-16
rfc: "0166-actiondispatch-system-testing-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: trails#8977
claim: "2026-10-16T13:49:50Z"
assignee: "delegate-class-constructor-takes-no-object"
blocked-by: null
closed-reason: null
---

## Context

`SystemTestCase.startApplication` (`packages/actionpack/src/action-dispatch/system-test-case.ts`) ports `system_test_case.rb:128-136` (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/system_test_case.rb`), whose body is `map "/" do run Rails.application end`. The port has to cast `TopLevel.Trails!.application as unknown as RackApp`. The reason is that the `TopLevel.Trails.application` seat in `packages/activesupport/src/namespaces.ts` is typed without a `call`, and activesupport cannot import rack's `RackApp` type. trails#8969 review noted this.

## Acceptance criteria

- `TopLevel.Trails.application` gains a structural `call(env: Record<string, unknown>): Promise<[number, Record<string, string | string[]>, unknown]>` member, with no import from rack.
- `Rack::Builder#run` accepts that shape (or a `RackApp | RackMiddleware`), so `startApplication` reads `builder.run(TopLevel.Trails!.application)` with no cast.
