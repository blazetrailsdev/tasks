---
title: "test-case-fixtures-class-method-is-untyped"
status: in-progress
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: trails#8309
claim: "2026-09-30T23:24:46Z"
assignee: "test-case-fixtures-class-method-is-untyped"
blocked-by: null
closed-reason: null
---

## Context

The generated `test/test-helper.ts` has to cast to call Rails' `fixtures :all`:

```ts
(TestCase as typeof TestCase & { fixtures(...names: string[]): void }).fixtures(":all");
```

In Rails, `ActiveSupport::TestCase` gets `fixtures` when
`ActiveRecord::TestFixtures` is included into it
(`vendor/rails/v8.0.2/activerecord/lib/active_record/test_fixtures.rb:56`,
`ClassMethods#fixtures`). The railtie arranges that on `on_load(:active_support_test_case)`.
In trails the runtime method exists, but `TestCase`'s static type doesn't carry it.

Found auditing the types of a freshly scaffolded app (`trails new blog` + `generate scaffold Post title:string body:text`) on `main` `53a6249ae6`, while writing the README for PR #8195.

## Converged shape

`TestCase`'s type includes `TestFixtures`' class methods where the
`active_support_test_case` load hook mixes them in, through `Extended<>` /
`Included<>` or a declaration merge from `@blazetrails/activerecord`. The generated
`test-helper.ts` then reads `TestCase.fixtures(":all")`.

## Acceptance criteria

- [ ] The generated `test-helper.ts` has no cast and type-checks.
