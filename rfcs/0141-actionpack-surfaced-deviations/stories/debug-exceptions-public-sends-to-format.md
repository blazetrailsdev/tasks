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

trails (`packages/actionpack/src/action-dispatch/middleware/debug-exceptions.ts:71-79`)
looks the name up in activesupport's invented `HASH_CONVERSIONS` table instead.
trails#9085 defined `Hash#toXml` / `Hash#toJson` on `Hash` with
`rbModDefineMethod`, and converged `PublicExceptions#render` onto
`rbObjRespondTo` / `rbFPublicSend`. The same shape now works here.

## Acceptance criteria

- `renderForApiRequest` mirrors `debug_exceptions.rb:103-106`, using `rbObjRespondTo` and `rbFPublicSend`.
- `HASH_CONVERSIONS` (`activesupport/src/hash-utils.ts`) and its `debug-exceptions.trails.test.ts` use are removed once nothing reads them.
- The Action Pack lane is green.
