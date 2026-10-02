---
title: "bcrypt: Engine.generate_salt reaches __bc_salt with OpenSSL random bytes, and answers nil above MAX_COST"
status: draft
updated: 2026-10-02
rfc: "0173-activemodel-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8402, which moved `BCrypt::Engine` into `packages/bcrypt` and ported the C
`bc_crypt` as a private `Engine.__bcCrypt`. `generate_salt` did not get the same treatment.

`vendor/bcrypt-ruby/v3.1.20/lib/bcrypt/engine.rb:81-95`:

```ruby
def self.generate_salt(cost = self.cost)
  cost = cost.to_i
  if cost > 0
    if cost < MIN_COST
      cost = MIN_COST
    end
    ...
    __bc_salt("$2a$", cost, OpenSSL::Random.random_bytes(MAX_SALT_LENGTH))
```

`packages/bcrypt/src/engine.ts` `generateSalt` instead answers
`` `$2a$${bcryptjs.genSaltSync(cost).slice(4)}` ``: no `__bc_salt`, no `OpenSSL::Random.random_bytes`,
and `MAX_SALT_LENGTH` (`engine.rb:21`) is declared and never read. Two behaviours differ:

- **cost above 31.** `__bc_salt` is the C `bc_salt` (`ext/mri/bcrypt_ext.c:26-58`), which returns `nil`
  when `crypt_gensalt_ra` answers NULL; `_crypt_gensalt_blowfish_rn`
  (`ext/mri/crypt_blowfish.c:877-887`) answers NULL for `count > 31`. `bcryptjs.genSaltSync` clamps to
  31 and returns a salt. (This is the whole of `bcrypt-engine-generate-salt-returns-nil-above-max-cost`,
  which this story supersedes.)
- **the salt bytes.** The gem draws 16 bytes from `OpenSSL::Random`; bcryptjs draws its own.

`calibrate` (`engine.rb:117-126`) has a smaller sibling gap: when no cost exceeds the limit Ruby
answers the Range the `each` ran over, and `Engine.calibrate` answers `undefined`.

The converged shape keeps bcryptjs (the backend is settled, `vendor/README.md` § `vendor/bcrypt-ruby/`):
a private `Engine.__bcSalt(prefix, count, input)` porting `bc_salt` over
`_crypt_gensalt_blowfish_rn` — the NULL guard at `crypt_blowfish.c:880-887`, then
`prefix + two-digit count + "$" + bcryptjs.encodeBase64(input, 16)` (`:889-900`) — called from
`generateSalt` with `SecureRandom.randomBytes(Engine.MAX_SALT_LENGTH)` (ruby-compat's
`secure-random.ts`).

## Acceptance criteria

- [ ] `Engine.generateSalt` ends in `this.__bcSalt("$2a$", cost, <16 random bytes>)` and `MAX_SALT_LENGTH` is read.
- [ ] `Engine.generateSalt(32)` answers `null`, pinned by a test in `packages/bcrypt/src/engine.trails.test.ts`.
- [ ] `Engine.calibrate` answers what Ruby answers when no cost exceeds the limit.
- [ ] `pnpm parity:test:assertions` stays at `0/0/0` for `bcrypt`.

## Verification

```bash
pnpm vitest run packages/bcrypt && pnpm parity:test:assertions
```
