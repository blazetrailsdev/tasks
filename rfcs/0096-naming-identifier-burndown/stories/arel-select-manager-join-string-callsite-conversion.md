---
title: "SelectManager#join wraps a String relation where Rails passes it through"
status: done
updated: 2026-08-18
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 6714
claim: "2026-08-18T19:32:44Z"
assignee: "converge-includes-preload-colon-sweep-src-top-level"
blocked-by: null
closed-reason: null
---

## Context

`SelectManager#join` (`packages/arel/src/select-manager.ts:207-227`) converts a
String `relation` into a `SqlLiteral` before handing it to `createJoin`:

```ts
if (typeof relation === "string" || relation instanceof SqlLiteral) {
  const text = typeof relation === "string" ? relation : relation.value;
  if (text.length === 0) throw new EmptyJoinError();
  klass = StringJoin as unknown as new (left: Node, right: Node | null) => Join;
}

if (typeof relation === "string") relation = new SqlLiteral(relation); // <- no Rails counterpart

this.core.source.right.push(this.createJoin(relation, null, klass));
```

Rails passes `relation` straight through
(`vendor/rails/activerecord/lib/arel/select_manager.rb:102-113`):

```ruby
def join(relation, klass = Nodes::InnerJoin)
  return self unless relation

  case relation
  when String, Nodes::SqlLiteral
    raise EmptyJoinError if relation.empty?
    klass = Nodes::StringJoin
  end
  @ctx.source.right << create_join(relation, nil, klass)
  self
end
```

`Nodes::StringJoin` (`arel/nodes/string_join.rb:5-9`) stores `left` as given and
`visit_Arel_Nodes_StringJoin` (`arel/visitors/to_sql.rb:528-530`) visits it, so
in Rails the raw String reaches the node. This is the same a3 (conversion moved
to the caller) that `arel-create-string-join-callsite-conversion` (PR #6708)
just converged out of `FactoryMethods#createStringJoin`; that PR was scoped to
`factory-methods.ts` and deliberately left this sibling standing rather than
propagating or widening its scope.

`Table#join` (`packages/arel/src/table.ts:90-107`) does NOT carry the same
conversion — it forwards to `SelectManager#join` — so this is the one remaining
site. trails' `visit()` dispatches on runtime type including `string`
(`packages/arel/src/visitors/visitor.ts:50`), and `visitString` is aliased to
`unsupported` exactly as Rails' `visit_String` is (`to-sql.ts:1514-1515`,
`to_sql.rb:842`), so removing the wrap keeps trails' rendering behaviour
identical to MRI's for both the literal and the raw-String case.

## Converged shape

Delete the `if (typeof relation === "string") relation = new SqlLiteral(relation);`
line from `SelectManager#join`, so the body is the `case` guard plus the push,
matching `select_manager.rb:102-113` statement for statement.

Two things to check while converging:

- `select-manager.trails.test.ts:32` ("promotes a bare string relation to a
  StringJoin") asserts only `instanceof Nodes.StringJoin`, which survives; it may
  be worth asserting `left` is the raw String, as Rails stores it.
- Whether any AR caller depends on `joinSources()[n].left` being a `SqlLiteral`
  rather than a String — `alias-tracker.ts:115`, `relation.ts:1247` and
  `join-association.ts:305` all branch on `instanceof Nodes.StringJoin`, not on
  the left's type, but the AR suite is the check that matters.

## Acceptance criteria

- [ ] `SelectManager#join` passes `relation` through unconverted.
- [ ] No new `shape` row on the call-argument gate; any `naming` row for
      `select-manager.ts` `create_join` is retired.
- [ ] Arel and ActiveRecord to_sql tests covering a string join pass on all
      three adapters.
