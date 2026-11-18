---
title: "Mail UnicodeDatabase reads a shipped unicode_tables.dat"
status: done
updated: 2026-11-18
rfc: "0226-mail-stack-to-parity"
cluster: null
packages: []
deps:
  - ruby-compat-marshal-load-range-compat
deps-rfc: []
est-loc: 60
priority: 3
pr: trails#10217
claim: "2026-11-16T23:36:32Z"
assignee: "mail-unicode-tables-dat-shipped"
blocked-by: null
closed-reason: null
---

## Context

`Mail::Multibyte::Unicode::UnicodeDatabase.dirname` / `.filename` (`vendor/mail/2.8.1/lib/mail/multibyte/unicode.rb:377-384`) name `values/unicode_tables.dat`, and `load` (`:354-358`) reads it with `File.open` + `Marshal.load`. trails (`packages/mail/lib/multibyte/unicode.ts`) keeps the Rails arguments, but the `.dat` is not shipped. `load` seats the table from `simple-case-mappings.generated.ts` instead, receipted `@missingRailsCall open — PERMANENT` and `@missingRailsCall load — PERMANENT`. That receipt was not ratified.

## Acceptance criteria

- [ ] Ship `values/unicode_tables.dat` in `packages/mail`, so `filename` names a real file, or get the precompiled-table deviation ratified and record it at the call site.
- [ ] If the file ships, `load` reads it through ruby-compat `Marshal.load` behind an awaited load step, and the two receipts are removed.
