---
title: "activemodel: BCrypt::Engine moves out of activemodel into a bcrypt gem port"
status: claimed
updated: 2026-10-02
rfc: "0173-activemodel-parity-100"
cluster: receipts
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: "2026-10-02T14:42:18Z"
assignee: "access-slice-index-with-receiver-shape-and-public-send"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `activemodel-audit-permanent-receipts-root` (the PERMANENT receipt audit).
`packages/activemodel/src/bcrypt.ts` carries four `@noRailsEquivalent` receipts — `Engine`,
`Engine.MIN_COST`, `Engine.DEFAULT_COST`, `Engine.cost`. They are not Rails surface and not a
TypeScript shortcoming: `BCrypt::Engine` is the `bcrypt` gem's class (`lib/bcrypt/engine.rb`,
`DEFAULT_COST = 12`, `MIN_COST = 4`, `cattr_accessor`-style `cost`), read by Rails at
`vendor/rails/v8.0.2/activemodel/lib/active_model/secure_password.rb:160`
(`cost = ActiveModel::SecurePassword.min_cost ? BCrypt::Engine::MIN_COST : BCrypt::Engine.cost`).

A gem class living in a Rails-matched package is extra surface for as long as it stays there, so no
receipt on it can ever be retired in place. Every other gem trails ports has its own package
(`packages/globalid`, `packages/did-you-mean`, `packages/rack`, `packages/nokogiri`), measured against
its own vendored source. `activemodel-converge-secure-password-bcrypt-password` grows this file into
`BCrypt::Password` over the npm client; this story is where that port lives.

## Acceptance criteria

- [ ] `bcrypt-ruby` is vendored (`vendor/sources.ts`) and `BCrypt::Engine` / `BCrypt::Password` live in a `packages/bcrypt` gem port wrapping the npm client, async where the client is async.
- [ ] `packages/activemodel/src/bcrypt.ts` is deleted; `secure-password.ts` imports the gem port.
- [ ] No `@noRailsEquivalent` receipt for a `BCrypt` name remains under `packages/activemodel/src`.

## Verification

```bash
pnpm parity:api:extra --package activemodel && pnpm vitest run packages/activemodel/src/secure-password.test.ts
```
