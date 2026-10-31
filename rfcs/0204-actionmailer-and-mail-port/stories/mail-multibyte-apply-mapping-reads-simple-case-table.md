---
title: "Mail::Multibyte::Unicode#apply_mapping reads the simple case mapping table"
status: in-progress
updated: 2026-10-31
rfc: "0204-actionmailer-and-mail-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#9520
claim: "2026-10-31T02:00:27Z"
assignee: "compare-file-async-reads-without-sync-fs"
blocked-by: null
closed-reason: null
---

## Context

`Mail::Multibyte::Unicode#apply_mapping` (`vendor/mail/2.8.1/lib/mail/multibyte/unicode.rb`, `apply_mapping`) reads each codepoint's simple case mapping from `database.codepoints[cp].uppercase_mapping` / `lowercase_mapping`, loaded from `UnicodeDatabase` (`unicode.rb:329-386`).

The trails port (`packages/mail/src/multibyte/unicode.ts`, `applyMapping`, trails#9472) approximates it with `String#toUpperCase` / `toLowerCase`, keeping the result only when it is a single codepoint. This diverges where JS's full mapping differs from UnicodeData's simple mapping (e.g. titlecase digraphs like `ǅ`, and locale-free special cases), and `Codepoint` / `UnicodeDatabase` are unported.

## Acceptance criteria

- `applyMapping` reads a simple-case mapping per codepoint (UnicodeData fields 12/13), from activesupport's Unicode data if it exposes one, else a generated table, not `toUpperCase`/`toLowerCase`.
- A test covers a codepoint where the simple and full mappings differ (`ǅ` → `Ǆ`/`ǆ`, `ß` unchanged on upcase).
- No new third-party dependency.
