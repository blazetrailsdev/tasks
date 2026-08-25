---
title: "Merger#qualifyOrderForOther rewrites bare-string orders Rails leaves untouched"
status: closed
updated: 2026-08-18
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Already converged: qualifyOrderForOther and bareColumn are gone from relation/merger.ts; merger.ts:212-217 now copies other.orderValues verbatim through reorderBang/orderBang, so a bare-string order arg stays bare across a cross-model merge."
---

## Context

Surfaced while converging `order!`/`reorder!` onto `preprocessOrderArgs` (PR #5937).

`Merger#qualifyOrderForOther`
(`packages/activerecord/src/relation/merger.ts`) re-qualifies a cross-model
relation's order clauses against _its_ table before copying them onto the
receiver. That was the right fix for the failure covered by the completed story
`merge-cross-model-order-qualification` (PR #4161), back when trails stored
order values raw and qualified them late.

After #5937 the premise has changed. Symbol and Hash order args are now resolved
to fully-qualified Arel nodes at `order!` time, exactly as Rails' `order_values`
holds them, so the node branch of `qualifyOrderForOther` is a no-op passthrough
and cross-model merges qualify correctly on their own. Its `[col, dir]` tuple
branch was deleted in #5937 as dead.

What remains is a **bare-string** branch that Rails does not have:

```ts
if (typeof clause === "string") {
  const m = bareColumn(clause);
  return m ? asNode(m[1], m[2] ?? "asc") : clause;
}
```

Rails leaves String order args untouched in `order_values`
(`preprocess_order_args`' `else` branch) and `Merger#merge` copies them
verbatim, so `Post.merge(Author.order("name"))` orders by the bare `name`.
trails rewrites that string into `"authors"."name"`. This is the same
string-stays-bare rule that `relation-order-string-arg-stays-bare` (PR #4952)
established for the forward path, not yet applied to the merge path.

Deliberately left out of #5937's scope as an independent behavior change on a
path with its own test coverage.

## Acceptance criteria

- [ ] Determine whether the bare-string branch of `qualifyOrderForOther` is
      still load-bearing for any test now that Symbol/Hash args arrive
      pre-qualified; if not, delete it so strings stay bare as Rails leaves them.
- [ ] If some test does depend on it, port the corresponding Rails merge test
      from `relation/merging_test.rb` and confirm which behavior Rails actually
      produces before keeping or changing it.
- [ ] `merging.test.ts`'s MergingDifferentRelationsTest cases stay green.
- [ ] If the branch is deleted, `qualifyOrderForOther` reduces to a passthrough
      and should be removed entirely rather than left as an identity function.
