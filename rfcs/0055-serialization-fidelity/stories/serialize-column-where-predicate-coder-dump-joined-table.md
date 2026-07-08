---
title: "Serialize joined-table serialized-column WHERE predicates via coder (nested-hash conditions)"
status: ready
updated: 2026-07-08
rfc: "0055-serialization-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails' query layer does not coder-serialize a serialized-column predicate that
targets a **joined / referenced table** (nested-hash condition), so the WHERE
binds the raw user value and never matches the coder-dumped stored form.

Surfaced in `packages/activerecord/src/serialization.test.ts` "find records by
serialized attributes through join" (PR #4738): the test must pass the
pre-serialized `"Hello\n"` on the join predicate to match, instead of the raw
`"Hello"` Rails uses:

```ts
Author.joins("serializedPosts").where({
  name: "David",
  serialized_posts: { title: "Hello\n" }, // trails: pre-serialized; Rails: "Hello"
});
```

Rails serializes the predicate value through the column's coder in the predicate
builder regardless of whether the column is on the primary or a referenced
table. The sibling story `serialize-column-where-predicate-coder-dump` (0055,
done) fixed this for the **primary model's** attributes
(`validations/uniqueness.ts` / `Relation#where` on own columns) but not for a
nested-hash condition on a joined table's serialized column.

Relevant:

- `packages/activerecord/src/serialization.test.ts` — join test comment marks
  the deviation.
- Rails predicate builder: `activerecord/lib/active_record/relation/predicate_builder.rb`
  (associations/relation handlers) resolves the referenced table's attribute
  type and casts/serializes through it.
- trails predicate/where handling for nested-hash (`serialized_posts: {...}`)
  conditions — locate where the joined-table attribute type is (not) consulted.

## Acceptance criteria

- [ ] A serialized-column predicate on a joined/referenced table
      (`joins(...).where({ other_table: { serialized_col: value } })`) serializes
      `value` through that column's coder, matching Rails.
- [ ] The `serialization.test.ts` join test passes with the raw Rails value
      (`serialized_posts: { title: "Hello" }`), not the pre-serialized
      `"Hello\n"`.
- [ ] No regression to primary-table serialized WHERE predicates
      (`serialize-column-where-predicate-coder-dump`).
