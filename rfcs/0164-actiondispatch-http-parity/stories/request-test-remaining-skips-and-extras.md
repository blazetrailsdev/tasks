---
title: "request-test-remaining-skips-and-extras"
status: claimed
updated: 2026-10-15
rfc: "0164-actiondispatch-http-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-10-15T00:51:08Z"
assignee: "request-test-remaining-skips-and-extras"
blocked-by: null
closed-reason: null
---

# Finish request_test.rb: the last 7 skips and the 30 trails-only tests

## Context

`port-request-test-skips` ported 21 of the 28 skip stubs in
`packages/actionpack/src/action-dispatch/dispatch/request.test.ts`
(`vendor/rails/v8.0.2/actionpack/test/dispatch/request_test.rb`). It ran out of
LOC before these:

- `RequestRewind` "body should be rewound" (`request_test.rb:653`): Rails gates
  the class on `Rack.release < "3"`; trails runs Rack 3, so the stub should be
  gated the same way (`it.skipIf`) rather than left a bare skip.
- `RequestMethod` "delegates to Object#method if an argument is passed"
  (`:826`): trails' `Request#method` is a getter, so `request.method(:POST)` has
  no TS form. Decide whether it's a permanent skip.
- `RequestParameters` "POST parameters containing invalid UTF8 character"
  (`:1129`): fails with "Invalid request parameters: URI malformed". Rack's
  private `unescape` in `packages/rack/src/query-parser.ts:297` is
  `decodeURIComponent`, which throws on `%81`. Rack's `Utils.unescape`
  (`URI.decode_www_form_component`) does not throw. Converge it onto
  `packages/rack/src/utils.ts` `unescape` / actionpack's
  `decodeFormComponent` byte semantics.
- "path parameters don't re-encode frozen strings" (`:1107`): this depends on
  whether the String is frozen (CLAUDE.md § "Ruby Strings are JS string
  primitives"). Port the assertions that still apply, and park the rest.
- "query/POST parameters specified as ASCII_8BIT encoded do not raise
  InvalidParameterError" (`:1146`, `:1156`): these need
  `stub(Request.Utils.CustomParamEncoder, "actionEncodingTemplate", ...)`.
- "we have access to the original exception" (`:1185`): compares `e.cause` and
  backtraces.

The file also holds about 30 `it`s with no Rails counterpart (the
RequestHeaderEnvAccess, RequestFilterParameters, RequestContentSecurityPolicy,
RequestControllerClass, RequestParametersList and RequestPermissionsPolicy
describes, plus extras inside the matched describes). Several existing matched
tests are also simplified bodies rather than Rails' bodies ("remote ip", "remote
ip v6", "domains", …). They should use the `stubRequest` helper the file now
has.

## Acceptance criteria

- The 7 stubs above are real tests, or gated/parked with a citation.
- The trails-only tests move to `request.trails.test.ts`, or are deleted where
  they duplicate a Rails test.
- The file reports 121/121 with 0 extra.
