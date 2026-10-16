---
title: "Inline single-caller numeric and array helpers at their callers"
status: draft
updated: 2026-10-16
rfc: "0000-ruby-compat-native-first"
cluster: inline
packages: []
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Each of these helpers has one importing file:

- `numericUminus` (5 calls) in `activesupport/src/duration.ts`
- `numericPow` in `activemodel/.../time-value.ts`
- `isFinite` in `sqlite3/quoting.ts`
- `aryPop` in `tagged-logging.ts`
- `aryFetch` in `strong-parameters.ts`
- `isIntersect` in `validations/callbacks.ts`
- `rbObjIsProc` in `routing/redirection.ts`
- `rbObjFrozenP` in `message-pack/serializer.ts`

## Acceptance criteria

- [ ] Each caller gets the subset it reaches. Exports are deleted as in `inline-single-use-string-byte-helpers`.
- [ ] Where Rational, bigint or a non-function proc class is reachable, that arm is kept inline, with a test.
