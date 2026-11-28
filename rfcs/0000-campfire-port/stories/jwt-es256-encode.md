---
title: "jwt: port JWT.encode for ES256"
status: draft
updated: 2026-11-27
rfc: "0000-campfire-port"
cluster: campfire-deps
packages: [jwt]
deps: [ruby-compat-openssl-pkey-ec]
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

RFC § Design. web-push's `Request#build_vapid_header` calls
`JWT.encode(payload, key, "ES256", header)`. jwt 3.x is 2,925 lines; only
the encode path and the ECDSA algorithm are reached.

## Acceptance criteria

- [ ] jwt vendored, `packages/jwt` with `JWT.encode`, `Encode`, `JWA::Ecdsa` signing, `Base64.url_encode`
- [ ] the gem's encode specs for ES256 ported and passing
- [ ] decode and other algorithms not ported
