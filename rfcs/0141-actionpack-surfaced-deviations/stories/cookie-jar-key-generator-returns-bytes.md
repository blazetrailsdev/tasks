---
title: "Cookie jar key generator types generateKey as Bytes; drop the cookie-store test cast"
status: draft
updated: 2026-11-23
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 10
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10581 widened `MessageEncryptor`'s constructor (`packages/activesupport/lib/message-encryptor.ts`) to take
`string | Uint8Array` secrets, because `KeyGenerator#generateKey` returns `Bytes` (a `Uint8Array`). Two actionpack sites
still assume the older `Buffer` typing:

- `packages/actionpack/lib/action-dispatch/middleware/cookies.ts:689` declares the request key generator's
  `generateKey(salt, keySize?)` as returning `Buffer | string`. ActiveSupport's `KeyGenerator#generate_key`
  (`vendor/rails/v8.0.5.2/activesupport/lib/active_support/key_generator.rb`) answers a binary String, which trails
  spells as `Bytes`.
- `packages/actionpack/test/action-dispatch/dispatch/session/cookie-store.test.ts:52` passes
  `Generator.generateKey(SessionSalt, 32) as never` into `new MessageEncryptor(...)`. Rails passes the key straight in
  (`actionpack/test/dispatch/session/cookie_store_test.rb`).

## Acceptance criteria

- [ ] The interface at `cookies.ts:689` returns `Bytes`, the type of ActiveSupport's `KeyGenerator#generateKey`.
- [ ] The `as never` cast in `cookie-store.test.ts:52` is removed.
- [ ] Typecheck stays green.
