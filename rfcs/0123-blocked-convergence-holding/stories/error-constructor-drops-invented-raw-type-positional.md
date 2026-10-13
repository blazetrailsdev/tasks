---
title: "activemodel: Error's constructor drops the invented rawType positional; NestedError assigns its own ivars"
status: draft
updated: 2026-10-13
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

From trails PR 8873. `vendor/rails/v8.0.2/activemodel/lib/active_model/error.rb:103-109` is
`initialize(base, attribute, type = :invalid, **options)`, and
`vendor/rails/v8.0.2/activemodel/lib/active_model/nested_error.rb:8-16` does not call `super`: it
assigns `@base`, `@inner_error`, `@attribute`, `@type`, `@raw_type = inner_error.raw_type` and
`@options = inner_error.options` itself.

`packages/activemodel/src/error.ts`'s constructor carries a fifth positional, `rawType`, that Rails
does not have. It exists so `packages/activemodel/src/nested-error.ts` can pass
`innerError.rawType` through `super(base, attribute, type, innerError.options, innerError.rawType)`.
`NestedError` also types its inner error as a local `ErrorLike` interface with optional `rawType`
and `options`, where Rails holds an `ActiveModel::Error`.

## Acceptance criteria

- [ ] `Error`'s constructor has Rails' four parameters and no `rawType` positional.
- [ ] `NestedError`'s constructor assigns the six ivars in Rails' order after the `super()` JS
      requires, with `rawType` and `options` read off the inner error.
- [ ] `ErrorLike` is gone or receipted; `pnpm parity:api:params` and `pnpm parity:api:calls:args`
      stay green.
