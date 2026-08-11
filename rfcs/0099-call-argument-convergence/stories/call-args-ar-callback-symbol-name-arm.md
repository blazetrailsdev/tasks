---
title: "call-args-ar-callback-symbol-name-arm"
status: done
updated: 2026-08-11
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6377
claim: "2026-08-11T20:50:30Z"
assignee: "arel-append-escape-inline-convergence"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the RFC 0099 `call-args-ar-literal-values` PR. Rails' callback
macros take a METHOD NAME symbol as well as a block —
`autosave_association.rb:233` writes
`after_validation :_ensure_no_duplicate_errors`, and
`define_non_cyclic_method(validation_method) { send(method, reflection) }` at
`:230` pairs a name with a block.

trails' callback registry takes a function only:
`packages/activerecord/src/callbacks.ts:56`
(`afterValidation(modelClass, fn, options)`), and every sibling macro in that
file has the same shape. So the port at
`packages/activerecord/src/autosave-association.ts:1431` passes an arrow
wrapping `_ensureNoDuplicateErrors`, and the call-argument comparator flags
`after_validation(str:_ensure_no_duplicate_errors)` vs `(ref:klass)`.
Baselined in
`scripts/api-compare/call-mismatches-exclude/activerecord/autosave-association.json`
with that reason; the row exists to be deleted by this story.

CLAUDE.md: "Where Rails accepts a Symbol _or_ a String, port both arms —
dropping the string arm is a common silent gap."

## Acceptance criteria

1. `registerCallback` (and the macros in `callbacks.ts` that reach it) accept a
   METHOD NAME string as well as a function, resolving it against the record at
   invocation time exactly as Ruby's `send` does.
2. `autosave-association.ts:1431` passes `"_ensureNoDuplicateErrors"`, matching
   `autosave_association.rb:233`.
3. The baseline row above goes stale and is deleted by hand (only-shrink).
4. `pnpm parity:api:calls:args` green, row count strictly decreases.
