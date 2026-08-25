---
title: "collect_ctes hoists a node local behind a typeof guard where Rails visits child.to_cte"
status: done
updated: 2026-08-11
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 6379
claim: "2026-08-11T21:26:07Z"
assignee: "burndown-order-only-rows-associations-remainder"
blocked-by: null
closed-reason: null
---

## Context

The last open `naming` row on `packages/arel/src/visitors/to-sql.ts` after
PR #6371 converged the other nine (`converge-to-sql-visitor-call-arguments`,
RFC 0099). The other two remaining rows are filed separately as
`arel-visitor-to-s-belongs-in-adapter-quoting` (0023).

```text
collect_ctes -> visit   ruby: [ref:to_cte, ref:collector]   ts: [ref:node, ref:collector]
```

Rails (`vendor/rails/activerecord/lib/arel/visitors/to_sql.rb:1023-1030`):

```ruby
def collect_ctes(children, collector)
  children.each_with_index do |child, i|
    collector << ", " unless i == 0
    visit child.to_cte, collector
  end

  collector
end
```

trails (`packages/arel/src/visitors/to-sql.ts`, `collectCtes`) hoists a `node`
local and guards the `to_cte` call behind a typeof check:

```ts
const node =
  typeof (child as { toCte?: () => Node }).toCte === "function"
    ? (child as { toCte: () => Node }).toCte()
    : (child as Node);
this.visit(node, collector);
```

Rails calls `child.to_cte` unconditionally — every element of `children` is a
`Nodes::Cte` or something answering `to_cte`, and a child that does not is a
`NoMethodError` there, not a silent pass-through. The `typeof` guard is a trails
invention that makes a malformed WITH clause render as its raw child instead of
failing, and the hoisted `node` local is what the naming row reports.

## Converged shape

```ts
children.forEach((child, i) => {
  if (i > 0) collector.append(", ");
  this.visit(child.toCte(), collector);
});
```

with `children` typed as the `toCte`-answering node it actually is. Check first
whether any caller passes a bare `Node` — `visitArelNodesWith` /
`visitArelNodesWithRecursive` pass `o.children` — and if one legitimately does,
that is a defect in the NODE construction (a child that was never converted to a
Cte), which should be filed and fixed there rather than absorbed by a guard in
the visitor.

## Acceptance criteria

- [ ] `collect_ctes` visits `child.to_cte()` unconditionally, with no hoisted
      local, cited to `to_sql.rb:1026`.
- [ ] The `typeof ... === "function"` fallback is removed, or the caller that
      needs it is fixed and the reason recorded at the call site.
- [ ] The `naming` row leaves `pnpm parity:api:calls:args:report`; to-sql.ts
      drops from 3 rows to 2 (the two `to_s` rows filed separately).
- [ ] arel visitor tests green, including the WITH / WITH RECURSIVE cases.
