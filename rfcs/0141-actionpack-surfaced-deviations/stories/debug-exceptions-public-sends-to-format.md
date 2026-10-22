---
title: "DebugExceptions#render_for_api_request public_sends to_<format> instead of reading HASH_CONVERSIONS"
status: ready
updated: 2026-10-19
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `DebugExceptions#render_for_api_request`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/middleware/debug_exceptions.rb:103-106`)
builds `to_format = "to_#{content_type.to_sym}"`, then calls
`body.public_send(to_format)` when `content_type && body.respond_to?(to_format)`.

trails (`packages/actionpack/src/action-dispatch/middleware/debug-exceptions.ts:75-79`)
looks the name up in activesupport's invented `HASH_CONVERSIONS` table instead.
trails#9085 defined `Hash#toXml` / `Hash#toJson` with `rbModDefineMethod` and converged
`PublicExceptions#render` onto `rbObjRespondTo` / `rbFPublicSend`
(`public-exceptions.ts:47-48`), the same Rails shape.

The dispatched name is built from the request's Mime type, and `Mime::Type.register` adds
types at run time (`mime_type.rb:186-193`), so the set is open: this is CLAUDE.md § "A
dispatch by name is spelled directly"'s third arm, and `rbFPublicSend` is the port here, as
it is in `PublicExceptions#render`.

## Acceptance criteria

- `renderForApiRequest` mirrors `debug_exceptions.rb:103-106`, using `rbObjRespondTo` and
  `rbFPublicSend`, as `PublicExceptions#render` does.
- `HASH_CONVERSIONS` (`activesupport/src/hash-utils.ts`) and its uses are removed once nothing reads them.
- The Action Pack lane is green.
