---
title: "assertions-has-many-associations-remainder-13"
status: draft
updated: 2026-09-22
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

Twelfth slice of `assertions-has-many-associations-remainder`. `assertions-has-many-associations-remainder-12` converged every portable row of `packages/activerecord/src/associations/has-many-associations.test.ts` except the four below (parked `async load has many` on `association-async-load-target-uses-async-executor`).

Measure: `pnpm parity:test -- --package activerecord --assertions --missing | grep has_many_associations_test` (4 rows at hand-off).

Still unported (vendor/rails/activerecord/test/cases/associations/has_many_associations_test.rb):

- calling empty with counter cache (rb:~2040, `assert_no_queries { assert_not_empty post.comments }`), calling empty on an association that has not been loaded performs a query (rb:3068), calling empty on an association that has been loaded does not performs query (rb:3083). Blocker: `assertEmpty` / `assertNotEmpty` (`packages/activesupport/src/testing/assertions.ts:429-436`, via `isEmptyCollection` at `:479`) are synchronous and call `isEmpty()` expecting a boolean; `CollectionProxy#isEmpty` returns a Promise, so `assertEmpty(proxy)` always passes and `assertNotEmpty(proxy)` always fails. Minitest's `assert_empty` is `assert_respond_to obj, :empty?; assert obj.empty?` — the trails helper needs a thenable-aware arm (await `isEmpty()` when it returns a PromiseLike) so these rows port as `await assertNotEmpty(car.bulbs)` without loading the target (which would break the query-count assertions: Rails' unloaded `empty?` is `!exists?`, relation.rb:352-369 / collection_association.rb `empty?`).
- association proxy transaction method starts transaction in association class (rb:2506): `assert_called(Comment, :transaction)` — transaction proxy blocker.

## Acceptance criteria

- 0 assertion count/kind/value mismatches for the file, or a converged slice plus a re-filed remainder.
- `assertEmpty` / `assertNotEmpty` await a thenable `isEmpty()` (or a sibling story is filed for it) and the three calling-empty rows port with Rails' query counts intact.
- Parked tests use `it.skip` with a `BLOCKED:` line.
