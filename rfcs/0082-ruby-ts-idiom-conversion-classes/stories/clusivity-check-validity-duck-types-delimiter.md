---
title: "Converge Clusivity#check_validity! onto respond_to? duck tests"
status: draft
updated: 2026-09-22
rfc: "0082-ruby-ts-idiom-conversion-classes"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `pnpm parity:api:duck-types` (trails#7979), hand-audited real.
`vendor/rails/activemodel/lib/active_model/validations/clusivity.rb:15`:
`unless delimiter.respond_to?(:include?) || delimiter.respond_to?(:call) || delimiter.respond_to?(:to_sym)`.
`packages/activemodel/src/validations/clusivity.ts:37-53` (`checkValidityBang`) hand-rolls it as
`typeof includes/has === "function"`, `Array.isArray || instanceof Set || instanceof Map`, iterable, callable
and `instanceof Range`, so an object answering `include?` through a ported `respondTo` is rejected, and the
`to_sym` arm is missing.

## Acceptance criteria

- `checkValidityBang` is the three `rbObjRespondTo(delimiter, ...)` calls Rails makes, in Rails' order, and has no `instanceof` list.
- Its row drops out of `pnpm parity:api:duck-types`.
