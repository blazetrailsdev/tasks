---
title: "The rest of the activemodel suite still redeclares Rails test models inline"
status: claimed
updated: 2026-09-05
rfc: "0134-activemodel-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: "2026-09-05T09:42:07Z"
assignee: "remaining-activemodel-tests-redeclare-shared-models"
blocked-by: null
closed-reason: null
---

## Context

PR #7419 created `packages/activemodel/src/test-helpers/models/` with `topic.ts`,
`person.ts` and `custom-reader.ts`, and retargeted the three test files its story
named (`validations/{conditional,presence,absence}-validation.test.ts`). The rest
of the suite still redeclares the same models inline, which is the duplication the
shared directory exists to remove.

Remaining consumers of a local stand-in, each mirroring a Rails model that now
exists (or should) under `test-helpers/models/`:

- `packages/activemodel/src/validations.test.ts:31-110` — bespoke `Topic`
  (`Attributes`-based, where `vendor/rails/activemodel/test/models/topic.rb:16`
  is plain `attr_accessor`), `Reply`, `Person`, `CustomReader`. Its `Reply` mirrors
  `vendor/rails/activemodel/test/models/reply.rb`, which is not ported at all.
- Other `validations/*.test.ts` files that still declare their own `Topic` /
  `Person` (grep for `class Topic extends Model` under
  `packages/activemodel/src/`).

Rails' own files just `require "models/topic"` etc. — e.g.
`vendor/rails/activemodel/test/cases/validations_test.rb:5-9`.

The remaining unported members of `vendor/rails/activemodel/test/models/` are
`reply.rb`, `automobile.rb`, `sheep.rb`, `account.rb`, `address.rb`,
`blog_post.rb`, `contact.rb`, `helicopter.rb`, `person_with_validator.rb`,
`pilot.rb`, `track_back.rb`, `user.rb`, `visitor.rb` — port each one when the test
file that needs it is retargeted, not speculatively.

## Converged shape

Port the Rails test models the remaining files need (starting with `reply.rb`),
and replace each file's local stand-in with an import from
`test-helpers/models/`, exactly as `require "models/<name>"` does in Ruby.
Note that a Ruby `attr_accessor` ports as an explicit get/set pair over an
`@`-ivar-shaped backing field, not as a TS class field: a class field is
instance-own and its initializer runs after `super()`, so `ActiveModel::API#initialize`'s
mass assignment finds no writer and any value it does assign is clobbered
(this is why the three models in #7419 are shaped that way).

Split across PRs by test file if it exceeds the LOC ceiling.

## Acceptance criteria

- No `packages/activemodel/src/**/*.test.ts` declares a class that mirrors a
  Rails file under `vendor/rails/activemodel/test/models/`; each imports it from
  `test-helpers/models/` instead.
- Each newly-shared model mirrors its Rails counterpart method-for-method,
  including the `attr_accessor` shape above.
- No test names change; `pnpm parity:test` percent for activemodel does not drop
  and `scripts/test-compare/assertion-mismatch-mark.json` is not raised.
