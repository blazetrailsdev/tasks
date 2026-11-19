---
title: "Port WebConsole::Middleware, Interceptor and the console helper"
status: draft
updated: 2026-11-19
rfc: "0250-web-console-gem-port"
cluster: port
packages: [web-console]
deps:
  [
    web-console-request-permissions,
    web-console-templates-view-injector,
    web-console-evaluator-session-exception-mapper,
  ]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`lib/web_console/middleware.rb`, `interceptor.rb` (the `DebugExceptions` hook,
against `packages/actionpack/lib/action-dispatch/middleware/debug-exceptions.ts`),
`extensions.rb` (`console`) and `errors.rb`. Tests: `middleware_test.rb`,
`interceptor_test.rb`, `integration_test.rb`.

## Acceptance criteria

- [ ] The classes are ported and their 29 tests pass.
