---
title: "concern-class-methods-builds-a-module"
status: draft
updated: 2026-09-24
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

Rails' `Concern#class_methods` (`activesupport/lib/active_support/concern.rb:209-215`) builds `ClassMethods` as a `Module.new` and `module_eval`s the block into it. trails' `Concern.classMethods` (`packages/activesupport/src/concern.ts`) builds a plain object. `extend()` copies a plain object's members onto the class as own statics, not as a link in the singleton ancestry, so a `class_methods` method that calls `super` has nothing to reach.

trails#8034 hit this when it ported `ExtendedDeterministicQueries::CoreQueries` (`encryption/extended_deterministic_queries.rb:124-131`). It had to assign `CoreQueries.ClassMethods = new Module(...)` directly (Rails' `const_set :ClassMethods, Module.new`, the shape `concerning_test.rb:60` uses) instead of calling `classMethods`.

Tests that read `ClassMethods` as a plain object need to move onto the Module API, which is Rails' `Foo::ClassMethods.method_defined?(:x)` (`concerning_test.rb:104`):

- `packages/activesupport/src/core-ext/module/concerning.test.ts` (`"willBeOrphaned" in Foo.ClassMethods`)
- `packages/activesupport/src/concern.test.ts:227` (`includedMod.ClassMethods.foo.call`)

## Acceptance criteria

- `Concern.classMethods` builds `ClassMethods` as a ruby-compat `Module` and runs the block through `moduleEval`, matching concern.rb:209-215.
- `CoreQueries` in `extended-deterministic-queries.ts` uses `classMethods` and no longer assigns `ClassMethods` directly.
- The concern/concerning tests assert through `isMethodDefined` / `instanceMethods`.
