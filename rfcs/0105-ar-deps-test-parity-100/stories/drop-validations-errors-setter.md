---
title: "Drop Validations#errors setter Rails does not define"
status: draft
updated: 2026-09-11
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activemodel/lib/active_model/validations.rb:328-330` defines only a
reader: `def errors; @errors ||= Errors.new(self); end`. trails' `Validations`
(`packages/activemodel/src/validations.ts`, moved from `model.ts` in trails#7682)
also carries `set errors(value)`, which Rails has no counterpart for.

Its one production writer is `clone` in `packages/activerecord/src/persistence.ts`
(`copy.errors = new this.errors.constructor(copy)`), standing in for Ruby's ivar
reset. Test writers: `activemodel/src/errors.test.ts:20`,
`validations.trails.test.ts:2298`.

## Converged shape

Drop the setter; writers seat `_errors` directly (the ivar, as Rails'
`initialize_dup` does via `@errors = nil`, `validations.rb`).

## Acceptance criteria

- `Validations` defines only the `errors` reader.
- `persistence.ts` clone and the two test writers assign `_errors` instead.
