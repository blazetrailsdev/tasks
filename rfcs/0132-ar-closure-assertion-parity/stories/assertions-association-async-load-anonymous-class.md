---
title: "assertions-association-async-load-anonymous-class"
status: draft
updated: 2026-09-17
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Remainder of `assertions-belongs-to-has-one-inverse` (the bundle PR brought
belongs_to / has_one / has_one_through / inverse to 0 except these rows):

- `belongs_to_associations_test.rb` `async load belongs to` and
  `has_one_associations_test.rb` `async load has one` (rails 5 vs trails 2): Rails asserts
  `events.first.payload[:async] == true` after `async_load_target` +
  `wait_for_async_query` (`belongs_to_associations_test.rb:1851-1873`). trails'
  `Association#asyncLoadTarget` (`associations/association.ts`) just awaits
  `loadTarget()`, so no async-executor event exists to assert on.
- `belongs_to_associations_test.rb` `default scope on relations is not cached`
  (`:227-253`): needs `capture_sql_and_binds` in `testing/sql-capture.ts` and an
  `anonymous_class:` association built on a class-expression model.

## Acceptance criteria

- The three rows report 0 count / kind / value mismatches in
  `pnpm parity:test -- --package activerecord --assertions`.
- activerecord row of the assertion mark lowered; no test renames.
