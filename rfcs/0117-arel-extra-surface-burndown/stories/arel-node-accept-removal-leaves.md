---
title: "Delete invented per-node accept from the leaf Arel node classes"
status: done
updated: 2026-08-22
rfc: "0117-arel-extra-surface-burndown"
cluster: null
packages: ["arel"]
deps: []
deps-rfc: []
est-loc: 160
priority: 2
pr: 6857
claim: "2026-08-22T12:50:36Z"
assignee: "arel-to-sql-compile-unification"
blocked-by: null
closed-reason: null
---

## Context

Rails' Arel nodes define **no** `accept`. `grep -rn "def accept"` over
`vendor/rails/activerecord/lib/arel/` returns exactly two hits:
`vendor/rails/activerecord/lib/arel/visitors/visitor.rb:10` and
`vendor/rails/activerecord/lib/arel/visitors/dot.rb:28`. Node visiting is
`Visitor#visit` → `dispatch[object.class]` (visitor.rb:28-37).

trails ports that faithfully — `packages/arel/src/visitors/visitor.ts:102-121`
resolves the handler through the constructor-keyed `dispatchCache` and **never
calls `node.accept`**. On top of it, 36 node classes carry an invented
double-dispatch method:

```ts
// packages/arel/src/nodes/false.ts — the whole class body
export class False extends NodeExpression {
  accept<T>(visitor: NodeVisitor<T>): T {
    return visitor.visit(this);
  }
}
```

Rails' counterpart is `class False < Node; end`
(`vendor/rails/activerecord/lib/arel/nodes/false.rb`).

`accept` shows as **moved** on ~36 arel files in
`pnpm parity:api:extra --package arel` (matching `Arel::Visitors::Visitor#accept`
in a different `.rb`) — roughly 36 of the package's 258 extras. The abstract
declaration is `packages/arel/src/nodes/node.ts:26`, and the `NodeVisitor`
type it depends on is `nodes/node.ts:8`.

Disposition set by the RFC: **delete** (triage category 1).

This is story 1 of 2, splitting the 36 files to stay under the LOC ceiling.

## Scope — this story

The **leaf node files whose `accept` is the entire class body or the only
extra**, i.e. every `nodes/*.ts` whose `parity:api:extra` row is exactly
`MOVED: accept`:

`nodes/bind-param.ts`, `nodes/bound-sql-literal.ts`, `nodes/casted.ts`,
`nodes/comment.ts`, `nodes/cte.ts`, `nodes/delete-statement.ts`,
`nodes/false.ts`, `nodes/full-outer-join.ts`, `nodes/function.ts`,
`nodes/homogeneous-in.ts`, `nodes/inner-join.ts`, `nodes/insert-statement.ts`,
`nodes/nary.ts`, `nodes/outer-join.ts`, `nodes/regexp.ts`,
`nodes/right-outer-join.ts`, `nodes/select-core.ts`, `nodes/string-join.ts`,
`nodes/terminal.ts`, `nodes/true.ts`, `nodes/update-statement.ts`.

Leave `nodes/node.ts`'s abstract declaration and the `NodeVisitor` type in
place for the sibling story — deleting them here would break the files it
still owns.

A class left with an empty body is the **correct** outcome; it is what Rails
has. Do not invent a member to fill it.

## Acceptance criteria

- `accept` removed from every file listed above; no `visitor.visit(this)`
  wrapper survives in them.
- `pnpm parity:api:extra --package arel` total drops by **21** (one per file);
  novel unchanged; those files leave the drift list entirely.
- `pnpm parity:api` arel deltas non-negative.
- Targeted vitest run over the arel visitor/to-sql suites green
  (`pnpm vitest run packages/arel/src/visitors`).
- No new `@noRailsEquivalent` tag.
