---
title: "mutation_test value-method families are hardcoded lists, not derived from the relation constants"
status: done
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: trails#8072
claim: "2026-09-25T01:04:13Z"
assignee: "migration-test-inline-adapter-branches"
blocked-by: null
closed-reason: null
---

## Context

Shipped in trails#7911 (`assertions-tail-root-2-rem`). The file reports 0
assertion mismatches, because the comparer scores the two generated families as
one test each — so this gap is invisible to `parity:test --assertions` and needs
its own story.

Rails generates one test per value method, from the relation's own constant
lists (`relation/mutation_test.rb:8-12`, `:54-58`):

```ruby
(Relation::MULTI_VALUE_METHODS - [:extending, :order, :unscope, :select, :with]).each do |method|
  test "##{method}!" do
    assert relation.public_send("#{method}!", :foo).equal?(relation)
    assert_equal [:foo], relation.public_send("#{method}_values")
  end
end

(Relation::SINGLE_VALUE_METHODS - [:lock, :reordering, :reverse_order, :create_with, :skip_query_cache, :strict_loading]).each do |method|
  test "##{method}!" do
    assert relation.public_send("#{method}!", :foo).equal?(relation)
    assert_equal :foo, relation.public_send("#{method}_value")
  end
end
```

`packages/activerecord/src/relation/mutation.test.ts` instead hard-codes two
literal arrays inside a single `it("#!")` each:

- `MULTI` lists 9 pairs by hand, where Rails derives its set by subtracting 5
  names from `Relation::MULTI_VALUE_METHODS`.
- `SINGLE` lists 4 entries by hand AND passes a per-method argument
  (`["limitBang", 5, "limitValue", 5]`, `["readonlyBang", true, …]`) where
  Rails passes `:foo` to every one and asserts `:foo` back.

Two costs: any value method Rails covers but the literal list omits is
untested, and the hand-picked arguments mean the generated tests no longer
assert what Rails asserts (`:foo` round-tripping through the writer).

`Relation.MULTI_VALUE_METHODS` and `Relation.SINGLE_VALUE_METHODS` already
exist in trails (`packages/activerecord/src/relation.ts:273`, `:290`), so the
converged shape is available: derive both sets by subtracting Rails' exclusion
lists, and pass `"foo"` uniformly.

Expect the derivation to surface real failures — that is the point of the
story. A value method that cannot take `"foo"` is either a port bug to fix or a
name Rails excludes and trails does not; resolve each on its merits and file
what does not belong here. Do not re-hardcode the list to make it pass.

Note the test NAMES are generated from the method name in Rails (`#limit!`,
`#offset!`, …) while the port emits a single `#!` per family; `parity:test`
currently matches them as `#!`. Check how the comparer credits the generated
family before changing the `it` titles, so the file does not lose matches.

## Acceptance criteria

- Both families are derived from `Relation.MULTI_VALUE_METHODS` /
  `Relation.SINGLE_VALUE_METHODS` minus Rails' exclusion lists, with `"foo"`
  passed to every writer, matching `mutation_test.rb:8-12` and `:54-58`.
- `relation/mutation_test.rb` still reports 0 count/kind/value mismatches and
  loses no matched tests.
- Failures the derivation surfaces are fixed or filed, not papered over by
  shrinking the derived set.
