---
title: "Rack status callers pass bare names, so status_code reads non-numeric Strings as Symbols"
status: draft
updated: 2026-09-30
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rack `Utils#status_code` (`vendor/rack/v3.1.14/lib/rack/utils.rb:589-605`) branches on
`status.is_a?(Symbol)`. Any other value takes `status.to_i`, so a non-numeric String such as
`"abc"` is 0.

trails#8255 ported that shape in `packages/rack/src/utils.ts` (`statusCode`) and spells the
Symbol arm with the CLAUDE.md `":name"` string. Every trails caller still passes a bare name,
though:

- `actionpack/src/action-dispatch/http/response.ts:231`
- `action-controller/renderer.ts:40`
- `action-controller/base.ts:454`
- `action-controller/metal/redirecting.ts:94,97`
- `action-controller/metal/rendering.ts:40`
- `action-controller/api.ts:51`
- `action-controller/metal/head.ts:29`
- `action-controller/test-case.ts:248`

Callers pass `"ok"` / `"not_found"`, so `statusCode` also reads a non-blank, non-numeric bare
String as a Symbol. A genuine String like `"abc"` therefore raises
`Unrecognized status code :abc`, where Rack returns 0. The deviation is stated in the
`statusCode` JSDoc.

## Acceptance criteria

- Every trails caller that means a Rack status Symbol passes the `":name"` spelling, e.g.
  `head(":ok")` / `status: ":not_found"` at the user-facing API. Where the public API
  documents bare names, it converts them at the boundary where Rails' Symbol literal would sit.
- `statusCode`'s Symbol arm is `isSymbol(status)` only. A non-numeric String takes `to_i`, so
  `statusCode("abc") === 0`, matching `utils.rb:602`.
- The JSDoc deviation note on `statusCode` is removed, and `rack/src/utils.trails.test.ts`
  asserts `statusCode("abc") === 0`.
