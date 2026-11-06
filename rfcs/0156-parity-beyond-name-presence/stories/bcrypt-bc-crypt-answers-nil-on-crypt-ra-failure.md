---
title: "bcrypt: __bc_crypt answers nil when crypt_ra fails, not a backend Error"
status: draft
updated: 2026-11-06
rfc: "0156-parity-beyond-name-presence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

bcrypt-ruby's `bc_crypt` (`vendor/bcrypt-ruby/v3.1.20/ext/mri/bcrypt_ext.c:75-109`) answers `nil` when `crypt_ra` fails (`:101`, `if(!value || !args.data) return Qnil;`). `Engine.hash_secret` (`vendor/bcrypt-ruby/v3.1.20/lib/bcrypt/engine.rb:70`) returns that `nil` to its caller.

trails' `Engine.__bcCrypt` (`packages/bcrypt/src/engine.ts`, after trails#9807) instead propagates whatever its backend throws. A setting that passes `isValidSalt` but that crypt_blowfish rejects (`$2z$04$...`, `$2x$`, `$3a$`, cost `03` or `32`, a one-digit cost) throws a plain JS `Error`. Its message depends on the backend: bcryptjs says "Invalid salt revision: z$" or "Illegal number of rounds (4-31): 3", while the native `bcrypt` addon says "Invalid salt. Salt must be in the form of: ...". The trails test "hash_secret raises where bcryptjs raises on an unhashable salt" (`packages/bcrypt/src/engine.trails.test.ts`) pins today's throwing behavior.

## Acceptance criteria

- `__bcCrypt` answers `null` where `crypt_ra` would fail, on both backends: catch the backend's failure in `_bcHashSync` (or test the setting the way crypt_blowfish's `BF_crypt` does) and return `null`, never a backend-specific `Error`.
- `hashSecret`'s return type becomes `string | null`, as Ruby's `hash_secret` can answer `nil`. Callers (`Password.create`, `Password#==`) are checked against Ruby's handling of that `nil`.
- The trails test above is rewritten to assert `null`, keeping its name. Where it fits, the matching bcrypt-ruby spec rows in `vendor/bcrypt-ruby/v3.1.20/spec/bcrypt/engine_spec.rb` are ported.
