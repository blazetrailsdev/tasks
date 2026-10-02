---
title: "bcrypt: enroll the gem's specs in test-compare and port the null-byte arm"
status: draft
updated: 2026-10-02
rfc: "0173-activemodel-parity-100"
cluster: null
packages: []
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

Surfaced by `activemodel-bcrypt-engine-into-a-bcrypt-gem-package`, which created `packages/bcrypt`
over `vendor/bcrypt-ruby/v3.1.20` and enrolled it in `parity:api` (18/18 methods). Four things did
not fit that PR.

1. **test-compare is off.** `vendor/sources.ts` sets `compareTests: false` on the `bcrypt` package
   because the gem's examples are `specify "..." do`
   (`vendor/bcrypt-ruby/v3.1.20/spec/bcrypt/engine_spec.rb:16`, `password_spec.rb:11`), and
   `scripts/test-compare/extract-ruby-tests.rb` reads only `it` (`:313`, `:336`, `:549`, `:565`).
   `packages/bcrypt/src/{engine,error,password}.test.ts` already carry the spec names verbatim, so
   they credit as soon as the extractor reads `specify`. `error_spec.rb:5-15` reaches its examples
   through `shared_examples` / `include_examples` inside `describe BCrypt::Error do` (a constant,
   not a string).
2. **`should be interoperable with other implementations`** (`engine_spec.rb:80-155`) is ported
   with 14 of its 67 vectors. The rest need a secret that is raw bytes (`"\xa3"`, `"\xff\xff\xa3"`),
   which `bcryptjs.hashSync(password: string, …)` UTF-8 encodes, or a `$2x$` salt, which bcryptjs
   rejects (`Invalid salt revision: x$`).
3. **`blows up when null bytes are in the string`** (`password_spec.rb:36-40`) is not ported. The
   C extension raises `ArgumentError` from `__bc_crypt` (`StringValueCStr`); `bcryptjs.hashSync`
   hashes `"foo\0ba"` without raising, so `Engine.hashSecret` (`packages/bcrypt/src/engine.ts`)
   answers a hash where the gem raises.
4. **`hash_secret` omits `secret.byteslice(0, MAX_SECRET_BYTESIZE)`** (`engine.rb:63-64`). bcryptjs
   truncates at 72 bytes itself, and `rbStrByteslice` over a JS string cannot hold the split
   multi-byte character the Ruby slice leaves. The package is outside the call gate's population, so
   the omission carries no `@missingRailsCall` receipt (the tag was an `uncomparedTags` entry).

The per-package rollouts `packages/bcrypt` has not joined: `blazetrails/rails-private-jsdoc` and
`unbacked-internal-needs-receipt` (`eslint.config.mjs`, `eslint/rails-private-jsdoc.config.mjs`),
`scripts/api-compare/param-name-mark.ts`, `scripts/api-compare/block-param-mark.json`.

## Acceptance criteria

- [ ] `extract-ruby-tests.rb` reads `specify` as it reads `it`, with a test; `bcrypt` drops `compareTests: false` and takes the other test-compare registrations (`extract-ts-tests.ts`, `compare.ts` `PKG_SRC_DIRS` / `rubyToConventionTs`, `generate-stubs.ts`, a `0/0/0` row in `assertion-mismatch-mark.json`, `vendor/sources.test.ts`).
- [ ] `Engine.hashSecret` raises `ArgumentError` for a secret containing a null byte, and `blows up when null bytes are in the string` is ported.
- [ ] The remaining interoperability vectors are ported, or the ones bcryptjs cannot hash are parked under a `PERMANENT-SKIP:` line naming the client limit.
- [ ] `packages/bcrypt` joins the eslint and mark rollouts listed above at zero.

## Verification

```bash
pnpm parity:test && pnpm parity:test:assertions && pnpm vitest run packages/bcrypt
```
