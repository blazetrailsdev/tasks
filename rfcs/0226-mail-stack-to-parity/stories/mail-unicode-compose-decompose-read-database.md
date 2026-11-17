---
title: "Mail::Multibyte::Unicode compose/decompose_codepoints read the gem's database, not ActiveSupport"
status: in-progress
updated: 2026-11-17
rfc: "0226-mail-stack-to-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: trails#10269
claim: "2026-11-17T19:51:33Z"
assignee: "mail-retrievers-read-net-imap-pop3-from-net-module"
blocked-by: null
closed-reason: null
---

## Context

`Mail::Multibyte::Unicode#decompose_codepoints` (`vendor/mail/2.8.1/lib/mail/multibyte/unicode.rb:163-181`) and `#compose_codepoints` (`:184-240`) walk the gem's own database: `database.codepoints[cp].decomp_mapping` / `decomp_type`, the Hangul constants, `database.composition_map` and `database.composition_exclusion`.

trails (`packages/mail/lib/multibyte/unicode.ts`, `decomposeCodepoints` / `composeCodepoints`) delegates both to `@blazetrails/activesupport`'s `Unicode.decompose` / `compose` and maps `:compatability` to `:compatibility`. Since trails#10217, `UnicodeDatabase#load` seats the real `unicode_tables.dat` tables (`compositionMap`, `compositionExclusion`, per-`Codepoint` `decompMapping` / `decompType`), so the ported bodies now have their data.

## Acceptance criteria

- [ ] `decomposeCodepoints` and `composeCodepoints` are line-for-line ports of `unicode.rb:163-240`, reading `database()`'s tables. There is no ActiveSupport delegation and no `:compatability` remap.
- [ ] Existing mail multibyte tests stay green. `parity:api:calls` shows no new mismatch for either method.
