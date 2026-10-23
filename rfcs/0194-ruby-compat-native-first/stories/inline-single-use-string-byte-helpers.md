---
title: "Inline single-caller string and byte helpers at their callers"
status: done
updated: 2026-10-22
rfc: "0194-ruby-compat-native-first"
cluster: inline
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#9259
claim: "2026-10-22T22:50:36Z"
assignee: "inline-single-use-string-byte-helpers"
blocked-by: null
---

## Context

Each of these helpers has one importing file:

- `rbStrGetbyte`, `rbStrSetbyte`, `intXor` in `actionpack/.../request-forgery-protection.ts`
- `rbCheckStringType` in `action-controller/metal/redirecting.ts`
- `center`, `rstrip` in `postgresql/explain-pretty-printer.ts`
- `rbStrPartition` in `sqlite3-adapter.ts`
- `rbStrHex` in `postgresql/oid/bit.ts`

## Acceptance criteria

- [ ] Each caller gets the subset it uses, natively where JS has a form (`padStart`, `trimEnd`, `^`, `indexOf`).
- [ ] Each export is deleted, unless a ruby-compat internal still uses it (then it stays unexported).
- [ ] `rstrip`'s NUL-stripping arm is either kept inline at the explain-pretty-printer site, with a test reaching it, or shown unreachable from that caller's input (PostgreSQL EXPLAIN text) and replaced by `trimEnd()`.
