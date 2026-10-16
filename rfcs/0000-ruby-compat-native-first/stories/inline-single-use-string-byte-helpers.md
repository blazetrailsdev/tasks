---
title: "Inline single-caller string and byte helpers at their callers"
status: draft
updated: 2026-10-16
rfc: "0000-ruby-compat-native-first"
cluster: inline
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
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
- [ ] Before `rstrip` goes native, the PR checks whether `rstrip`'s NUL-stripping arm is reached.
