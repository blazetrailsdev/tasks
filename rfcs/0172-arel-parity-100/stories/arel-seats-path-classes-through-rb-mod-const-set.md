---
title: "arel: path a seated class by its constant binding (rbModConstSet), not a separate rbSetClassPathString call"
status: in-progress
updated: 2026-10-02
rfc: "0172-arel-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: trails#8370
claim: "2026-10-02T00:53:25Z"
assignee: "arel-attribute-and-sql-literal-are-not-nodes"
blocked-by: null
closed-reason: null
---

## Context

trails#8320 paths each seated arel class with two statements, the pair `declare_under` makes
(`vendor/ruby/v3.3.11/vm_insnhelper.c:5373-5378`):

```ts
rbSetClassPathString(Not, Nodes, "Not");
Nodes.Not = Not;
```

at 124 sites in 55 files
(`grep -rn 'rbSetClassPathString(' packages/arel/src packages/activemodel/src`).
`rbSetClassPathString` (`packages/ruby-compat/src/object.ts`, `rb_set_class_path_string`,
`vendor/ruby/v3.3.11/variable.c:407`) exists only for those callers.

While that PR was open, main made `rbModConstSet` (`packages/ruby-compat/src/include.ts`,
`rb_mod_const_set`) path a class value bound under a named owner, as MRI's `const_set` does
(`vendor/ruby/v3.3.11/variable.c:3648-3668`), and accept a `{ name }` namespace object as the
owner. So the binding alone can name the class, and the separate path call is a second way to do
one thing. In Ruby the constant binding is what names `Arel::Nodes::Not`
(`vendor/rails/v8.0.2/activerecord/lib/arel/nodes/unary.rb`, `class Not < Unary` inside
`module Arel; module Nodes`).

Not pathed at all today, because they have no seat: `DeleteManager`, `InsertManager`,
`UpdateManager`, `TreeManager` (`Arel::DeleteManager` etc., `arel/delete_manager.rb`), the
collectors (`Arel::Collectors::*`), `ArelError` / `BindError` / `EmptyJoinError`
(`arel/errors.rb`), and Dot's `Node` / `Edge` (`arel/visitors/dot.rb:6-22`). `rbObjClass` renders
them unqualified (`UpdateManager`), where Rails says `Arel::UpdateManager`.

The seat shape `Nodes.X = X` is the one CLAUDE.md § "Call-time constant resolution" documents for
every package's namespaces, so the converged spelling should be settled there, not per package.

## Acceptance criteria

- [ ] A seated arel class is pathed by its constant binding (`rbModConstSet`, or the seat shape
      CLAUDE.md settles on), with no separate `rbSetClassPathString` call; the same for
      `activemodel/src/attribute.ts` and `attribute/user-provided-default.ts`.
- [ ] `rbSetClassPathString` is deleted from ruby-compat if no caller remains.
- [ ] The unseated arel classes above answer their Rails path from `rbModName`.
- [ ] `pnpm vitest run packages/arel packages/ruby-compat` and `pnpm parity:api:extra:gate` green.
