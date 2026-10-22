---
title: "Request still forwards MimeNegotiation methods through hand-written prototype assignments"
status: ready
updated: 2026-10-19
rfc: "0141-actionpack-surfaced-deviations"
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

`ActionDispatch::Request` does `include ActionDispatch::Http::MimeNegotiation`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/http/request.rb:27`), so the module's
methods (`mime_negotiation.rb:24-196`) run with the request as `self`.

The `mimeHost(req)` bridge and its `MIME_HOSTS` WeakMap are gone, and `Request` does
`include(Request, _MimeNegotiation)` (`packages/actionpack/src/action-dispatch/http/request.ts:787`).
But `request.ts` still assigns hand-written forwarders after the include:
`Request.prototype.hasContentType`, `negotiateMime`, `shouldApplyVaryHeader` (`:890-896`),
`validAcceptHeader`, `useAcceptHeader`, `formatFromPathExtension` (`:942-948`), and the
module in `mime-negotiation.ts` is still a class holding setters plus free `this`-typed
functions.

## Acceptance criteria

- `MimeNegotiation` is one module whose methods `include(Request, MimeNegotiation)` installs,
  running with the request as `this`.
- The `Request.prototype.<x> = function …` forwarders in `request.ts` are deleted;
  `useAcceptHeader` reads `this.constructor.ignoreAcceptHeader` on the request itself
  (`mime_negotiation.rb:176`).
- `parity:api:extra --package actiondispatch` shows no new extra surface; the
  `request.trails.test.ts` "Request include MimeNegotiation" tests still pass.
