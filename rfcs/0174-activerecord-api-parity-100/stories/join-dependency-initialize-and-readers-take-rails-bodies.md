---
title: "activerecord: JoinDependency#initialize, base_klass, reflections and join_root_alias take Rails' bodies"
status: ready
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`JoinDependency`'s constructor and readers in `packages/activerecord/src/associations/join-dependency.ts` still differ from Rails' `initialize`, `base_klass`, `reflections` and `join_root_alias`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/associations/join_dependency.rb:72-84, 153-166`). Surfaced while converging `construct` / `join_constraints` in trails#8724, which left them alone.

- `initialize(base, table, associations, join_type)` (`:72-76`) is three statements: `make_tree`, `JoinBase.new(base, table, build(tree, base))`, `@join_type = join_type`. The port also defaults `table ??= base.arelTable`, `joinType ?? Nodes.OuterJoin` and `associations ?? []`, and stores two fields Rails does not have, `_baseModel` and `_baseAlias`.
- `base_klass` (`:78-80`) is `join_root.base_klass`. The port returns `_baseModel`.
- `reflections` (`:82-84`) is `join_root.drop(1).map!(&:reflection)`. The port adds `.filter((reflection) => reflection != null)`.
- `join_root_alias` (`:166`, private `attr_reader`) is the boolean `apply_column_aliases` sets (`:154`). The port keeps that boolean in `_joinRootAlias` and exposes a second, unrelated `protected get joinRootAlias(): string` that returns `_baseAlias`. Nothing in `packages/*/src` reads that getter.
- `construct` and `constructModel` reach `node.reflection.name` and `node.reflection.joinPrimaryKey()` through `(node.reflection as any)`, because `JoinAssociation#reflection` is typed `AbstractReflection`.

## Acceptance criteria

- [ ] The constructor is `join_dependency.rb:72-76` with no defaults for `table`, `associations` or `joinType`; callers that pass `null` pass what Rails' callers pass.
- [ ] `_baseModel` and `_baseAlias` are gone; `baseKlass` is `this.joinRoot.baseKlass`.
- [ ] `joinRootAlias` is the private boolean reader of `:166`, and the string getter is deleted.
- [ ] `reflections` has no `filter`.
- [ ] `construct` / `constructModel` read `node.reflection` with no `as any`.
- [ ] `packages/activerecord/src/associations/eager.test.ts`, `cascaded-eager-loading.test.ts` and the `join-dependency-*.trails.test.ts` files pass.
