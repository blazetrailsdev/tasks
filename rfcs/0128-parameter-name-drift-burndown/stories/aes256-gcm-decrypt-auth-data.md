---
title: "aes256-gcm-decrypt-auth-data"
status: draft
updated: 2026-08-30
rfc: "0128-parameter-name-drift-burndown"
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

`Aes256Gcm#decrypt` (`vendor/rails/activerecord/lib/active_record/encryption/cipher/aes256_gcm.rb:65-77`)
sets `cipher.auth_data = ""` at `aes256_gcm.rb:72`, between `cipher.auth_tag =`
and the `update`/`final` pair:

```ruby
cipher.auth_tag = auth_tag
cipher.auth_data = ""
```

The trails port (`packages/activerecord/src/encryption/cipher/aes256-gcm.ts`)
has never made that call — confirmed against `origin/main` before PR #7235, and
still absent after it. `decrypt` now goes through the `Cipher` analogue in
`packages/activesupport/src/crypto-adapter.ts` (added by #7235, the
`OpenSSL::Cipher` stand-in), which has no `authData` concept either, so the
Ruby's `auth_data=` has nowhere to land.

Surfaced during review of PR #7235; out of scope for RFC 0128, which converged
the `generate_iv` parameter-name row only.

`Cipher` is the natural home for the missing setter: OpenSSL's `auth_data=` maps
to Node's `setAAD`, already declared (optional) on `CipherAdapter` /
implemented by the node adapter's cipher objects.

## Acceptance criteria

- `Cipher` in `packages/activesupport/src/crypto-adapter.ts` grows an
  `authData` setter mirroring `OpenSSL::Cipher#auth_data=`, routed to the
  adapter's `setAAD`.
- `Aes256Gcm#decrypt` calls it with `""` in Rails' position — after
  `cipher.authTag = ...`, before `update` (`aes256_gcm.rb:71-72`).
- Round-trips still pass: encrypt→decrypt, deterministic and non-deterministic,
  plus the existing encryption suite
  (`packages/activerecord/src/encryption/**`). Note that an AAD set on decrypt
  but not on encrypt must not break authentication — empty AAD is the OpenSSL
  default, which is why Rails can set it on one side only.
- No new `parity:api:calls` / `parity:api:calls:args` baseline rows.
