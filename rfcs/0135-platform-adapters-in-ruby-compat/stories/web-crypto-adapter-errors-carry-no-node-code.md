---
title: "The Web Crypto adapter's errors carry no Node error code"
status: claimed
updated: 2026-09-06
rfc: "0135-platform-adapters-in-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: 42
pr: null
claim: "2026-09-06T19:04:29Z"
assignee: "actionpack-uploaded-file-holds-a-path-not-a-tempfile"
blocked-by: null
closed-reason: null
---

# The Web Crypto adapter's errors carry no Node error `code`

## Context

PR #7547 (RFC 0113 `crypto-adapter-seam-has-no-browser-arm`) matched Node's
`timingSafeEqual` length-mismatch behaviour in the browser arm: the `web`
adapter in `packages/ruby-compat/src/crypto-adapter.ts` throws
`new RangeError("Input buffers must have the same byte length")`, the exact
constructor and message text Node's native binding raises (verified in review
against a live Node process).

Node's own error additionally carries `code:
"ERR_CRYPTO_TIMING_SAFE_EQUAL_LENGTH"`. The `web` adapter's does not, so a
caller that branches on `err.code` — the ordinary Node idiom — sees `undefined`
under the browser arm where it sees the code under the `node` arm. The two
adapters are otherwise interchangeable after #7547.

The same gap applies to any future error the `web` adapter raises where Node's
counterpart carries a `code`; `crypto-adapter.ts` has no precedent for setting
one anywhere today, which is why #7547 left it.

## Converged shape

Set `code` on the errors the `web` adapter raises wherever the Node counterpart
sets one, starting with `ERR_CRYPTO_TIMING_SAFE_EQUAL_LENGTH`. There is no Rails
body here (seam infrastructure — Ruby resolves `require "openssl"` at load
time); the fidelity target is Node's `crypto` surface, which the `node` adapter
mirrors by delegation and the `web` adapter mirrors by hand.

Audit the other members the `web` adapter implements (`randomBytes`,
`randomUUID`, `pbkdf2`) for Node errors with codes reachable through the same
arguments, rather than fixing only the one member review happened to notice.

## Acceptance criteria

- [ ] The `web` adapter's length-mismatch `RangeError` carries
      `code === "ERR_CRYPTO_TIMING_SAFE_EQUAL_LENGTH"`.
- [ ] A test asserts the `code` alongside the constructor and message, in the
      existing browser end-to-end subprocess test in
      `crypto-adapter.trails.test.ts`.
- [ ] Any other `web`-adapter member whose Node counterpart raises a coded error
      for the same arguments carries the same code, or the audit's finding of
      none is recorded in the story close.
