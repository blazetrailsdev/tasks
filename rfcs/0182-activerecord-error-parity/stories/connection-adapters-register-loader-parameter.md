---
title: "ConnectionAdapters.register keeps a fourth loader parameter Rails does not have"
status: done
updated: 2026-10-07
rfc: "0182-activerecord-error-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: trails#8625
claim: "2026-10-07T12:41:06Z"
assignee: "connection-adapters-register-loader-parameter"
blocked-by: null
closed-reason: null
---

## Context

Rails' `ActiveRecord::ConnectionAdapters.register(name, class_name, path = class_name.underscore)`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters.rb:22-24`)
takes three parameters, and `resolve` (`:44-46,58`) loads the adapter with
`require path_to_adapter` and `Object.const_get(class_name)`.

trails' `register` (`packages/activerecord/src/connection-adapters.ts`) now has
Rails' three parameters and default, and derives its loader from them
(`(await import(path))[className]`). It keeps a fourth, optional `loader`
parameter, which the eight built-in adapters pass so a bundler sees a static
`import("./connection-adapters/…")` specifier. Tests pass it too, to register
an adapter class defined inline in the test file:
`database-configurations/hash-config.trails.test.ts`,
`sqlite-adapter.trails.test.ts`, `support/fake-adapter.ts`
(`registerFakeAdapter`) and `packages/trailties/src/commands/db.test.ts`.

## Acceptance criteria

- [ ] Every test caller registers by `path`, as Rails'
      `test/cases/connection_adapters/registration_test.rb` does, with its
      adapter class in a module of its own.
- [ ] The built-in adapters reach their static specifiers without a fourth
      `register` parameter, and the parameter is deleted.
