---
title: "DrivenBy* classes live in abstract-unit (selenium preload must not reject unhandled)"
status: done
updated: 2026-10-16
rfc: "0166-actiondispatch-system-testing-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#8984
claim: "2026-10-16T16:44:58Z"
assignee: "browser-resolve-driver-path-keeps-preset-path"
blocked-by: null
closed-reason: null
---

## Context

Rails defines `DrivenByRackTest`, `DrivenBySeleniumWithChrome`, `DrivenBySeleniumWithHeadlessChrome` and `DrivenBySeleniumWithHeadlessFirefox` in `vendor/rails/v8.0.2/actionpack/test/abstract_unit.rb:518-533`. trails#8982 put them in `packages/actionpack/src/test-helpers/driven-by.ts` instead of `test-helpers/abstract-unit.ts`. The reason is that `Driver`'s constructor (`packages/actionpack/src/action-dispatch/system-testing/driver.ts`) starts `Browser#preload()` (`system-testing/browser.ts:43`) unawaited for the selenium arm. On a lane with no browser, `resolveDriverPath` rejects and leaves an unhandled rejection in every test that imports abstract-unit. Rails' `preload` (`action_dispatch/system_testing/browser.rb:41-48`) runs synchronously at class definition.

## Acceptance criteria

- The selenium preload promise no longer surfaces as an unhandled rejection at class definition. It is surfaced where Rails would raise: when the driver is registered or used (`registerSelenium` awaits it).
- The four `DrivenBy*` classes move into `test-helpers/abstract-unit.ts`, `driven-by.ts` is deleted, and `dispatch/system-testing/system-test-case.test.ts` imports them from abstract-unit.
