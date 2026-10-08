---
title: "ruby-compat: HttpServer has no closeAllConnections, so a server with an unanswered request cannot be torn down"
status: draft
updated: 2026-10-08
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found building trailmap#45. `HttpServer` in `packages/ruby-compat/src/http-adapter.ts:33` declares
`listen`, `close`, `address` and `on("upgrade")` only. A test that stands up a stub server through
`getHttpAsync()` and deliberately leaves a request unanswered (to exercise a client timeout) cannot
tear it down: `close()` waits for open connections, and `closeAllConnections()` is not on the type.

```text
test/controllers/fleet-controller.test.ts(81,9): error TS2339:
  Property 'closeAllConnections' does not exist on type 'HttpServer'.
```

trailmap's test works around it by keeping each hung response and ending it in `afterEach`
(`test/controllers/fleet-controller.test.ts`, the `hung` array).

## Expected shape

`HttpServer` exposes a way to drop open connections — `closeAllConnections(): void`, as Node's
`http.Server` has — implemented by each registered adapter.

## Acceptance criteria

- `HttpServer` declares it and the node adapter implements it; any other adapter does too or says
  why it cannot.
- A ruby-compat test closes a server that has an unanswered request without hanging.
