---
title: "class-superclass-read-answers-extend-link"
status: draft
updated: 2026-10-01
rfc: "0154-ruby-compat-surfaced-deviations"
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

Ruby's `Class#superclass` (`vendor/ruby/v3.3.11/object.c:2191-2210` `rb_class_superclass`) skips the iclasses that `include` / `extend` splice into the ancestry and answers the next real class. So `Class.new(ActiveRecord::Base) { extend SomeModule }.superclass` is `ActiveRecord::Base`.

trails reads `superclass` as `Object.getPrototypeOf(klass)`. ruby-compat's `Module#extendObject` (`packages/ruby-compat/src/include.ts`, the `Object.setPrototypeOf(obj, link)` arm) splices a link into a class receiver's static prototype chain, so after a `Module` is extended onto a model class `Object.getPrototypeOf(klass)` is that link, not the superclass. The link inherits every static from the real superclass, so it passes for a class and the wrong answer is silent:

- `defineAttributeMethods` (`packages/activerecord/src/attribute-methods.ts:318`, Rails `attribute_methods.rb:111` `superclass.define_attribute_methods unless base_class?`) calls `defineAttributeMethods` with the link as receiver, which then calls `loadSchema` with `this` = the link.
- `setBaseClass` (`packages/activerecord/src/inheritance.ts`, Rails `inheritance.rb:340-355`) compares the link against `ActiveRecord.Base`, misses, and recurses into `baseClass.call(link)`, so a direct subclass of `Base` does not answer itself as `base_class`.
- `generateAliasAttributes` (`attribute-methods.ts:340`, Rails `attribute_methods.rb:128`) has the same read.

Found while porting `schema_loading_test.rb` (`vendor/rails/v8.0.2/activerecord/test/cases/schema_loading_test.rb:5-17`): its `SchemaLoadCounter` Concern has a `ClassMethods#load_schema!` that calls `super`. Written as a `Module` (`mod.defineMethod` + `mod.superMethod`), `superMethod` answered `undefined` because the receiver it was handed was the link itself. `packages/activerecord/src/schema-loading.test.ts` therefore ships `ClassMethods` as a plain object (which `extend()` copies onto the class as own statics, no link) and spells `super` as `Object.getPrototypeOf(this).loadSchemaBang.call(this)`.

## Converged shape

ruby-compat gains the port of `rb_class_superclass` (a function that walks `Object.getPrototypeOf` past singleton / include links to the next real class), and activerecord's `superclass` reads go through it.

## Acceptance criteria

- A ruby-compat test: a class with a `Module` extended onto it answers its real superclass, cited to `object.c:2191`.
- `defineAttributeMethods`, `generateAliasAttributes`, `setBaseClass` and the other `Object.getPrototypeOf(<class>)`-as-`superclass` reads in `packages/activerecord/src` use it.
- `schema-loading.test.ts`'s `SchemaLoadCounter.ClassMethods` becomes a `Module` whose `loadSchemaBang` calls `mod.superMethod(this, "loadSchemaBang")`, and its three tests stay green.
