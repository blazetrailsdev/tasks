---
title: "activerecord: a loaded record builds and discards the default attribute set (init_with_attributes order, allocate)"
status: draft
updated: 2026-10-03
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activerecord/lib/active_record/core.rb:508-520`, `init_with_attributes`, sets `@new_record` and `@attributes` and THEN calls `init_internals`, which touches neither (`core.rb:834-849`). The default attribute set is built in `initialize` alone (`core.rb:471-482`: `@attributes = self.class._default_attributes.deep_dup`), and a loaded record never runs `initialize`: `persistence.rb:313` `instantiate_instance_of` is `klass.allocate.init_with_attributes(attributes, &block)`, and `Class#allocate` (`vendor/ruby/v3.3.11/object.c:2117`) runs no `initialize`.

trails diverges on the load path in three places, each building the default set and throwing it away:

- `packages/activerecord/src/core.ts` `initWithAttributes` calls `this.initInternals()` FIRST and assigns `_newRecord` / `_attributes` after it, the reverse of Rails' order. `Core#initInternals` deep-dups `_defaultAttributes()`, so every loaded record builds a default set that the next line overwrites.
- `packages/activerecord/src/base.ts` `static allocate` is `new this()`, so the constructor runs `initInternals` and builds a second default set.
- On an STI class that constructor run also takes `new`'s subclass dispatch (`inheritance.rb:56-78`), which reads `columnDefaults` — a third deep dup — although `allocate` bypasses `new` in Ruby and `_instantiate` has already picked the class.

Every copy dups each attribute through `rbObjDup` (since #8399), so the cost is per row times per column. Measured from trailmap: `Model.all().toArray()` over 11,531 rows of a 17-column table is ~1.1s at `7cece02d` and 4.3-4.6s on main.

## Acceptance criteria

- [ ] `initWithAttributes` assigns `_newRecord` and `_attributes` before calling `initInternals`, as `core.rb:508-512` does.
- [ ] Loading a record builds the default attribute set zero times; `new` still builds it once from `initInternals` (trails maps `initialize`'s prologue onto it because a JS constructor cannot touch `this` before `super`).
- [ ] `allocate` runs neither the default-set build nor `new`'s STI dispatch.
- [ ] A test asserts the zero-copy load and fails on main's code.
- [ ] `Attribute#dup` / `rbObjDup` are not changed here; `ModelSchema.columnDefaults` memoization (`model_schema.rb` `@column_defaults ||=`) is not in scope.
- [ ] `base-allocate-comes-from-a-ruby-compat-rb-obj-alloc` remains the story that deletes `allocate`'s suppress flags, including any added here.
