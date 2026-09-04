---
title: "Drop CryptoAdapter#randomUUID — no Ruby counterpart and no caller left"
status: draft
updated: 2026-09-04
rfc: "0135-platform-adapters-in-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`CryptoAdapter.randomUUID` (`packages/ruby-compat/src/crypto-adapter.ts:24`,
implemented at `wrapNodeCrypto` `:127` and declared on `NodeCrypto` `:88`) has
no caller left in ported code. PR 7492 converged the last three —
`ActionDispatch::RequestId#internal_request_id` (`request_id.rb:47`),
`ActiveRecord::Transaction#uuid` (`transaction.rb:126`) and
`Digest::UUID.uuid_v4` (`uuid.rb:53`) — onto `SecureRandom.uuid`, and
`SecureRandom.uuid` is now a port of `Random::Formatter#uuid`
(`vendor/ruby/lib/random/formatter.rb:170-175`) that builds the UUID from
`random_bytes(16)` rather than from a native primitive.

Nothing in Ruby corresponds to `randomUUID`: MRI has no such call, which is why
`Random::Formatter` hand-rolls the bytes. The member is a Node API on an
adapter interface whose other members each stand for a Ruby one
(`Random.urandom`, `OpenSSL::Digest`, `OpenSSL::HMAC`, `OpenSSL::Cipher`,
`OpenSSL::PKCS5`). The remaining `randomUUID` uses in the tree are test helpers
importing `node:crypto` directly and are unaffected.

Leaving it costs a member every custom adapter must implement for nothing, and
invites a future body to reach for the native primitive instead of the ported
`SecureRandom.uuid`.

## Acceptance criteria

- `randomUUID` is gone from `CryptoAdapter`, `NodeCrypto` and `wrapNodeCrypto`.
- Any adapter registered in the repo or the docs drops the member with it.
- `pnpm parity:api:extra:gate` stays green with ruby-compat pinned at novel 0,
  and its `total` is tightened if the removal lowers it.
