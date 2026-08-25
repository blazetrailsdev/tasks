---
title: "Converge composite-PK id= to raise TypeError for scalar assignment"
status: done
updated: 2026-07-15
rfc: "0053-composite-pk-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: 4
pr: 4781
claim: "2026-07-08T11:31:55Z"
assignee: "converge-cpk-scalar-id-assignment-typeerror"
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::AttributeMethods::CompositePrimaryKey#id=`
(`vendor/rails/activerecord/lib/active_record/attribute_methods/composite_primary_key.rb:26-31`)
raises `TypeError` unconditionally when the assigned value is not Enumerable —
even on a table that also has a literal `id` column:
`raise TypeError, "Expected value matching #{primary_key.inspect}, got #{value.inspect}."`.

trails deliberately keeps a scalar `id` on a _model-level_ composite PK lenient:
`_applyCompositePrimaryKey` (`packages/activerecord/src/base.ts`) and `setId`
(`packages/activerecord/src/attribute-methods/primary-key.ts:115-131`) write a
scalar straight to the real `id` column instead of raising. This is because the
suite-wide cpk convention passes key parts as scalars —
`CpkBook.create({ author_id, id: 7 })`, `CpkOrder.create({ shop_id, id: 2 })` —
across dozens of call sites in eager/collection-proxy/has-many/timestamp tests.
Rails' own tests instead pass the composite as an array: `Cpk::Order.create!(id:
[1, 2], status: "paid")` (`associations_test.rb:85`), `::Cpk::Order.create(id:
[1, 123_456])` (`attribute_methods_test.rb:64`).

Surfaced by PR #4706 (converge-construction-unknown-attribute-strict), which kept
this leniency in scope-note form rather than converging it.

## Acceptance criteria

- [ ] `setId` raises `TypeError` for a non-array value on a composite PK, matching
      `CompositePrimaryKey#id=` (message parity: `Expected value matching
[shop_id, id], got 5.`).
- [ ] Migrate every scalar-`id` cpk construction/create call site in the test
      suite to the Rails array form (`id: [a, b]`) — or split into the individual
      key columns where that is what the test means.
- [ ] `_applyCompositePrimaryKey`'s scalar-write branch is removed; the deferred
      composite-PK `id` path only spreads arrays.
- [ ] Full cpk-touching suites stay green (eager, collection-proxy, has-many,
      nested-attributes, primary-keys, PG/MySQL adapter cpk tests).
