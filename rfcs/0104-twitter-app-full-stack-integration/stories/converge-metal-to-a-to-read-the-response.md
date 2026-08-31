---
title: "converge-metal-to-a-to-read-the-response"
status: draft
updated: 2026-08-31
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
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

### Measured blast radius (PR #7286 review)

Every mirror setter on `Metal` writes to its own field and **none writes
through to `this.response`** — verified in
`packages/actionpack/src/action-controller/metal.ts`:

| setter             | writes                                  | `response` updated |
| ------------------ | --------------------------------------- | ------------------ |
| `set status`       | `_status`                               | no                 |
| `setHeader`        | `_headers`                              | no                 |
| `set contentType`  | `_contentType`                          | no                 |
| `set body`         | `_responseBody`                         | no                 |
| `set responseBody` | `_responseBody` **and** `this.response` | yes                |

So the divergence is total in one direction: a controller that writes through
`this.response.status` / `.setHeader` / `.body` — the shape Rails documents,
since Rails' `to_a` reads exactly there — produces
`[200, {}, ""]`, losing everything it set. A controller that writes through the
mirror setters or `render` produces the right triple. Observed live: the
sandbox controller in
`packages/website/src/lib/frontiers/app-server.test.ts` set
`this.response.status` / `.setHeader` / `.body` and came back with no
content-type and an empty body once dispatch was routed through
`toRackResponse`; PR #7286 moved it onto the mirror setters to land.

This is **not new exposure from PR #7286**: the deleted
`routing/dispatcher.ts#dispatch` helper it replaced already ended in
`instance.toRackResponse()`, so railties' boot path went through the same call
before. What that PR changed is that `RouteSet#call` no longer has a
non-controller default response, so more callers now reach it.

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
