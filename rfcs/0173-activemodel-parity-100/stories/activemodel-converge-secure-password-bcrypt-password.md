---
title: "activemodel: SecurePassword reaches a BCrypt::Password object (call row + arm-throw mark)"
status: ready
updated: 2026-09-30
rfc: "0173-activemodel-parity-100"
cluster: calls-args
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Two activemodel residues live in `packages/activemodel/src/secure-password.ts`:

- **call row** `initialize` omits `new` (`call-mismatches-exclude/activemodel/secure-password.json`):
  Rails builds `BCrypt::Password.new(digest)` (`vendor/rails/v8.0.2/activemodel/lib/active_model/secure_password.rb:210`,217) and asks it
  `is_password?` / reads `.salt`; the port calls one-shot `bcrypt.compareSync` / `bcrypt.getSalt`
  because the npm client exposes no Password object.
- **arm-throw mark 1** (`scripts/api-compare/arm-throw-mark.json` `activemodel.byFile["secure-password.ts"]`):
  a Rails raise the port does not make.

`packages/activemodel/src/bcrypt.ts` already wraps the npm client (its PERMANENT receipts are audited by
`activemodel-audit-permanent-receipts-root`). Memory note: gem-backed ports wrap the npm client
behind the gem's own API — here, a `BCrypt::Password` class over it — async from the start where the
client is async.

## Acceptance criteria

- [ ] `bcrypt.ts` exposes `BCrypt::Password` (`new`, `create`, `is_password?`/`==`, `salt`, `cost`) over the npm client, mirroring `bcrypt-ruby`'s `lib/bcrypt/password.rb` shape.
- [ ] `secure-password.ts` calls `BCrypt::Password.new(digest)` where Rails does and raises what Rails raises; the call row is deleted and `pnpm parity:api:arms:throws:tighten` takes `activemodel.total` 1 → 0.
- [ ] `packages/activemodel/src/secure-password.test.ts` green.

## Verification

```bash
pnpm parity:api:calls && pnpm parity:api:calls:args
```
