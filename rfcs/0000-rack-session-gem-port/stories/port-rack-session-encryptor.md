---
title: "Port Rack::Session::Encryptor against the vendored encryptor.rb"
status: draft
updated: 2026-08-31
rfc: "0000-rack-session-gem-port"
cluster: null
packages: ["rack-session"]
deps: ["enroll-rack-session-in-compare-tooling"]
deps-rfc: []
est-loc: 450
priority: 6
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rack-session/lib/rack/session/encryptor.rb` is 192 lines and 4 classes
(`Encryptor`, `Encryptor::Error`, `InvalidSignature`, `InvalidMessage`), 3
public methods by this repo's extractor. Its spec,
`spec_session_encryptor.rb`, is **16 tests**.

This story runs **in parallel with**
`relocate-rack-session-scaffolding-out-of-actionpack`: `Encryptor` subclasses
nothing that moves and `encryptor.rb` requires only `base64`, `openssl`,
`securerandom`, `zlib` and `rack/utils` (`:7-12`) — no `abstract/id.rb`. It
depends only on the tooling enrollment.

Everything it needs already exists in the workspace, verified before filing:

- AES-256-CTR (`encryptor.rb:130`), `OpenSSL::HMAC` SHA256 (`:140`, `:155`) and
  `SecureRandom.random_bytes` (`:134`, `:175`) → `getCrypto()` /
  `packages/activesupport/src/crypto-adapter.ts`, the same seam
  `message-encryptor.ts` and `message-verifier.ts` use.
- `zlib` → already imported directly by `packages/rack/src/deflater.ts:1`.
- `Rack::Utils` → `packages/rack/src/utils.ts`, and `rack-session` already
  depends on `@blazetrails/rack`.

The one genuine gap is **Ruby `Marshal`**, which is `Encryptor`'s default
serializer. `packages/activesupport/src/messages/serializer-with-fallback.ts:11`
records the standing repo decision — *"trails has no Ruby Marshal runtime, so
the `:marshal` format is backed by the JSON serializer"* — with the affected
Rails files registered in `scripts/api-compare/unported-files.ts`. Follow that
precedent exactly; do not reverse it, and do not invent a second Marshal shim.
Two of the 16 tests assert on the binary format directly
(`spec_session_encryptor.rb:106` — `Marshal.dump('').bytesize`; `:148` —
`Marshal.load` raising `TypeError`) and are the ones that cannot pass.

Do not rename or reword a test name; `parity:test` matches on names.

## Acceptance criteria

- `Rack::Session::Encryptor` and its three error classes live in
  `packages/rack-session/src/encryptor.ts`, each member carrying a resolving
  `vendor/rack-session/lib/rack/session/encryptor.rb:LINE` citation.
- Crypto goes through `getCrypto()` / the activesupport crypto adapter, not a
  direct `node:crypto` import.
- The `Marshal` serializer follows the `serializer-with-fallback.ts` decision
  and cites it; no new Marshal implementation is added.
- `pnpm parity:api` for `rack-session` improves by the 3 public methods;
  `parity:api:extra --package rack-session` reports no name the gem does not
  define; `parity:api:calls` / `:calls:args` / `:params` add no rows.
- Every other package's deltas are non-negative.

## Notes

Test enrollment for this file is `enroll-rack-session-test-suite`, which owns
the `PERMANENT-SKIP` line for the two wire-format tests. Port the bodies here
so that story has something to credit.
