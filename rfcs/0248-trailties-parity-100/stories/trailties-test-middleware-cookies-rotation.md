---
title: "trailties-test-middleware-cookies-rotation"
status: done
updated: 2026-11-23
rfc: "0248-trailties-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10581
claim: "2026-11-22T17:04:31Z"
assignee: "generated-attribute-valid-type-leases-connection"
blocked-by: null
closed-reason: null
---

## Context

Split from `trailties-test-middleware-cache-cookies-static-logger` (trails#10521) to keep that PR under the LOC ceiling. Still Miss: the four rotation tests in
`vendor/rails/v8.0.2/railties/test/application/middleware/cookies_test.rb`:

- `signed cookies with SHA512 digest and marshal serializer and rotated out SHA256 and SHA1 digests` (:54)
- `signed cookies with SHA512 digest and JSON serializer and rotated out SHA256 and SHA1 digests` (:124)
- `encrypted cookies rotating multiple encryption keys` (:194)
- `encrypted cookies rotating multiple encryption keys with cookies serializer as json` (:265)

A working, passing port exists in trails commit `3024b0091dcb74c9b0c81db561d0fd56da7b8b99`
(`packages/trailties/test/application/middleware/cookies.test.ts`). It needed no lib change. Notes:

- `ActiveSupport::MessageEncryptor.new(secret, cipher: ...)` is
  `new MessageEncryptor(secret, undefined, {...})`, because trails' constructor takes `signSecret` positionally.
- `::TestVerifiers` / `::TestEncryptors` are seated with `constSet(TopLevel, ...)` inside `addToConfig`, and removed in `afterEach`.

## Acceptance criteria

- [ ] The four tests are ported to `packages/trailties/test/application/middleware/cookies.test.ts` with their Rails names and bodies, and they pass.
- [ ] No assertion-count or assertion-kind mismatch for `cookies_test.rb` in `pnpm parity:test --assertions`.
