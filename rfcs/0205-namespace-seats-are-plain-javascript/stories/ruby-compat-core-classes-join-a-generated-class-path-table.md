---
title: "ruby-compat's core classes resolve through a generated class-path table, not registerConstant"
status: done
updated: 2026-10-29
rfc: "0205-namespace-seats-are-plain-javascript"
cluster: retire
packages: ["ruby-compat"]
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: trails#9419
claim: "2026-10-28T20:49:20Z"
assignee: "application-classes-resolve-without-a-registration-call"
blocked-by: null
closed-reason: null
---

## Context

`packages/ruby-compat/src/variable.ts:400` onward seats Ruby's core classes
(`BasicObject`, `Object`, `Array`, the exception tree, `Hash`, `Range`,
`Rational`, `Struct`, ...) with 36 `registerConstant` calls, so `constantize`,
`rbPathToClass` (Psych / Marshal revival) and `rbConstGet` can find them.
ruby-compat has no `class-paths.generated.ts` (every other package has one,
from `derive-class-path-from-registered-namespaces`), because its classes
have no Rails counterpart in `rails-api.json`. MRI's own class tree
(`vendor/ruby/v3.3.11`) is the source of their paths instead.

Related: `0154/core-constant-seats-live-in-variable-ts-and-do-not-survive-reset`,
`0154/rb-path-to-class-resolves-no-core-class`,
`0154/symbol-seat-contradicts-readme-symbol-is-not-a-class-object`.

## Acceptance criteria

- [ ] ruby-compat has a checked-in class-path table for its core classes,
      generated (or verified in CI) from a list keyed by the MRI `Init_*`
      `rb_define_class` site of each class, not hand-maintained.
- [ ] `variable.ts` makes no `registerConstant` call; `constantize`,
      `rbPathToClass` and `rbConstGet` resolve core classes through the table.
- [ ] `reopened` (`packages/ruby-compat/src/object.ts:157`) answers from the
      table, so a gem reopening a core class (`class Date extends rbCDate`)
      still resolves to one class.
- [ ] Psych and Marshal round-trip tests for a core class pass unchanged.
