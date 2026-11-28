---
title: "web-push: port the gem"
status: draft
updated: 2026-11-27
rfc: "0000-campfire-port"
cluster: campfire-deps
packages: [web-push]
deps: [jwt-es256-encode, ruby-compat-openssl-kdf-bn-asn1]
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

RFC § Design. 7 files, 475 lines: `WebPush.payload_send`, `Request`,
`Encryption.encrypt` (aes128gcm, RFC 8291), `VapidKey`, the error classes
Campfire rescues (`ExpiredSubscription`, Campfire's `lib/web_push/pool.rb:44`).
Delivery goes through ruby-compat's `Net::HTTP`.

## Acceptance criteria

- [ ] web-push 3.1.0 vendored, `packages/web-push` created
- [ ] every file ported; Campfire's `WebPush::Request.prepend` (`config/initializers/web_push.rb:51`) works against it
- [ ] the gem's spec suite ported and passing
- [ ] the new package registered as a new package needs (`ci.yml` lanes, the workspace guard fixture, `vendor/sources.ts`)
