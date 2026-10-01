---
title: "arel-seats-path-classes-through-const-set"
status: draft
updated: 2026-10-01
rfc: "0172-arel-parity-100"
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

`arel-visitor-class-names-onto-ruby-compat` moved arel's `obj.class.name` emulation into
ruby-compat as `rbModName` (`rb_mod_name`, `vendor/ruby/v3.3.11/variable.c:122`) and
`rbSetClassPathString` (`rb_set_class_path_string`, `variable.c:407`). Only four arel classes are
pathed explicitly — `Node` (`packages/arel/src/nodes/node.ts`), `Table` (`table.ts`),
`SelectManager` (`select-manager.ts`) and `Attribute` (`attributes/attribute.ts`). Every other
node class gets `Arel::Nodes::<Name>` from the `@boundary` arm in `rbModName`
(`packages/ruby-compat/src/object.ts`): a named class with no path of its own is read as declared
in the cbase of its nearest pathed superclass.

MRI has no such arm. `class Foo < Node` inside `module Arel::Nodes` is pathed by `declare_under`
(`vendor/ruby/v3.3.11/vm_insnhelper.c:5373-5378`): `rb_set_class_path_string(c, cbase, id)` then
`rb_const_set(cbase, id, c)`, and `const_set` itself names an unpathed class bound under a named
owner (`variable.c:3648-3668`). An unpathed class's `Module#name` is `nil`, which
`Arel::Visitors::Visitor.dispatch_cache` reads as `""`
(`vendor/rails/v8.0.2/activerecord/lib/arel/visitors/visitor.rb:17-21`).

arel already seats each class on its namespace in the defining module — 125 `Nodes.X = X;` /
`Visitors.X = X;` / `Arel.X = X;` lines across 59 files
(`grep -rnE '^(Nodes|Visitors|Arel|Attributes)\.[A-Z]\w* = ' packages/arel/src`). That seat is the
constant assignment, so it is where the path belongs. ruby-compat's `rbModConstSet`
(`packages/ruby-compat/src/include.ts`, `rb_mod_const_set`) already paths a `Module` value under
its owner and skips a class value.

Unseated today: `DeleteManager`, `InsertManager`, `UpdateManager`, `TreeManager`, the collectors,
`ArelError` / `BindError` / `EmptyJoinError`, and Dot's `Node` / `Edge`.

## Acceptance criteria

- [ ] A class bound to a constant under a named owner is pathed by that binding, as
      `const_set` does (`variable.c:3648-3668`) — `rbModConstSet` paths a class value, not only a
      `Module` — and arel's seats go through it.
- [ ] The inherited-cbase `@boundary` arm is deleted from `rbModName`; an unpathed class answers
      its own `name`, and an anonymous one `nil`.
- [ ] `activemodel/src/attribute.ts`'s six `rbSetClassPathString` calls fold into their seats the
      same way.
- [ ] `pnpm vitest run packages/arel packages/ruby-compat` green; `pnpm parity:api:extra:gate`
      green with arel `novel` 0.
