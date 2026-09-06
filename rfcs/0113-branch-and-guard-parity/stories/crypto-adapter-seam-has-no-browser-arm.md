---
title: "The CryptoAdapter seam has no browser arm"
status: claimed
updated: 2026-09-06
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: 32
pr: null
claim: "2026-09-06T00:55:36Z"
assignee: "crypto-adapter-seam-has-no-browser-arm"
blocked-by: null
closed-reason: null
---

# The `CryptoAdapter` seam has no browser arm

## Context

Surfaced in PR #7272 (RFC 0113
`get-crypto-sync-auto-registration-has-no-esm-arm`) when the user asked whether
the seam can serve a browser as well as Node.

That PR gave `tryAutoRegisterNode()` a synchronous ESM arm via
`globalThis.process.getBuiltinModule?.("node:crypto")`
(`packages/activesupport/src/crypto-adapter.ts:289-296`). That arm is
browser-neutral — the pre-existing guard at :283
(`typeof globalThis.process === "undefined" || !globalThis.process.versions?.node`)
returns `false` first — and it is in fact the only arm of the three naming no
module specifier, so it is the friendliest to a browser bundle (`require("node:module")`
at :299 and `import("node:crypto")` in `tryAutoRegisterNodeAsync()` at :338 both
need a bundler shim for a browser target).

What the same PR _did_ change for a browser: `Instrumenter#uniqueId`
(`notifications/instrumenter.ts:296-298`) previously wrapped the seam in a
`try/catch` falling back to `crypto.getRandomValues`, which browsers have. That
fallback was removed on fidelity grounds — `SecureRandom.hex(10)` at
`vendor/rails/activesupport/lib/active_support/notifications/instrumenter.rb:100-102`
has no fallback arm — and it was the last `getRandomValues` in the package. So
constructing an `Instrumenter` in a browser with no adapter registered now
throws `No crypto adapter configured` where it used to work.

Registering a browser adapter through the existing seam
(`registerCryptoAdapter()` / `cryptoAdapterConfig.adapter`) is the intended
answer, but a Web Crypto adapter cannot be a _complete_ one, which is why PR
PR #7272 deliberately did not register one:

- Web Crypto serves `randomBytes` (`crypto.getRandomValues`) and `randomUUID`
  (`crypto.randomUUID`).
- It has no synchronous digest: `crypto.subtle.digest` is a Promise, while
  `CryptoAdapter#createHash` / `#createHmac` return a synchronous
  `HashAdapter` / `HmacAdapter` whose `digest()` returns a value
  (`crypto-adapter.ts:193-203`).
- It has no `createCipheriv` / `createDecipheriv` analogue of the streaming,
  synchronous `update()`/`final()` shape the `Cipher` class drives
  (`crypto-adapter.ts:156-167`).

Registering a partial adapter would turn a clear "not configured" error into
`createHash is not a function` deeper in `digest.ts` / `message-encryptor.ts` /
`security-utils.ts` / `secure-password.ts`.

A second, independent browser blocker in the same interface: every
`CryptoAdapter` member is typed in terms of Node's `Buffer` —
`randomBytes(size: number): Buffer`, `HashAdapter#digest(): Buffer`,
`pbkdf2Sync(...): Buffer` — so a browser host needs a `Buffer` shim before it
can even satisfy the type.

## Converged shape

This is seam infrastructure with no Rails counterpart (Ruby resolves
`require "openssl"` / `SecureRandom` at load time and needs no registry), so
there is no Ruby body to mirror — the fidelity constraint here is only that
call sites keep reaching the seam unconditionally, exactly as their Ruby
counterparts call `SecureRandom` / `OpenSSL` unconditionally.

Decide and record, in one place rather than per call site:

1. Whether the browser is a supported target for `activesupport` at all. If it
   is not, say so at the seam and close this story — the current behavior
   (a clear throw) is then already correct.
2. If it is: whether the randomness-only subset is a _declarable_ partial
   adapter — a registered adapter that answers `randomBytes` / `randomUUID`
   and throws a seam-level "this adapter does not implement createHash"
   error naming the missing member, instead of the bare
   `createHash is not a function` a partial object produces today.
3. Whether `Buffer` stays in the interface or the seam narrows to
   `Uint8Array` with `Buffer` as a Node-adapter detail.

Do NOT reinstate the `try/catch` fallback in `Instrumenter#uniqueId` — it
papers over one call site while the other sync `getCrypto()` callers
(`digest.ts`, `message-encryptor.ts`, `security-utils.ts`,
`secure-password.ts`, `core-ext/securerandom.ts`, `digest/uuid.ts`) still
throw, and Rails' body has no such arm.

## Acceptance criteria

- [ ] The seam states whether a browser is a supported host, and what a browser
      host must register before the first sync `getCrypto()` call.
- [ ] A partial adapter fails with a seam-level error naming the unimplemented
      member, not `createHash is not a function`.
- [ ] `Instrumenter#uniqueId` still reaches the seam unconditionally
      (`instrumenter.rb:100-102`); no per-call-site fallback is reintroduced.
