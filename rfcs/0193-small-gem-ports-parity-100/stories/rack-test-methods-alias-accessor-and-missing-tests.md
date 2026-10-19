---
title: "rack-test-methods-alias-accessor-and-missing-tests"
status: draft
updated: 2026-10-19
rfc: "0193-small-gem-ports-parity-100"
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

Left over from `rack-test-parity-residual`. Done there: the `cookie-jar.json`
shard (`CookieJar#for` now builds `buf` with `rbStrSNew`), and the
`cookie_jar merge` / `test.rb request` / `env_for` naming rows.

- `methods.rb` 22/25. `alias rack_mock_session rack_test_session`
  (`vendor/rack-test/v2.2.0/lib/rack/test/methods.rb:37`) is
  `const rackMockSession = rackTestSession` in `packages/rack-test/src/methods.ts`;
  the extractor credits `defineModule` members through same-file function
  declarations (`scripts/api-compare/extract-ts-api.ts` exports loop ~1300 and
  `harvestObjectLiteralMethods` ~3976), so neither the const nor
  `rackMockSession: rackTestSession` is credited. `attr_accessor
:_rack_test_current_session` (`:90-91`) is only a `MethodsHost` declaration.
- `process_request` naming row (`rackBody` vs `body`, `test.rb:357-371`):
  passing the app body straight to `MockResponse` (as rack's MockRequest does)
  reds `test.test.ts` / `cookie.test.ts` with "this.\_body is not iterable",
  because the test app answers an async-iterable body. Needs the async-body
  answer from CLAUDE.md § "`$!` is passed explicitly, and a response body is
  iterated async".
- Four missing `test_spec.rb` tests (MockSession alias, Rack::Response body,
  two close-body tests) and `uploaded_file_spec.rb`'s one skip.
- Pins 64/67.

## Acceptance criteria

- [ ] rack-test 108/108 methods, 234/234 tests, 0 unpinned.
- [ ] 0 rack-test rows in either mismatch output.
