---
title: "crypto-adapter moves into ruby-compat, bootstrap included; the SecureRandom/Digest re-dressing is deferred to its own story"
status: in-progress
updated: 2026-09-03
rfc: "0135-platform-adapters-in-ruby-compat"
cluster: null
packages: ["ruby-compat", "activesupport"]
deps: ["narrow-ruby-compat-leaf-guard-to-static-imports"]
deps-rfc: []
est-loc: 300
priority: 12
pr: 7460
claim: "2026-09-03T20:14:46Z"
assignee: "move-crypto-adapter-into-ruby-compat"
blocked-by: null
closed-reason: null
---

## Context

`packages/activesupport/src/crypto-adapter.ts` (393 LOC) moves into
`ruby-compat`, bootstrap included — `getBuiltinModule("node:crypto")` at
`:301`, `wrapNodeCrypto` at `:216`, `registerCryptoAdapter` at `:282`.

Shape is unchanged in this story: `getCrypto()` moves as `getCrypto()`. The
Ruby dressing (`SecureRandom`, `Digest`, `OpenSSL::Cipher`) is deliberately
deferred to its own story — `ruby-compat` already has
`packages/ruby-compat/src/secure-random.ts`, so the re-dressing has a seat to
converge onto and is a naming question, not a relocation one. Splitting them
keeps this PR mechanical.

`getCrypto` has 40 importing files — activesupport 18, actionpack 12,
activerecord 6, and one each in activerecord-cli, rack, rack-session and
trailties. rack-session's single use is the reason it declares
`@blazetrails/activesupport` at all, so this story is on rack-session's critical
path even though `File`/`Dir` are not.

Deps on `narrow-ruby-compat-leaf-guard-to-static-imports` for the bootstrap, the
same as the fs move.

## Acceptance criteria

- `crypto-adapter.ts` is in `ruby-compat`, no shim left in activesupport,
  importers repointed in this PR.
- `scripts/ruby-compat-leaf.test.ts` green; `ruby-compat` still declares no
  `dependencies`.
- The `SecureRandom` / `Digest` re-dressing is filed as its own story with the
  `secure-random.ts` seat named, not attempted here.
