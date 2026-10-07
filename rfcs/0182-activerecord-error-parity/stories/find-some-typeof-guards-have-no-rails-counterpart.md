---
title: "activerecord: find_some / find_some_ordered hand-roll MRI's coercion errors behind typeof guards Rails does not have"
status: in-progress
updated: 2026-10-07
rfc: "0182-activerecord-error-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#8611
claim: "2026-10-07T02:09:26Z"
assignee: "environment-mismatch-error-message-matches-rails"
blocked-by: null
closed-reason: null
---

## Context

`findSome` and `findSomeOrdered` (`packages/activerecord/src/relation/finder-methods.ts`) open with explicit `typeof limitValue !== "number"` / `typeof offsetValue !== "number"` guards that throw `ArgumentError("comparison of Integer with String failed")`, `TypeError("String can't be coerced into Integer")` and `TypeError("no implicit conversion of String into Integer")`.

Rails has no such guards. `find_some` (`vendor/rails/v8.0.2/activerecord/lib/active_record/relation/finder_methods.rb:541-565`) is `ids.size > limit_value` and `ids.size - offset_value`; `find_some_ordered` (`:567-580`) is `ids.slice(offset_value || 0, limit_value || ids.size) || []`. The errors come from MRI's `Integer#>`, `Integer#-` and `Array#slice` themselves. trails#8599 converged the error classes only; the three hand-written guard arms and their hard-coded "String" messages remain invented arms, and they report "String" for any non-number operand.

`findSomeOrdered` also drops the `|| []` after `slice`.

## Acceptance criteria

- [ ] The three `typeof` guards are deleted; the comparison, subtraction and slice go through the ruby-compat operators that raise MRI's errors themselves (the same ones `Integer#>` / `Integer#-` / `Array#slice` raise), so the message names the operand's real class.
- [ ] `findSomeOrdered` ports `ids.slice(offset_value || 0, limit_value || ids.size) || []` in one expression, including the `|| []` arm.
- [ ] The existing finder tests that pass a String limit/offset stay green; `pnpm parity:api:arms:throws` and `pnpm parity:api:calls` stay green.
