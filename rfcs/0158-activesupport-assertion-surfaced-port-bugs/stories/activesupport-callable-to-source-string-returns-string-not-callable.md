---
title: "_callableToSourceString returns a rendered String and strips return/; where Rails returns the callable"
status: blocked
updated: 2026-09-25
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: ["activesupport"]
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: "Converged shape needs rbObjAsString's Proc arm first: 0154 rb-obj-as-string-has-no-proc-arm is still draft, and origin/main packages/ruby-compat/src/object.ts rbObjAsString (:337) has no typeof-function arm. _callableToSourceString (testing/assertions.ts:345-361) still returns rbAnyToS and strips return/;. Unblock when that 0154 story lands."
closed-reason: null
---

## Context

Surfaced by trails#7998. Rails' `_callable_to_source_string`
(`vendor/rails/activesupport/lib/active_support/testing/assertions.rb:329-358`)
returns the source only for a `{ … }` Proc body that is single-line and takes
no arguments, and otherwise returns the **callable itself**, which the rich
message's `"`#{code_string}`"` interpolation renders through `to_s`.

trails' `_callableToSourceString`
(`packages/activesupport/src/testing/assertions.ts`) diverges twice:

- it returns `rbAnyToS(callable)` — a String — where Rails returns the callable,
  because the interpolation sites use a JS template literal and JS `String(fn)`
  is the function source, not `Proc#to_s`;
- it strips a leading `return` keyword and a trailing `;` from a brace body, an arm
  Rails does not have.

The parked-then-unparked test `assert no changes message with not real callable`
(`test_case_test.rb:470-481`) ports Ruby's `check = Object.new; def check.call`
as a plain object literal, which ruby-compat reads as a Hash.

## Converged shape

- `_callableToSourceString` returns `callable` on every non-source arm, and the
  interpolation sites in `assertDifference` / `assertChanges` /
  `assertNoChanges` render `codeString` through `rbObjAsString`, once
  `rbObjAsString` has a Proc arm (see `rb-obj-as-string-has-no-proc-arm`).
- Drop the `return` / `;` stripping, or tie it to a documented TS-only spelling
  of Ruby's `{ expr }` body.

## Acceptance criteria

- [ ] Body mirrors `assertions.rb:329-358` arm for arm.
- [ ] The `test_case_test.rb` message tests stay green with unchanged bodies.
