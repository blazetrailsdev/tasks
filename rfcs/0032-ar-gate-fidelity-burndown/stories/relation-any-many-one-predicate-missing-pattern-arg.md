---
title: "Relation#any?/many?/one? drop the Enumerable pattern-arg form"
status: claimed
updated: 2026-07-23
rfc: "0032-ar-gate-fidelity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: "2026-07-23T20:38:46Z"
assignee: "relation-any-many-one-predicate-missing-pattern-arg"
blocked-by: null
closed-reason: null
---

## Context

Follow-up to relation-none-predicate-misses-empty-fallback (#5165), which
taught `Relation#isNone` the Rails pattern-arg form (`none?(Comment)`).

Rails `Relation#any?/many?/one?` (vendor/rails/activerecord/lib/active_record/
relation.rb:390-427) all `return super if args.present? || block_given?`,
deferring to `Enumerable#any?/many?/one?(pattern)` which uses `pattern ===
element` case-equality. trails' `Relation#isAny`/`isMany`/`isOne`
(packages/activerecord/src/relation.ts) accept no argument at all — only the
COUNT/loaded-length fast path — so `Post.all().any?(Comment)` is unreachable.
(`CollectionProxy#many`/`one` take a predicate but not a class pattern, and
`isAny` takes nothing.)

Mirror the `isNone` fix: widen `isAny`/`isMany`/`isOne` to accept
`((record: T) => boolean) | (new (...args) => Base)`, dispatch on the
`_isActiveRecordBase` static sentinel for class patterns vs `some`/counting for
predicates, and thread the arg through the `Querying` delegators
(`querying.ts`). Port the corresponding Rails `relations_test.rb` assertions
(`test_any?`, `test_many?`, `test_one?`) that exercise the pattern/block forms.

## Acceptance criteria

- `isAny`/`isMany`/`isOne` accept the predicate + class-pattern forms as Rails does.
- `Querying` delegators forward the pattern arg.
- Rails' `relations_test` any?/many?/one? pattern/block assertions pass unmodified names.
