---
title: "enum detect_enum_conflict! Relation-method and :id class-method sub-branches"
status: claimed
updated: 2026-07-08
rfc: "0050-enum-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: 19
pr: null
claim: "2026-07-08T18:52:34Z"
assignee: "enum-detect-conflict-relation-and-id-class-branches"
blocked-by: null
closed-reason: null
---

## Context

Rails' `detect_enum_conflict!` class-method form has THREE sub-branches
(`vendor/rails/activerecord/lib/active_record/enum.rb:374-380`):

1. `dangerous_class_method?(method_name)` -> raise type: "class"
2. `method_defined_within?(method_name, Relation)` -> raise type: "class", source: Relation.name
3. `method_name.to_sym == :id` -> raise (instance-type message)

PR #4734 converged sub-branch (1) in trails: `detectEnumConflictBang`'s
class-method branch and the inline value/`not*`/friendly scope checks in
`_enum` now call `isDangerousClassMethod` (packages/activerecord/src/enum.ts:754,
602-620). But sub-branches (2) and (3) are NOT covered by those inline enum
checks:

- Relation-method collision: the generation-time `klass.scope(...)` call in
  `named.ts` does catch it via `isRelationInstanceMethod`, but raises the
  generic _scope_ error message, not the Rails enum message with
  `source: Relation`. And the enum-name guard
  (`detectEnumConflictBang(name, pluralize(name), true)`, enum.rb:231) does not
  check Relation methods at all.
- `:id` collision: an enum value named `id` (scope `id`) or an enum name
  pluralizing to `id` is not caught — `isDangerousClassMethod("id")` is false
  (`id` is an instance method, not a static on Base) and
  `isRelationInstanceMethod` likely also false, so trails silently allows what
  Rails raises on.

`isRelationInstanceMethod` already exists in `scoping/named.ts` (module-private)
and could be exported alongside `isDangerousClassMethod`.

## Acceptance criteria

- `detectEnumConflictBang`'s class-method branch consults Relation-method
  membership and the `id` special-case, mirroring enum.rb:377-380, raising with
  the correct `type`/`source`.
- The inline `_enum` scope conflict checks raise the Rails enum message (with
  `source: Relation` where applicable) rather than deferring to the generic
  scope error.
- Regression tests: enum value/name colliding with a Relation instance method
  and with `id` both raise the enum-conflict message; test behavior matched to
  the corresponding Rails enum_test.rb cases if present.
