---
title: "remaining-activemodel-tests-redeclare-shared-models-part-2"
status: draft
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
closed-reason: null
---

## Context

Follow-up to `remaining-activemodel-tests-redeclare-shared-models`, which was
split at the LOC ceiling. The PR that closed it retargeted
`packages/activemodel/src/validations.test.ts` onto
`test-helpers/models/{topic,reply,person,custom-reader}.ts` and ported
`vendor/rails/activemodel/test/models/reply.rb` as
`packages/activemodel/src/test-helpers/models/reply.ts`.

Roughly 35 further `packages/activemodel/src/**/*.test.ts` files still declare
their own `Topic` / `Person` / `Reply` / `CustomReader` stand-ins instead of
`require "models/<name>"`-ing the shared one, e.g.
`validations/{confirmation,length,exclusion,inclusion,format,acceptance,
comparison,numericality,with,validates,callbacks,i18n-validation}.test.ts`,
`serialization.test.ts`, `serializers/json-serialization.test.ts`,
`callbacks.test.ts`, `errors.test.ts`, `error.test.ts`, `nested-error.test.ts`
and the `attribute*` / `dirty*` files. Grep:

```bash
grep -rln "class Topic\b\|class Person\b\|class Reply\b\|class CustomReader\b" \
  packages/activemodel/src --include=*.test.ts
```

The remaining unported members of `vendor/rails/activemodel/test/models/` are
`automobile.rb`, `sheep.rb`, `account.rb`, `address.rb`, `blog_post.rb`,
`contact.rb`, `helicopter.rb`, `person_with_validator.rb`, `pilot.rb`,
`track_back.rb`, `user.rb`, `visitor.rb` — port each when the test file that
needs it is retargeted, not speculatively.

A Ruby `attr_accessor` ports as an explicit get/set pair over an `@`-ivar-shaped
backing field, not as a TS class field: a class field is instance-own and its
initializer runs after `super()`, so `ActiveModel::API#initialize`'s mass
assignment finds no writer and any value it does assign is clobbered.

## Acceptance criteria

- No `packages/activemodel/src/**/*.test.ts` declares a class that mirrors a
  Rails file under `vendor/rails/activemodel/test/models/`; each imports it from
  `test-helpers/models/` instead.
- Each newly-shared model mirrors its Rails counterpart method-for-method,
  including the `attr_accessor` shape above.
- No test names change; `pnpm parity:test` percent for activemodel does not drop
  and `scripts/test-compare/assertion-mismatch-mark.json` is not raised.
- Split across further PRs by test file if it exceeds the LOC ceiling.
