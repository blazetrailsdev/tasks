---
title: "buffer-from-wrappers-obscure-the-rails-bodies-at-crypto-call-sites"
status: ready
updated: 2026-09-04
rfc: "0135-platform-adapters-in-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: 28
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`move-crypto-adapter-into-ruby-compat` (#7460) moved the crypto adapter into the
leaf package, where `Buffer` does not exist: `packages/ruby-compat/tsconfig.json`
sets `types: []`, so the adapter's byte-string type is `Bytes`
(`packages/ruby-compat/src/fs-adapter.ts:13`) — a `Uint8Array` with Ruby's
`String#to_s(encoding)` half — the same contract the fs move settled.

Call sites in packages that DO have `@types/node` now wrap the returned bytes to
get a `Buffer` back, and every wrapper sits inside a body that otherwise mirrors
Rails line for line:

- `packages/activerecord/src/encryption/cipher/aes256-gcm.ts:56-61,86-90,110,119`
  — Rails' `Aes256Gcm#encrypt` is
  `encrypted_data << cipher.update(clear_text)` / `encrypted_data << cipher.final`
  (`activerecord/lib/active_record/encryption/cipher/aes256_gcm.rb:22-24`), with
  no wrapper around either call.
- `packages/actionpack/src/action-controller/metal/request-forgery-protection.ts:407,452,474`
  — Rails is `SecureRandom.random_bytes(AUTHENTICITY_TOKEN_LENGTH)` and
  `OpenSSL::HMAC.digest(...)[0, AUTHENTICITY_TOKEN_LENGTH]`
  (`actionpack/lib/action_controller/metal/request_forgery_protection.rb:657,466`).
- `packages/actionpack/src/action-dispatch/request-forgery-protection.ts:80,99,146`
- `packages/activesupport/src/message-encryptor.ts:147,153,157`,
  `packages/activesupport/src/key-generator.ts:58`,
  `packages/activesupport/src/tempfile.ts:21`, plus the four `*.test.ts` secrets.

Each wrapper also copies the bytes, which the Ruby does not.

## Acceptance criteria

- The Rails-mirroring bodies above read as the Ruby again: no `Buffer.from(...)`
  standing between a Rails call and its argument or result.
- The convergence is a type change at the boundary, not a cast: the locals,
  fields and signatures that hold adapter output are typed for the bytes the
  adapter returns (`Bytes`), and `Buffer` stays only where a caller genuinely
  needs a Node-only method (`readUInt32LE`, `copy`, `Buffer.concat`) — and there
  the wrapper sits at that call, not at the Rails one.
- No new `@noRailsEquivalent` receipts; `pnpm parity:api:extra:gate`,
  `parity:api:calls` and `parity:api:calls:args` stay green.
