---
title: "converge-metal-to-a-to-read-the-response"
status: draft
updated: 2026-08-31
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `ActionController::Metal#to_a` is one line — `response.to_a`
(`actionpack/lib/action_controller/metal.rb:280-282`) — so everything a
controller writes onto its `ActionDispatch::Response` (status, headers, body)
is what the Rack triple carries.

trails' counterpart, `Metal#toRackResponse`
(`packages/actionpack/src/action-controller/metal.ts:299-304`), instead reads
the controller's own mirror fields:

```ts
toRackResponse(): RackResponse {
  const headers = { ...this._headers };
  if (this._contentType) headers["content-type"] = this._contentType;
  return [this._status, headers, bodyFromString(this.body)];
}
```

`this.response` is never consulted. A controller action that writes through the
Response — `this.response.status = 200`,
`this.response.setHeader("content-type", ...)`, `this.response.body = ...` —
produces a triple with none of those values. Rails returns them.

Surfaced by PR #7286 (`converge-routeset-setdispatcher-to-per-route-dispatcher`),
which routed `RouteSet#call` through `Dispatcher#dispatch` and so through
`toRackResponse` for the first time: the boot-app and website sandbox
controllers that wrote to `this.response` silently lost their status,
content-type and body. The website test at
`packages/website/src/lib/frontiers/app-server.test.ts` ("dispatches to a
registered controller") was moved onto the `this.body` / `this.status` /
`this.contentType` mirror seam to land that PR; it should move back once
`toRackResponse` reads the Response.

Note the name: Rails calls this `to_a`, and `Dispatcher#dispatch`
(`route_set.rb:65-67`) reaches it through `Metal.dispatch`
(`metal.rb:331-337`), whose port is story
`port-metal-dispatch-class-method`. Sequencing the two together is
reasonable.

## Acceptance criteria

- `Metal#toRackResponse` returns `this.response`'s status, headers and body,
  mirroring `metal.rb:280-282`, rather than reading `_status` / `_headers` /
  `_contentType` / `body`.
- A controller that writes only through `this.response` and one that writes
  only through the `this.status` / `this.contentType` / `this.body` setters
  both produce the same triple (the setters already write through to the
  Response, or are made to).
- `packages/website/src/lib/frontiers/app-server.test.ts`'s
  "dispatches to a registered controller" controller is restored to writing
  through `this.response`.
- `pnpm parity:api:calls` shows `to_a` reaching `response`.
