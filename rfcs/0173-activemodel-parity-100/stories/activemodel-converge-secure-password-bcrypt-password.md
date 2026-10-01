---
title: "activemodel: SecurePassword reaches a BCrypt::Password object (call row)"
status: in-progress
updated: 2026-10-01
rfc: "0173-activemodel-parity-100"
cluster: calls-args
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: trails#8336
claim: "2026-10-01T15:55:05Z"
assignee: "activemodel-converge-secure-password-bcrypt-password"
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
  a Rails raise the port does not make. Measured in trails#8336: the row is `has_secure_password`'s
  `require "bcrypt"` / `rescue LoadError` / `warn` / `raise` (`secure_password.rb:117-125`), which has
  nothing to raise from while the bcrypt port is a static import inside activemodel. It is split out
  to `activemodel-secure-password-require-bcrypt-load-error-arm`, which depends on the gem-package move.

`packages/activemodel/src/bcrypt.ts` already wraps the npm client (its PERMANENT receipts are audited by
`activemodel-audit-permanent-receipts-root`). Memory note: gem-backed ports wrap the npm client
behind the gem's own API — here, a `BCrypt::Password` class over it — async from the start where the
client is async.

## Acceptance criteria

- [ ] `bcrypt.ts` exposes `BCrypt::Password` (`new`, `create`, `is_password?`/`==`, `salt`, `cost`) over the npm client, mirroring `bcrypt-ruby`'s `lib/bcrypt/password.rb` shape.
- [ ] `secure-password.ts` calls `BCrypt::Password.new(digest)` where Rails does and raises what Rails raises from it (`BCrypt::Errors::InvalidHash` for a digest that is not a bcrypt hash); the call row is deleted. The arm-throw mark is `activemodel-secure-password-require-bcrypt-load-error-arm`'s.
- [ ] `packages/activemodel/src/secure-password.test.ts` green.

## Verification

```bash
pnpm parity:api:calls && pnpm parity:api:calls:args
```
