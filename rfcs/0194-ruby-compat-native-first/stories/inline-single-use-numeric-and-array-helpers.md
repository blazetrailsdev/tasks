---
title: "Inline single-caller numeric and array helpers at their callers"
status: in-progress
updated: 2026-10-22
rfc: "0194-ruby-compat-native-first"
cluster: inline
packages: []
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: trails#9252
claim: "2026-10-22T21:01:45Z"
assignee: "call-args-drops-visibility-boolean-argument"
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
