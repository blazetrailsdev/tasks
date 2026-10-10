---
title: "activerecord: Type.registry folds attr_accessor's reader and writer into one function, and the write clears default_value"
status: in-progress
updated: 2026-10-10
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#8764
claim: "2026-10-10T19:09:47Z"
assignee: "activerecord-pg-uuid-primary-key-default-lives-in-schema-creation"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails PR 8444, which gave `ActiveModel::Type` the two halves of
`attr_accessor :registry` (`registry()` / `setRegistry()`,
`packages/activemodel/src/type.ts`).

`ActiveRecord::Type` declares the same accessor
(`vendor/rails/v8.0.2/activerecord/lib/active_record/type.rb:23-26`):

    @registry = AdapterSpecificRegistry.new

    class << self
      attr_accessor :registry # :nodoc:

trails folds both halves into one function
(`packages/activerecord/src/type.ts:81-87`):

    export function registry(r?: AdapterSpecificRegistry): AdapterSpecificRegistry {
      if (r !== undefined) {
        _registry = r;
        _defaultValue = undefined;
      }
      return _registry;
    }

Two deviations: the reader takes a parameter Rails' reader does not have, and
the write also clears `_defaultValue`, which `registry=` does not touch
(`default_value` is `@default_value ||= Value.new`, `type.rb:45-47`).

Writer-form callers today: `packages/activerecord/src/type.test.ts:32` and
`packages/activerecord/src/type.trails.test.ts:78`.

## Converged shape

`registry()` takes no argument and returns `_registry`. `setRegistry(registry)`
assigns it and nothing else, the `set*` spelling the conventions table gives a
module-level `name=`. The two test call sites move to `setRegistry`.

## Acceptance criteria

- [ ] `registry()` in `packages/activerecord/src/type.ts` has no parameter.
- [ ] `setRegistry` assigns `_registry` only; `_defaultValue` is not reset.
- [ ] `pnpm parity:api:extra:gate` and `pnpm parity:api:params` stay green.
- [ ] `pnpm vitest run packages/activerecord/src/type.test.ts packages/activerecord/src/type.trails.test.ts` green.
