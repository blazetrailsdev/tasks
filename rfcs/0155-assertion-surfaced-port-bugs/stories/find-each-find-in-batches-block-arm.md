---
title: "find-each-find-in-batches-block-arm"
status: draft
updated: 2026-09-19
rfc: "0155-assertion-surfaced-port-bugs"
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

`Relation#find_each` and `#find_in_batches` each have TWO arms in Rails and trails ported only
one. Rails `activerecord/lib/active_record/relation/batches.rb:85-97` (`find_each`) and
`:99-160` (`find_in_batches`) both open with `if block_given?` and fall through to `enum_for`
only when no block is passed; the block arm returns `nil`.

trails' `Batches#findEach` (`packages/activerecord/src/relation/batches.ts:15-52`) and
`#findInBatches` (`:54-100`) take no block parameter at all and always return the enumerator.
`inBatches` in the same file already has the block overload
(`packages/activerecord/src/relation/batches.ts:103-124`), so the shape to mirror is settled
and lives two methods down.

Surfaced by RFC 0132: `batches_test.rb > each should not return query chain and execute only one
query` is the one assertion mismatch left in that file and it cannot be ported without the block
arm. Rails
(`vendor/rails/activerecord/test/cases/batches_test.rb:26-31`):

```ruby
assert_queries_count(1) do
  result = Post.find_each(batch_size: 100000) { }
  assert_nil result
end
```

There is no `result` to assert on until `findEach` accepts a block.

## Acceptance criteria

- `findEach` and `findInBatches` each grow the block overload, mirroring `inBatches`' existing
  overload shape and Rails' branch order (block arm first, `enum_for` arm second).
- The block arm returns nothing, so the Rails `assert_nil result` arm ports.
- `packages/activerecord/src/querying.ts:713-725` forwards the block for both.
- `batches_test.rb` reports 0 assertion mismatches once
  `each should not return query chain and execute only one query` is ported with the block form.
- `pnpm parity:api:calls`, `pnpm parity:api:calls:args` and `pnpm parity:api:extra:gate` stay green.
