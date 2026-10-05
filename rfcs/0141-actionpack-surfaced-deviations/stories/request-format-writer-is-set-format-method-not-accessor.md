---
title: "Request#format= is a setFormat() method where Rails has a plain writer"
status: draft
updated: 2026-10-05
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

`ActionDispatch::Http::MimeNegotiation#format=`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/http/mime_negotiation.rb:115`)
is a plain synchronous writer, and Rails callers spell it `request.format = :xml`
(`actionpack/test/controller/mime/respond_to_test.rb:63,193,202`,
`actionpack/test/controller/mime/accept_format_test.rb:48`).

In trails `Request` (`packages/actionpack/src/action-dispatch/http/request.ts:362-367`)
exposes `get format()` and a separate `setFormat(extension)` method, so
`request.format = "xml"` throws `Cannot set property format of #<Request> which
has only a getter`. The sibling writers on the same class are real accessors:
`set formats` (`request.ts:371`, Rails `mime_negotiation.rb:135`) and
`set variant` (`request.ts:377`), and the mixin itself already declares
`set format` (`mime-negotiation.ts:43`). `setX()` is the settled spelling only
for a Ruby `x=` that must be awaited, and this one does no I/O, so `setFormat`
is invented surface rather than a language workaround.

Callers of `setFormat(` today live in 5 files, including the tests trails#8522
ported (`controller/mime/respond-to.test.ts`, `controller/mime/accept-format.test.ts`)
and `action-dispatch/http/mime-negotiation.test.ts:85`.

## Acceptance criteria

- `Request` has a `set format(extension)` accessor beside `get format`, with the
  body of `mime_negotiation.rb:115-120`, and `setFormat` is deleted.
- Every `setFormat(` call site is rewritten to `request.format = ...`.
- `pnpm parity:api:extra --package actionpack` no longer lists `setFormat`, and
  `parity:api:calls` stays green.
