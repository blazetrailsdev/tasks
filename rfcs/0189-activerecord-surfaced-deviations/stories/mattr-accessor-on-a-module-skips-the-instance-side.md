---
title: "activesupport: mattr_accessor on a ruby-compat Module defines no instance-side accessor for its includers and extenders"
status: draft
updated: 2026-10-16
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: [activesupport, ruby-compat]
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`mattr_reader` / `mattr_writer` (`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/module/attribute_accessors.rb:53-73`, `:117-135`) define the module-level accessor and, unless `instance_reader: false` / `instance_writer: false`, an instance method of the same name on the module itself. For a mixin module, that instance method reaches every includer, and every class that `extend`s it.

`ActiveJob::QueuePriority::ClassMethods` declares `mattr_accessor :default_priority` (`vendor/rails/v8.0.2/activejob/lib/active_job/queue_priority.rb:9`). `Base` gets `ClassMethods` by `extend`, so `Base.default_priority` answers, and the `included` block reads it: `class_attribute :priority, instance_accessor: false, default: default_priority` (`:49`). `QueueName::ClassMethods` does the same with `mattr_accessor :default_queue_name, default: "default"` (`queue_name.rb:9`).

trails' `mattrReader` / `mattrWriter` (`packages/activesupport/src/module-ext.ts:77-123`) seat the instance side on `target.prototype` only (`:90-91`, `:117-122`). A ruby-compat `Module` has no `prototype`: its instance methods live on its carrier, which `Module#attrReader` / `#attrWriter` reach through `moduleEval` (`packages/ruby-compat/src/include.ts`). So `mattrAccessor.call(SomeModule, "x")` defines `SomeModule.x` but not the instance-side `x` an includer or extender should get. Surfaced by the activejob codegen trial (spike `spike-ar-ruby-ir-ts-29583a`, `scripts/codegen/PROGRESS.md` step 18): loading a generated `Base` stops at `base.defaultPriority`.

## Acceptance criteria

- [ ] When the target is a ruby-compat `Module`, `mattrReader` / `mattrWriter` seat the instance-side accessor on the module's carrier (through `moduleEval`, as `Module#attrReader` does), honouring `instanceReader` / `instanceWriter` / `instanceAccessor: false`. Class targets keep the `prototype` path.
- [ ] Tests: a `new Module()` with `mattrAccessor.call(M, "x")`: a class that includes `M` reads and writes `x` on an instance; a class that `extend`s `M` reads `x` on the class; both see the one module-level value.
- [ ] The relevant cases in `activesupport/test/core_ext/module/attribute_accessor_test.rb` that exercise a module including the accessor are ported under their Rails names, or confirmed already ported.

## Verification

```bash
pnpm vitest run packages/activesupport/src/module-ext packages/activesupport/src/core-ext/module && pnpm parity:api:calls
```
