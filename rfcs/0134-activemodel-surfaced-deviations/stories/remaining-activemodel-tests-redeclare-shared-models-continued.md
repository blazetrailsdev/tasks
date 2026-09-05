---
title: "remaining-activemodel-tests-redeclare-shared-models-continued"
status: closed
updated: 2026-09-05
rfc: "0134-activemodel-surfaced-deviations"
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
closed-reason: "duplicate of remaining-activemodel-tests-redeclare-shared-models, which stays open for the ~35 remaining test files"
---

## Context

Continuation of `remaining-activemodel-tests-redeclare-shared-models`, whose
first slice shipped in the PR that carries this story's creation: it ported
`vendor/rails/activemodel/test/models/reply.rb` to
`packages/activemodel/src/test-helpers/models/reply.ts` and retargeted
`packages/activemodel/src/validations.test.ts` and
`packages/activemodel/src/nested-error.test.ts` onto the shared `Topic` /
`Reply` / `Person` / `CustomReader`. That slice hit the PR LOC ceiling; the
parent story said to split by test file.

Still redeclaring a Rails test model inline (grep
`class Topic extends|class Person extends|class Reply extends` under
`packages/activemodel/src`): roughly three dozen files, including
`attribute-methods.test.ts`, `attributes.test.ts`, `attributes-dirty.test.ts`,
`callbacks.test.ts`, `errors.test.ts`, `serialization.test.ts`,
`serializers/json.test.ts`, `translation.test.ts` and most of
`validations/*.test.ts`.

The remaining unported members of `vendor/rails/activemodel/test/models/` are
`automobile.rb`, `sheep.rb`, `account.rb`, `address.rb`, `blog_post.rb`,
`contact.rb`, `helicopter.rb`, `person_with_validator.rb`, `pilot.rb`,
`track_back.rb`, `user.rb`, `visitor.rb` — port each when the test file that
needs it is retargeted, not speculatively.

A Ruby `attr_accessor` ports as an explicit get/set pair over an `@`-ivar-shaped
backing field, not a TS class field: a class field is instance-own and its
initializer runs after `super()`, so `ActiveModel::API#initialize`'s mass
assignment finds no writer and any value it assigns is clobbered. See
`test-helpers/models/topic.ts` and `person.ts`.

## Acceptance criteria

- No `packages/activemodel/src/**/*.test.ts` declares a class that mirrors a
  Rails file under `vendor/rails/activemodel/test/models/`; each imports it
  from `test-helpers/models/` instead.
- Each newly-shared model mirrors its Rails counterpart method-for-method.
- No test names change; `pnpm parity:test` percent for activemodel does not drop
  and `scripts/test-compare/assertion-mismatch-mark.json` is not raised.
- Split across further PRs by test file if it exceeds the LOC ceiling.
