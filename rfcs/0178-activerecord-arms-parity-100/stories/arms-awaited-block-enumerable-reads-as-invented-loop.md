---
title: "arms report: an awaited collect / any? block reads as an invented loop"
status: in-progress
updated: 2026-10-07
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: trails#8618
claim: "2026-10-07T09:33:13Z"
assignee: "permissions-policy-macro-clones-and-assigns-the-request-policy"
blocked-by: null
closed-reason: null
---

## Context

A Ruby block-taking Enumerable call whose block does I/O cannot be ported to the JS method of the same name, because the callback would return a promise: `attributes.collect { |attr| _create_record(attr, raise, &block) }` (`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/collection_association.rb:361`) is `for (const attr of attributes) records.push(await this._createRecord(...))`, and `assoc.reader.any? { |source| … }` (`collection_association.rb:508-516`) is a `for … of` whose `if` returns `true`. The arms report reads the first as `+loop` and the second as `+loop +if`.

`SKELETON_IDIOM_LOWERINGS` (`scripts/api-compare/enumerable-idioms.ts`) deliberately leaves `map` / `collect` / `any?` out, because a synchronous port keeps the call. So these rows are extractor false positives the table cannot express today. Receipted `@inventedArm … — CONVERGEABLE` against this story:

- `CollectionAssociation#_createRecord` — `loop`
- `CollectionAssociation#isIncludeInMemory` — `loop`, `if`

`Persistence::ClassMethods#create` / `create!` (`packages/activerecord/src/persistence.ts`, Rails `persistence.rb:33-58`) have the same `for … push(await …)` shape.

## Acceptance criteria

- [ ] The skeleton fold credits a Ruby `collect` / `map` / `any?` / `all?` / `none?` block as a `loop` (plus the `if` an early-returning predicate needs) only when the TS body shows an `await` inside the loop it is spent on, with unit tests in `scripts/api-compare/fold-skeleton-tokens.test.ts` for the fold and for a synchronous port that must still read as a missing call.
- [ ] The effect on every package's arms report is recorded in the PR body.
- [ ] The receipts naming this story are deleted and the rows stay clear.
