---
title: "assert-raises-does-not-register-with-vitest"
status: done
updated: 2026-09-24
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: trails#7930
claim: "2026-09-24T17:44:04Z"
assignee: "activesupport-time-with-zone-subnanosecond-fractions"
blocked-by: null
closed-reason: null
---

## Context

Sibling of [[assert-nothing-raised-does-not-register-with-vitest]] — same root
cause, different helper.

Minitest's `assert_raises`
(`vendor/rails/activesupport/lib/active_support/testing/assertions.rb` callers;
the builtin is `minitest/lib/minitest/assertions.rb`) increments the assertion
counter, so a Ruby test whose only assertion is `assert_raise(...) { ... }` is
never reported as assertion-less.

trails' `assertRaises` / `assertRaise`
(`packages/activesupport/src/testing/assertions.ts:119-145`) calls the local
`assert()` (`:341`), which does not register with vitest's assertion counter. A
test whose only assertion is `await assertRaise([...], {}, () => ...)` therefore
prints trails' own ported warning from
`packages/activesupport/src/testing/tests-without-assertions.ts:16`:

```text
Test is missing assertions: `multiparameter attributes setting time but not date on date field`
```

Seen on `packages/activerecord/src/multiparameter-attributes.test.ts`'s
`multiparameter attributes setting time but not date on date field`, the port of
`vendor/rails/activerecord/test/cases/multiparameter_attributes_test.rb:331-335`,
whose Rails body is a bare `assert_raise(ActiveRecord::MultiparameterAssignmentErrors)`
with nothing after it. Rails does not warn there; trails does.

The warning is noise only — it does not fail the run — but it makes a faithful
one-assertion port look defective, which pushes ports toward adding an `expect`
Rails has no counterpart for.

## Acceptance criteria

- `assertRaises` / `assertRaise` register one assertion with vitest, so the
  "Test is missing assertions" warning disappears for a test whose only
  assertion is one of them.
- `multiparameter attributes setting time but not date on date field` no longer
  warns, with its body unchanged.
