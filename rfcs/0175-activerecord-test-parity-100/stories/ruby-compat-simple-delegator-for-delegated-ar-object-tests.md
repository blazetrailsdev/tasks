---
title: "ruby-compat-simple-delegator-for-delegated-ar-object-tests"
status: ready
updated: 2026-10-13
rfc: "0175-activerecord-test-parity-100"
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

`relations_test.rb:835-847` (`test_where_id_with_delegated_ar_object`, `test_where_relation_with_delegated_ar_object`) builds `decorator = Class.new(SimpleDelegator)` and passes `decorator.new(author)` to `where(id:)` / `where(author:)`, as a scalar and inside an Array. Rails reaches the id through `value.respond_to?(:id)` (`activerecord/lib/active_record/relation/predicate_builder.rb:57`) and `AssociationQueryValue#convert_to_id` (`relation/predicate_builder/association_query_value.rb:60`), which a Delegator forwards while `is_a?(Base)` stays false.

ruby-compat ports only `DelegateClass` (`packages/ruby-compat/src/delegate.ts:86`). An instance of `DelegateClass(Author)` has `Author.prototype` on its chain, so `x instanceof ActiveRecord.Base` in `ArrayHandler#call` (`packages/activerecord/src/relation/predicate-builder/array-handler.ts`) is true where Ruby's `x.is_a?(Base)` is false, and it is not `Class.new(SimpleDelegator)`. `SimpleDelegator` / `Delegator` (`vendor/ruby/v3.3.11/lib/delegate.rb:39-343`) has no port.

Both tests are parked as `it.skip` in `packages/activerecord/src/relations.test.ts`, with a per-test entry in `scripts/parity/unported-files/unscoped.ts` naming this story. The sibling `find by with delegated ar object` is live but wraps the record in a bare `new Proxy(record, {})` instead of a SimpleDelegator.

## Acceptance criteria

- [ ] ruby-compat exports `SimpleDelegator` (and the `Delegator` it inherits from), ported from `delegate.rb` with MRI citations, over `methodMissingProxy`.
- [ ] `where id with delegated ar object` and `where relation with delegated ar object` are live with Rails' bodies, and their `unscoped.ts` entry is deleted.
- [ ] `find by with delegated ar object` uses `SimpleDelegator` in place of its bare `Proxy`.
