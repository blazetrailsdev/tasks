---
title: "bcrypt: __bc_crypt hashes bytes ($2x$ salts, raw-byte secrets, the byteslice line)"
status: closed
updated: 2026-10-02
rfc: "0173-activemodel-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "operator decision on trails#8402: packages/bcrypt keeps bcryptjs for good; no crypt_blowfish.c port. The hashable vectors and the eslint/mark rollouts shipped in trails#8402."
---

## Context

Surfaced by `activemodel-bcrypt-engine-into-a-bcrypt-gem-package` (trails#8402), which created
`packages/bcrypt` over `bcryptjs`. `Engine.__bcCrypt` (`packages/bcrypt/src/engine.ts`) stands in for
the gem's C `bc_crypt` (`vendor/bcrypt-ruby/v3.1.20/ext/mri/bcrypt_ext.c:75-110`), which calls
`crypt_ra` over `ext/mri/crypt_blowfish.c`. `bcryptjs.hashSync(password: string, salt)` takes a JS
string and UTF-8 encodes it, so three things the C routine does are out of reach:

1. **`$2x$` salts.** `crypt_blowfish.c` hashes them (the sign-extension-bug revision); bcryptjs
   throws `Invalid salt revision: x$`. `engine_spec.rb:90-110` carries the `$2x$` vectors.
2. **Raw-byte secrets.** The spec's `"\xa3"` / `"\xff\xff\xa3"` secrets are Strings holding invalid
   UTF-8. ruby-compat spells such a byte `\uDCxx`, which bcryptjs re-encodes as three bytes.
3. **`secret.byteslice(0, MAX_SECRET_BYTESIZE)`** (`lib/bcrypt/engine.rb:63-64`) is omitted from
   `Engine.hashSecret`. A slice that splits a character is exactly such a raw-byte String:
   `rbStrByteslice("b" * 71 + "é", 0, 72)` ends in `\uDCC3`, and hashing it through bcryptjs differs
   from the gem. bcryptjs truncates the encoded bytes at 72 itself, which matches the gem
   (`packages/bcrypt/src/engine.trails.test.ts` pins three vectors computed with bcrypt 3.1.20).

`should be interoperable with other implementations` (`engine_spec.rb:80-155`) is ported with the 14
vectors bcryptjs can hash; the ASCII `$2a$`/`$2b$`/`$2y$` vectors left out for size hash correctly and
only need adding.

The per-package rollouts `packages/bcrypt` has not joined: `blazetrails/rails-private-jsdoc` and
`unbacked-internal-needs-receipt` (`eslint.config.mjs`, `eslint/rails-private-jsdoc.config.mjs`),
`scripts/api-compare/param-name-mark.ts`, `scripts/api-compare/block-param-mark.json`.

## Acceptance criteria

- [ ] `Engine.__bcCrypt` hashes bytes: either a port of `crypt_blowfish.c`'s `BF_crypt` taking ruby-compat `bytes(secret)`, or a client that accepts a byte array. `$2x$` salts hash.
- [ ] `Engine.hashSecret` carries the `byteslice` line, and `engine.trails.test.ts`'s vectors still pass.
- [ ] Every vector in `engine_spec.rb:80-155` is ported.
- [ ] `packages/bcrypt` joins the eslint and mark rollouts listed above at zero.

## Verification

```bash
pnpm parity:test && pnpm parity:test:assertions && pnpm vitest run packages/bcrypt
```
