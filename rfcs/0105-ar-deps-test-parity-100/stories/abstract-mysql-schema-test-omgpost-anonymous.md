---
title: "abstract-mysql SchemaTest OmgPost registers over canonical Post via adapter= setter"
status: draft
updated: 2026-09-10
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced reviewing PR #7673 (trails).

Rails' `SchemaTest#setup`
(`vendor/rails/activerecord/test/cases/adapters/abstract_mysql_adapter/schema_test.rb:18-22`)
builds `@omgpost` as an anonymous `Class.new(ActiveRecord::Base)` with
`def self.name; "Post"; end`. Being anonymous, it is never registered as a constant.

trails' `packages/activerecord/src/adapters/abstract-mysql-adapter/schema.test.ts`
`withOmgPost` declares `class OmgPost extends Base { static name = "Post" }` and then
assigns `OmgPost.adapter = adapter`. The `Base.adapter` setter runs
`registerModelConstant(this.name, this)` (`base.ts:905-914`), and `registerSubclass`
(`inheritance.ts:216`) registers any named subclass. Either path can rebind the
canonical `Post` in the worker's model registry for every sibling file.

## Converged shape

- `@omgpost` takes its connection the way Rails does, through the inherited `Base`
  connection, so there is no `adapter =` assignment.
- Its `name` override answers "Post" without registering the class over the canonical
  `Post` constant.

## Acceptance criteria

- [ ] No `OmgPost.adapter =` in `schema.test.ts`.
- [ ] The canonical `Post` registration is unchanged after the suite runs. Pin it with
      an assertion in a `.trails.test.ts` sidecar.
- [ ] Green on MySQL and MariaDB; `parity:test` holds at 9 for `schema_test.rb`.
