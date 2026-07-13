---
title: "has_one polymorphic/cpk shapes"
status: done
updated: 2026-07-13
rfc: "0005-activerecord-gaps"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4831
claim: "2026-07-13T16:49:24Z"
assignee: "d2-has-one-poly-cpk-shapes"
blocked-by: null
closed-reason: null
---

## Context

Split from `d2-has-one-remaining-gaps`. Polymorphic / cpk has_one shapes in
`packages/activerecord/src/associations/has-one-associations.test.ts`:
`nullify on polymorphic association`, `nullification on cpk association`,
`with polymorphic has one with custom columns name`,
`composite primary key malformed association (owner) class`.

Rails: `has_one_associations_test.rb`
`test_with_polymorphic_has_one_with_custom_columns_name` (needs Image model,
main_image polymorphic has_one), plus polymorphic/cpk nullify and the
malformed-cpk-association ArgumentError checks.

## Acceptance criteria

- [ ] Polymorphic has_one custom-column + nullify, cpk nullify, and malformed
      cpk association-class validation implemented.
- [ ] Listed tests un-skipped with verbatim Rails names; test:compare delta
      non-negative.
