---
title: "receiver-resolution-pass"
status: closed
updated: 2026-07-17
rfc: "0065-prism-codegen"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Spike PR #4912 closed — deterministic codegen not useful enough for the backlog; direction abandoned."
---

## Context

`scripts/prism-codegen/handlers/expressions.ts` `emitCall()` renders a
receiver-less call with no args as a bare identifier (e.g. Ruby `valid?` →
`isValid`), because a deterministic walk cannot tell an implicit-`self` method
call from a local-variable read. Rails leans on implicit `self` pervasively —
see `vendor/rails/activerecord/lib/active_record/persistence.rb` (`save`,
`create_or_update`, `_create_record` all call sibling methods bare).

## Acceptance criteria

- Build a per-method scope/symbol table (params + local assignments +
  block params) during the walk.
- A bare call whose name is NOT a known local resolves to `this.<name>()`
  (instance) or the class-static form as appropriate.
- Known locals still render as bare identifiers.
- Coverage metric unchanged; add a golden test showing `save` → `this.save()`
  inside a method body while a local `x` stays `x`.
