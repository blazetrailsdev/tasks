---
title: "Port String#crypt (DES and $1$/$5$/$6$) into the String method table"
status: draft
updated: 2026-09-22
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#7984. The String method table (`packages/ruby-compat/src/string/method-table.ts`)
carries every public `Init_String` method except `force_encoding`, `b`, `length` and `crypt`.
`crypt` (`vendor/ruby/string.c:10290` `rb_str_crypt`) calls the platform's `crypt(3)`. That is
not a language shortcoming: the algorithms are portable. On the glibc MRI trails pins, they are
traditional DES (2-character salt) and the `$1$` (MD5), `$5$` (SHA-256) and `$6$` (SHA-512)
modular formats. `rb_str_crypt` also raises `ArgumentError "salt too short (need >=2 bytes)"`
for a short salt.

## Converged shape

A `crypt` table entry: `rb_str_crypt`'s salt checks, then the DES / `$1$` / `$5$` / `$6$`
algorithms ported (no third-party dependency; `crypto-adapter` covers SHA/MD5 digests if it helps).

## Acceptance criteria

- `rbStrSend("secret", "crypt", salt)` matches `ruby -e 'p "secret".crypt(salt)'` for a DES
  salt and for `$1$`, `$5$` and `$6$` salts (add the rows to
  `string/method-table.trails.test.ts`).
- The table's JSDoc no longer lists `crypt` as excluded.
