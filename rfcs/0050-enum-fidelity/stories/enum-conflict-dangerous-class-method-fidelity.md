---
title: "enum-conflict-dangerous-class-method-fidelity"
status: draft
updated: 2026-07-02
rfc: "0050-enum-fidelity"
cluster: null
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

`detectEnumConflictBang`'s class-method branch
(`packages/activerecord/src/enum.ts` — the `_klassMethod` path) checks
`methodName in (this as object)`, which walks the **full** static-method
ancestor chain: the model subclass, any intermediate user classes, and `Base`.
Rails' `dangerous_class_method?`
(`vendor/rails/activerecord/lib/active_record/attribute_methods.rb:201-211`) is
narrower — a fixed `RESTRICTED_CLASS_METHODS` list plus `Base.respond_to?(name)`
filtered to exclude anything inherited from `Object` — i.e. it only flags
methods defined by `Base` itself, **never** a class method on a user subclass or
intermediate ancestor.

Surfaced reviewing PR #4417 (enum-reserved-undeclared-override-alias), which is
the first caller to exercise this branch for the enum-_name_ guard
(`detectEnumConflictBang.call(this, name, pluralize(name), true)`). Consequence:
a class-level user method on an intermediate ancestor whose name matches an
enum's `pluralize(name)` would incorrectly raise, where Rails would allow it.
Pre-existing (not introduced by #4417); low severity (requires a name collision
with a user static on an ancestor).

A faithful `dangerous_class_method?` already exists as `isDangerousClassMethod`
in `packages/activerecord/src/scoping/named.ts:36-45` — it walks statics **from
`Base`** (never the model subclass) plus a `RESTRICTED_CLASS_METHODS` set. That
helper is currently module-private to `named.ts`.

## Acceptance criteria

- `detectEnumConflictBang`'s class-method branch consults a faithful
  `dangerous_class_method?` (walk from `Base`, not the model subclass), reusing
  or exporting `scoping/named.ts`'s `isDangerousClassMethod` rather than
  `methodName in this`. Watch for the `enum.ts -> named.ts -> base.ts -> enum.ts`
  import cycle (named.ts uses `Base`/`Relation` only at call time, so a value
  import should be safe, but verify no init-order break).
- The **conflict-pass** class-method checks in `_enum` itself (the
  `fullName in this` / `notScopeName in this` / friendly-name `in this` scope
  guards) have the same over-broad flaw: they catch a scope inherited from a
  _parent_ enum, so a subclass enum reusing a value name a parent enum generated
  raises where Rails permits it. Make these faithful too (or drop them and rely
  on `this.scope`'s own `isDangerousClassMethod` check), so both the class-method
  and instance-method branches converge.
- The reserved-name case (`enum :column` -> `columns` class method) still raises.
- Add regression tests: (a) an enum whose `pluralize(name)` matches a **user**
  class method on an intermediate ancestor does NOT raise; (b) a subclass enum
  reusing a value method a **parent** enum generated does NOT raise (the
  `_enumMethodsModuleNames` set is already per-class/non-inherited, so only the
  scope pre-check blocks this today — mirrors the same-class conflict test in
  `enum.trails.test.ts`).
- Existing enum tests stay green; test names match Rails verbatim.

## Note

The three accessor-level conflict checks themselves (pluralize / reader / writer,
Rails enum.rb:231,235,236) were delivered by PR #4417 — the sibling draft story
`enum-detect-conflict-for-accessor-names` is satisfied by that PR and can be
closed against it. This story is only the `dangerous_class_method?` fidelity
refinement of the class-method branch.
