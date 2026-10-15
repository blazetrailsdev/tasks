---
title: "Converge Server, start_application and served_by onto an in-process Vite dev server"
status: draft
updated: 2026-10-15
rfc: "0166-actiondispatch-system-testing-parity"
cluster: null
packages: ["actionpack"]
deps: ["ratify-vitest-native-system-testing-section"]
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/system_testing/server.rb`
(`:5-29`) selects Puma as the app server and always includes the port;
`SystemTestCase.start_application` (`system_test_case.rb:128-136`) mounts
`Rails.application` under `map "/"` and calls `Server.new.run`;
`served_by(host:, port:)` (`:166-169`) sets the server host and port. trails'
`server.ts` takes `(app, callback)` on a private `setServer`, moved `host`,
`port`, `stop` onto the class, and `start_application` takes `app`.

Under RFC 0166 the app is served by an in-process Vite dev server in the same
Vitest worker as the test, so the test's fixture transaction is visible to
the requests the browser makes (Rails gets this from Puma threads sharing the
connection). Vite also serves the app's assets from source, as
`packages/trailties/src/server/vite-plugin.ts` does in development.

## Acceptance criteria

- `Server#run` / `setup` / `set_server` / `set_port` keep Rails' names, order
  and arity (none take arguments). `set_server` creates the Vite dev server
  only when none was configured, with `logLevel: "silent"` when
  `Server.silence_puma` is true; `set_port` makes the resolved URL always
  carry its port.
- `start_application()` takes no argument and mounts the application under
  `"/"` with `Rack::Builder#map` before running the server.
- `served_by({ host, port })` writes Vite's `server.host` / `server.port`.
- The moved `host` / `port` / `stop` go; server shutdown runs from a Vitest
  `afterAll` registered by `start_application`, receipted against the ratified
  section.
- `vite` is an optional peer dependency of actionpack.
- The rows fixed in `system-testing/server.json` are deleted.
