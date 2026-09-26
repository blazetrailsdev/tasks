---
title: "journey-verb-matchers-call-request-predicates"
status: draft
updated: 2026-09-26
rfc: "0139-actiondispatch-journey-parity"
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

Rails' per-verb matcher classes answer `self.call(req)` with the request
predicate: `def self.call(req); req.#{v.downcase}?; end`
(`actionpack/lib/action_dispatch/journey/route.rb:16-23`), i.e. `req.get?`,
`req.head?`, … — Rack's `Request::Helpers` predicates.

trails' `VerbMatchers.GET.call` etc.
(`packages/actionpack/src/action-dispatch/journey/route.ts`, the `VerbMatchers`
object) compares `req.requestMethod === "GET"` instead, because `VerbRequest`
only carries `requestMethod`. The predicates exist on `@blazetrails/rack`'s
`Request` (`packages/rack/src/request.ts`, `isGet` … `isUnlink`), but several
producers of a router request build plain object literals with no predicates:
`journeyRecognize` (`packages/actionpack/src/action-dispatch/routing/journey-bridge.ts`),
`Routing::Route#matchVerb` (`routing/route.ts`, `{ requestMethod }`), and the
`req()` helpers in `journey/router.trails.test.ts`. `Router#matchHeadRoutes`
also mutates `requestMethod`, which the predicates must observe.

## Acceptance criteria

- `VerbRequest` declares the ten `isX()` predicates and each verb class's
  `call` is `req.isGet()` etc., matching `route.rb:16-23`.
- Every producer of a router request passes an object answering the
  predicates (a real `ActionDispatch::Request` where Rails has one).
- `pnpm parity:api:calls` / `:args` stay green with no new baseline row.
