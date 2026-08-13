---
title: "converge-enum-two-pass-method-generation"
status: done
updated: 2026-08-13
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6464
claim: "2026-08-13T15:11:09Z"
assignee: "extra-surface-scores-overridden-ruby-files"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/enum.ts#_enum` splits Rails' single
`_enum_methods_module.module_eval do … end` loop
(`vendor/rails/activerecord/lib/active_record/enum.rb:249-260`) into two passes:
a conflict-detection pass (enum.ts:677-800) and a generation pass
(enum.ts:812-860). Rails detects the conflict and defines the methods inside one
loop iteration, and runs `detect_negative_enum_conditions!(value_method_names)
if scopes` AFTER the loop (enum.rb:262).

Because the passes are split, `detect_negative_enum_conditions!` runs BEFORE the
first `define_enum_methods`, which is the inversion the call-order gate reports
as `activerecord enum.ts _enum order:detectNegativeEnumConditionsBang,defineEnumMethods`.
The row was masked until #6464 converged the `constructor` inversion ahead of it
in the same body (the gate reports one inversion per body).

The split is deliberate and documented at enum.ts:663-676: `definedNames` tracks
positive method names only so a value literally named `notActive` does not
pre-empt the `not*` scope of `active` with a hard `ArgumentError` where Rails
only warns. Converging has to preserve that, which is why it is its own story
rather than a drive-by.

## Acceptance criteria

- [ ] `_enum`'s conflict detection and method generation happen in ONE loop over
      the mapping, as `enum.rb:249-260` does, with
      `detect_negative_enum_conditions!` after it (enum.rb:262).
- [ ] The `notActive` / `active` case still warns rather than raising (the
      enum.ts:663-676 invariant); `enum.test.ts` and `enum.trails.test.ts` green.
- [ ] The `activerecord enum.ts _enum order:detectNegativeEnumConditionsBang,defineEnumMethods`
      baseline row is deleted by hand (only-shrink).
