---
title: "FloatDomainError and NameError get one home in ruby-compat"
status: done
updated: 2026-09-02
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: 69
pr: 7399
claim: "2026-09-02T18:51:12Z"
assignee: "converge-float-domain-error-and-name-error-onto-ruby-compat"
blocked-by: null
closed-reason: null
---

## Context

PR #7340 converged `ArgumentError`, `RuntimeError`, `NotImplementedError`,
`TypeError` and `FrozenError` onto `@blazetrails/ruby-compat`. The same
hand-rolled-Ruby-core-class shape survives for two more names it did not
claim, verified 2026-09-01:

`FloatDomainError` — a `RangeError` subclass in MRI
(`vendor/ruby/numeric.c`, `rb_eFloatDomainError`), raised by `rb_num2int` /
`Integer()` for a non-finite Float. Four declarations, and they do not even
agree on the parent:

- `packages/activesupport/src/cache/store.ts:125` — `extends globalThis.Error`
- `packages/activerecord/src/connection-adapters/abstract/database-statements.ts:705` — `extends globalThis.RangeError`
- `packages/date/src/date.ts:809` — `extends RangeError`
- `packages/ruby-compat/src/rational.ts:24` — `extends RangeError`, already
  inside ruby-compat but file-local rather than its own seat

`NameError` — `vendor/ruby/error.c` `rb_eNameError`, a `StandardError`
subclass. Two declarations that likewise disagree:

- `packages/activemodel/src/attribute-assignment.ts:155` — `extends globalThis.Error`
- `packages/activesupport/src/core-ext/name-error.ts:21` — `extends ReferenceError`,
  and this one is a real Rails seat (`activesupport/lib/active_support/core_ext/name_error.rb`)
  whose `missing_name` / `missing_name?` Rails DOES define, so the file stays —
  only its parent is in question.

Four-part test (RFC 0129 README §1, §2, §4): Rails declares neither
(`grep -rn "class FloatDomainError\|class NameError" vendor/rails` is empty
outside the core_ext seat's reopening); MRI declares both; trails calls both;
and a ruby-compat seat drags no workspace dependency — `float-domain-error.ts`
would import only `./range-error.js` if one is added, exactly as
`frozen-error.ts` imports `./runtime-error.js` today.

Note that `RangeError` itself has NO Ruby-core hand-roll to converge — PR #7340 checked, and both trails declarations are ones Rails defines
(`vendor/rails/activemodel/lib/active_model/errors.rb:523`
`class RangeError < ::RangeError`, and
`vendor/rails/activerecord/lib/active_record/errors.rb:301`
`class RangeError < StatementInvalid`). So a ruby-compat `RangeError` seat is
only worth adding if `FloatDomainError` needs a parent to extend; otherwise
extend `globalThis.RangeError` consistently at the one seat.

## Acceptance criteria

- `packages/ruby-compat/src/float-domain-error.ts` exists with a resolving
  `vendor/ruby/*.c:LINE` citation and a `@noRailsEquivalent PERMANENT`
  receipt, matching `argument-error.ts` / `frozen-error.ts` exactly, and is
  exported from the package index.
- All four `FloatDomainError` declarations are deleted and replaced by an
  import from `@blazetrails/ruby-compat`, including the one inside
  `ruby-compat/src/rational.ts`, so the parent is one class not four.
- `activemodel/src/attribute-assignment.ts`'s local `NameError` either moves
  to a ruby-compat seat or extends the same class
  `activesupport/src/core-ext/name-error.ts` does — the two must not disagree
  on the parent. State which and why, citing the Rails core_ext file.
- `parity:api:extra:gate`'s ruby-compat mark is raised by a reviewed line of
  that diff, sized to exactly the classes added — never a reseed.
- `packages/ruby-compat` still has no `dependencies` block.
- `pnpm parity:api`, `parity:api:calls`, `parity:api:calls:args`,
  `parity:api:params` show no new rows.
