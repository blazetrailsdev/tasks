---
title: "activerecord: registering a model under an alias does not rename the class"
status: ready
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found on trails#8488 (PostgreSQL lane, `adapters/postgresql/uuid.test.ts`).

In Ruby a class defined with `class Foo` is permanently named `Foo`; a later `Bar = Foo` does not rename it
(`vendor/ruby/v3.3.11/variable.c:3648-3668`, `const_set` names only a class with no permanent classpath).

In trails a JS class has no classpath until something seats it. `registerModel("Alias", Klass)`
writes through `ModelRegistry#set` (`packages/activerecord/src/associations.ts:99-103`) →
`registerModelConstant` → `registerConstant`, which gives an unseated class the alias as its permanent
classpath. So `rbModName(Klass)` answers `Alias`, and since trails#8488 that name drives
`derive_foreign_key` (`reflection.rb:835`), `sti_name` and `polymorphic_name`
(`inheritance.rb:187-189,211-213`). The uuid test derived `uuid_forum_dj_id` from the alias `UuidForumDj`.

That test was fixed by nesting its models as Rails does. Other tests still register an unseated class under
a different name (`registerModel("CpkOrder", CpkOrderPL)` in `associations.test.ts`,
`registerModel("UuidPostInverse", UuidPost)` in `uuid.test.ts`), and each of those classes is now named by its alias.

## Acceptance criteria

- [ ] A model class defined with a name keeps that name when it is later registered under another one: `rbModName(Klass)` does not change on `registerModel("Alias", Klass)`.
- [ ] Each test that registers a class under an alias is ported to the Rails shape (the class defined under its Rails name, nested where Rails nests it), or the alias is shown to match the Rails constant.
- [ ] A regression test asserts the derived foreign key of a has_many on an alias-registered class.
