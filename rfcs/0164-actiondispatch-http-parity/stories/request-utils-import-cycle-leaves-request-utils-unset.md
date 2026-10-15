---
title: "request-utils-import-cycle-leaves-request-utils-unset"
status: done
updated: 2026-10-15
rfc: "0164-actiondispatch-http-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8920
claim: "2026-10-14T23:53:08Z"
assignee: "port-request-test-skips"
blocked-by: null
closed-reason: null
---

## Context

`packages/actionpack/src/action-dispatch/http/request.ts` and
`packages/actionpack/src/action-dispatch/request/utils.ts` import each other:

- `request.ts:66` imports `{ CustomParamEncoder, RequestUtils }` from
  `../request/utils.js` and seats it eagerly as a class field,
  `static Utils = RequestUtils` (`request.ts:205`).
- `utils.ts:4` imports `{ MissingController }` from `../http/request.js` for the
  `rescue MissingController` arm of `CustomParamEncoder.actionEncodingTemplate`
  (`utils.ts:131`).

When a module graph enters the cycle at `utils.ts` first, `request.ts` evaluates
while `RequestUtils` is still unbound. `Request.Utils` is then `undefined` for the
life of the process, and `Parameters#pathParameters=`
(`http/parameters.ts:85`, `ActionDispatch.Request.Utils.setBinaryEncoding(...)`)
throws `Cannot read properties of undefined (reading 'setBinaryEncoding')` on
every routed request. Surfaced in trails#8909: a test whose only `Request` import
was unused (the transform dropped it) and which imported `RequestUtils` directly
got a 500 on every integration request. The test was fixed by reading
`Request.Utils`, but the source cycle remains.

Rails has no load-order dependency here. `Request::Utils` is autoloaded at
call time (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/http/request.rb:32`,
`autoload :Utils, "action_dispatch/request/utils"`), and `utils.rb` names
`MissingController` only inside the method body
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/request/utils.rb:109`).

## Acceptance criteria

- `Request::Utils` is resolved at call time through the sanctioned
  `ActiveSupport::Autoload` namespace seat (CLAUDE.md § "Call-time constant
  resolution"): `utils.ts` seats it with `rbModConstSet`, mirroring
  `request.rb:32`, and `request.ts` no longer captures it in an eager
  `static Utils = RequestUtils` initializer.
- `utils.ts` reaches `MissingController` without an eager edge back into
  `request.ts` (call-time read, as `utils.rb:109` does).
- Verified with plain-node imports of the built `dist/` modules, entering at
  `request/utils.js` first and at `http/request.js` first. Both leave
  `Request.Utils.setBinaryEncoding` callable. A vitest run alone does not prove
  this.
