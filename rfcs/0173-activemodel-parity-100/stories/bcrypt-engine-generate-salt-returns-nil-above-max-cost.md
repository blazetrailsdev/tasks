---
title: "activemodel: BCrypt::Engine.generate_salt answers nil above MAX_COST, where the client clamps"
status: ready
updated: 2026-10-02
rfc: "0173-activemodel-parity-100"
cluster: null
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the trails#8336 review of `packages/activemodel/src/bcrypt.ts`.

bcrypt-ruby 3.1.20 `lib/bcrypt/engine.rb:81-95` `generate_salt` hands the cost to the C extension's
`__bc_salt`, which returns `nil` for a cost above 31 (checked: `BCrypt::Engine.generate_salt(32)` is
`nil` under ruby 3.3.11 / bcrypt 3.1.20). trails' `Engine.generateSalt` hands it to
`bcryptjs.genSaltSync`, which clamps to 31 and returns a salt.

`Password.create` guards the case first (`raise ArgumentError if cost > BCrypt::Engine::MAX_COST`,
`password.rb:45`), so only a direct `Engine.generateSalt` caller sees the difference.

This belongs with the gem port: fold it into `activemodel-bcrypt-engine-into-a-bcrypt-gem-package`
if that story is picked up first.

## Acceptance criteria

- [ ] `Engine.generateSalt(cost)` answers what the gem answers for `cost > Engine.MAX_COST` (`nil`), not a clamped salt.
- [ ] A test pins it next to the existing `hash_secret` cases in `secure-password.trails.test.ts` (or the gem package's own test once it exists).

## Verification

```bash
pnpm vitest run packages/activemodel/src/secure-password.trails.test.ts
```
