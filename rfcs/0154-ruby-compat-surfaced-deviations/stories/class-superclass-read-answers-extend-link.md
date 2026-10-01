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

ruby-compat's `Module#extendObject` (`packages/ruby-compat/src/include.ts`) splices a link into a class receiver's static prototype chain, so after a `Module` is extended onto a model class `Object.getPrototypeOf(klass)` is that link, not the superclass. The link inherits every static from the real superclass, so it passes for a class and the wrong answer is silent.

trails#8323 added the port, `rbClassSuperclass` (`packages/ruby-compat/src/object.ts`, with its test in `object.trails.test.ts`), and converted the seven reads in `inheritance.ts` and `attribute-methods.ts` that Rails spells `superclass`: `define_attribute_methods` (`attribute_methods.rb:111`), `generate_alias_attributes` (`:128`), `instance_method_already_implemented?` (`:170`), `method_defined_within?` (`:187`), `set_base_class`, `descends_from_active_record?` (`inheritance.rb:85`) and `registerSubclass`.

This story is the rest. Each of these still reads `Object.getPrototypeOf(<class>)` where Rails reads `superclass` (line numbers as of trails#8323):

- `model-schema.ts:270`
- `store.ts:65`
- `persistence.ts:145`
- `scoping.ts:78`
- `scoping/default.ts:77`
- `connection-handling.ts:387`
- `relation/delegation.ts:91`
- `core.ts:398`
- `base.ts:685`
- `migration.ts:1145`
- `translation.ts:14`
- `no-touching.ts:18`
- `validations/uniqueness.ts:147`
- `associations.ts:118`, `:164`
- `associations/builder/has-and-belongs-to-many.ts:31-34`
- `reflection.ts:816-823`
- `inheritance.ts` `isStiSubclass` / `getStiBase`, and `attribute-methods.ts` `isDangerousClassMethod` / `frameworkBase`: ancestor walks that read an inherited static or test an own property, so a link does not change today's answer. Convert them only where the Rails body they mirror says `superclass`.

## Acceptance criteria

- Every read above is checked against its Rails body. One that Rails spells `superclass` uses `rbClassSuperclass`; one that is a plain ancestor walk is left and noted in the PR body.
- A test extends a `Module` onto a model class and exercises at least one converted read from each file touched.
