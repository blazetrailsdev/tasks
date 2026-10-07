---
title: "activerecord: Inheritance::ClassMethods#new lives in inheritance.ts; its body leaves Base's constructor"
status: draft
updated: 2026-10-07
rfc: "0181-activerecord-member-placement"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:extra --package activerecord` still reports one `inlined-from` row left over from
`activerecord-relocate-remaining-base-hosted-inlined-bodies` (trails PR for that story moved the
other twelve):

```text
activerecord/base.ts new inlined-from inheritance.rb (new)
```

It was not a relocation. Rails' `Inheritance::ClassMethods#new`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/inheritance.rb:56-78`) raises
`NotImplementedError` for an abstract class or `Base`, resolves an STI subclass through
`subclass_from_attributes` (attributes, then `current_scope&.scope_for_create`, then
`column_defaults` when `base_class?`), and calls `subclass.new` or `super`.

In trails that body is split across two places in `packages/activerecord/src/base.ts`:

- `static new` (the three overloads at `base.ts` "static new<T extends typeof Base>") only maps an
  Array arm Rails does not have, calls `new this(this._mergeCurrentScopeAttrs(attrs))` and yields
  the block.
- The `constructor` holds the Rails body: `_requireConcreteClass()` (the `NotImplementedError`
  arm), then the `_hasAttribute(inheritanceColumn)` / `subclassFromAttributes` /
  `currentScope()?.scopeForCreate()` / `columnDefaults` chain behind the `_suppressStiNewDispatch`
  guard.

`inheritance.ts` has `subclassFromAttributes` and the `ClassMethods` class (`abstractClass`
accessor) but no `new`. Moving `static new` as it stands onto `Inheritance.ClassMethods` would pair
it with `inheritance.rb#new` and red `parity:api:calls` on every call the constructor makes
instead.

## Acceptance criteria

- [ ] `Inheritance.ClassMethods.new` in `inheritance.ts` is `inheritance.rb:56-78` line for line:
      the abstract / `self == Base` raise, the three `subclass_from_attributes` arms in Rails'
      order, and `subclass.new(attributes, &block)` or `super`.
- [ ] `Base` reaches it through `extend(Base, Inheritance.ClassMethods)`; `base.ts` keeps at most a
      `declare static new`.
- [ ] The STI dispatch and the abstract-class raise leave `Base`'s constructor, or the part that
      must stay for a bare `new Klass(attrs)` is stated at the call site with its receipt.
- [ ] The Array arm of `static new` / `static build` goes to wherever Rails takes an Array
      (`Relation#new` / `build`, `relation.rb`), or is deleted.
- [ ] `pnpm parity:api:extra --package activerecord` no longer lists
      `base.ts new inlined-from inheritance.rb`; `parity:api:calls` and `:calls:args` stay green
      with no new baseline row.
- [ ] `inheritance.test.ts`, `base.test.ts`, `persistence.test.ts`, `relation/scoping` test files
      green.
