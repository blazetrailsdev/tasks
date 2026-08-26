---
title: "Nodes::Node is declared abstract, so Rails' Node.new test bodies need a cast"
status: in-progress
updated: 2026-08-26
rfc: "0124-arel-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: 7092
claim: "2026-08-26T16:11:48Z"
assignee: "arel-nodes-node-is-abstract-but-rails-instantiates-it"
blocked-by: null
closed-reason: null
---

## Context

`Arel::Nodes::Node` is an ordinary instantiable class in Rails
(`vendor/rails/activerecord/lib/arel/nodes/node.rb:8`), and the Rails test suite
constructs one directly:

```ruby
# test/cases/arel/nodes/node_test.rb:7
assert Arel::Nodes::Node.new.respond_to?(:create_join)

# test/cases/arel/nodes/bind_param_test.rb:14
_(BindParam.new(nil)).wont_equal(Node.new)
```

`packages/arel/src/nodes/node.ts:26` declares `export abstract class Node`, even
though it has no abstract members — nothing about the class requires it. Porting
those two test bodies in PR #7079 (RFC 0122) therefore needed a cast at each
site:

```ts
const NodeCtor = Nodes.Node as unknown as new () => Nodes.Node;
```

which now appears in both `packages/arel/src/nodes/node.test.ts` and
`packages/arel/src/nodes/bind-param.test.ts`. A cast that exists only to undo a
modifier trails added is a deviation with a test-side cost, not a language
shortcoming.

## Converged shape

Drop `abstract` from `Node`. Confirm nothing depended on the class being
un-instantiable (it is the base of ~110 node classes, all of which are concrete
already), then delete both `NodeCtor` casts and construct `new Nodes.Node()`
the way the Ruby does.

## Acceptance criteria

- [ ] `Node` is a concrete class; `new Nodes.Node()` typechecks.
- [ ] Both `NodeCtor` casts are gone from the two test files, with the Rails
      bodies otherwise unchanged and no test renamed.
- [ ] `pnpm typecheck` clean; `pnpm vitest run packages/arel/src` green;
      `parity:api` arel stays at 100% and `parity:api:extra:gate` does not rise.
