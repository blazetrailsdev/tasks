---
title: "A nested describe's fixtures() class inherits its parent's whichever is called first"
status: draft
updated: 2026-10-13
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`fixtures()` in `packages/activerecord/src/test-fixtures.ts` gives each
describe that calls it an `ActiveRecord::TestCase` subclass, registered in
`describedClasses` (`packages/activesupport/src/testing/autorun.ts`).
`testCaseClassFor` makes that class extend the class of the nearest enclosing
describe already registered, falling back to the file's root class.

In Rails a nested test class inherits from its parent whatever order their
bodies run in, and `fixtures :a` on the parent is a `class_attribute` write the
child reads (`vendor/rails/v8.0.2/activerecord/lib/active_record/test_fixtures.rb`,
`fixture_table_names`). In trails the parent is looked up when the child's
`fixtures()` runs. A describe whose nested describe calls `fixtures()` before
the outer one does gets a child that extends the root class, so the outer
describe's fixture sets, `usesTransaction` names and `useTransactionalTests`
never reach it. Before trails#8868 the parent's class was created on demand, so
the order did not matter.

## Acceptance criteria

- [ ] A nested describe's test case class inherits from its enclosing
      describe's class regardless of which `fixtures()` call runs first, with a
      case in `test-fixtures.test.ts` that calls the inner one first.
