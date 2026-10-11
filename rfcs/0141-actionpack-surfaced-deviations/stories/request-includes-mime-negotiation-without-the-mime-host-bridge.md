---
title: "Request includes MimeNegotiation's methods directly; the mimeHost bridge and forwarders go"
status: draft
updated: 2026-10-11
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
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

`ActionDispatch::Request` does `include ActionDispatch::Http::MimeNegotiation`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/http/request.rb:27`), so the module's
methods (`mime_negotiation.rb:24-196`) run with the request as `self`.

trails#8795 made `Request` `include()` the module so its `included` block seats
`ignore_accept_header`, but every method is still reached through a bridge:
`packages/actionpack/src/action-dispatch/http/request.ts` keeps a `mimeHost(req)` helper that
builds an `Object.create(MimeNegotiation.prototype, ...)` stand-in (with forwarded `getHeader`,
`setHeader`, `fetchHeader`, `parameters`, `accept`, `xhr` and now `constructor`), a
`MIME_HOSTS` WeakMap, and hand-written `format` / `formats` / `variant` accessors plus
`Request.prototype.x = function () { return _x.call(mimeHost(this)) }` forwarders for
`contentMimeType`, `accepts`, `hasContentType`, `negotiateMime`, `shouldApplyVaryHeader`,
`validAcceptHeader`, `useAcceptHeader`, `formatFromPathExtension`, `paramsReadable`.
`mime-negotiation.ts` in turn splits the module into a class holding three setters and free
`this`-typed functions.

## Acceptance criteria

- `MimeNegotiation` is one module whose methods `include(Request, MimeNegotiation)` installs,
  running with the request as `this`.
- `mimeHost`, `MIME_HOSTS` and the per-method forwarders in `request.ts` are deleted;
  `useAcceptHeader` reads `this.constructor.ignoreAcceptHeader` on the request itself
  (`mime_negotiation.rb:176`).
- `parity:api:extra --package actiondispatch` shows no new extra surface; the
  `request.trails.test.ts` "Request include MimeNegotiation" tests still pass.
