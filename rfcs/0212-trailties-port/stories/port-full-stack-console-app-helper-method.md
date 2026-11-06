---
title: "trailties: port FullStackConsoleTest 'app helper method'"
status: claimed
updated: 2026-11-06
rfc: "0212-trailties-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 15
priority: null
pr: null
claim: "2026-11-06T18:47:05Z"
assignee: "port-full-stack-console-app-helper-method"
blocked-by: null
closed-reason: null
---

## Context

`FullStackConsoleTest#test_app_helper_method` (`vendor/rails/v8.0.2/railties/test/application/console_test.rb:177-187`) draws `get 'foo', to: 'foo#index'`, spawns `bin/rails console -e development`, and runs `write_prompt "app.foo_path", "/foo"`.

trails ports `FullStackConsoleTest`'s helpers (`spawn_console`, `write_prompt`, `assert_output`) and the `helper` / `controller` / `new_session` tests in `packages/trailties/src/application/console.test.ts`, which lands with trails#9742. `app helper method` was left out because an extended `Integration::Session` could not reach its url_helpers' route set. trails#9753 fixed that: one `@_routes` slot (`packages/actionpack/src/action-dispatch/routing/url-for.ts` `_routesIvar`).

## Acceptance criteria

- [ ] `it("app helper method")` in `packages/trailties/src/application/console.test.ts` draws the `foo` route on the stubbed application's `RouteSet`, then calls `spawnConsole("-e development")` and `writePrompt("(await app()).fooPath()", "/foo")`, matching the Rails test's `spawn_console` plus `write_prompt` assertions.
- [ ] `pnpm parity:test:assertions` stays OK.
