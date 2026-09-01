---
title: "activemodel: isValid inlines the validation-callback wrap Rails keeps in validations/callbacks.rb"
status: ready
updated: 2026-09-01
rfc: "0000-activemodel-surfaced-deviations"
cluster: rails-deviation
packages: ["activemodel"]
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

Rails `valid?` (`vendor/rails/activemodel/lib/active_model/validations.rb`,
`def valid?(context = nil)`) calls `run_validations!`; the "validation"
callback wrap lives in `ActiveModel::Validations::Callbacks`' OVERRIDE of
`run_validations!` (`validations/callbacks.rb`:
`_run_validation_callbacks { super }`).

trails inlines `runCallbacks(this, "validation", …)` directly inside `isValid`
(`packages/activemodel/src/validations.ts:85-101`), violating
one-Rails-method-one-TS-method and moving the subclass override point:
a class overriding `runValidationsBang` in trails escapes the callback wrap
that Rails guarantees, and a Callbacks-less model runs the wrap Rails would
not give it.

## Acceptance criteria

- `isValid` calls `runValidationsBang` bare, exactly Rails' `valid?` shape
  (context juggling + ensure arm preserved).
- `validations/callbacks.ts` owns the `runValidationsBang` override that
  wraps in `_run_validation_callbacks`, mirroring callbacks.rb's decomposition
  (the `include()`-override idiom from CLAUDE.md "Module mixins").
- `validations/callbacks.test.ts` and `validations.test.ts` stay green;
  halted-chain behavior (`if (!completed) return false`) preserved where the
  Rails body puts it.
