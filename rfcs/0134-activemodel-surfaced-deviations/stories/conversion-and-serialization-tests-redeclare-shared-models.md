---
title: "conversion-and-serialization-tests-redeclare-shared-models"
status: in-progress
updated: 2026-09-05
rfc: "0134-activemodel-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 7533
claim: "2026-09-05T20:06:45Z"
assignee: "conversion-and-serialization-tests-redeclare-shared-models"
blocked-by: null
closed-reason: null
---

## Context

PR for `remaining-activemodel-tests-redeclare-shared-models` ported
`vendor/rails/activemodel/test/models/reply.rb` to
`packages/activemodel/src/test-helpers/models/reply.ts` and retargeted the seven
test files whose stand-ins mirror `topic.rb` / `person.rb` / `custom_reader.rb` /
`reply.rb` — `validations.test.ts`, `nested-error.test.ts`, and
`validations/{comparison,i18n-generate-message,length,numericality,validations-context}-validation.test.ts`.

Three consumers were left out because each needs a Rails model that is still
unported, and `contact.rb` in particular is shared with the serialization suite:

- `packages/activemodel/src/conversion.test.ts:11-38` — bespoke `Contact`,
  `Helicopter`, `Comanche`, `Apache`, mirroring
  `vendor/rails/activemodel/test/models/contact.rb` and `helicopter.rb`
  (`conversion_test.rb:4-5` requires both).
- `packages/activemodel/src/forbidden-attributes-protection.test.ts:11-20` —
  bespoke `Account`, mirroring
  `vendor/rails/activemodel/test/models/account.rb`
  (`forbidden_attributes_protection_test.rb:5`).
- `packages/activemodel/src/serialization.test.ts` and
  `serializers/json*.test.ts` — their own `Contact`, which
  `serialization_test.rb` / `serializers/json_serialization_test.rb` get from
  `models/contact.rb`.

Note a Ruby `attr_accessor` ports as an explicit get/set pair over an
`@`-ivar-shaped backing field, not as a TS class field — see the three models
PR #7419 shaped that way.

`validations/length-validation.trails.test.ts:11` also declares a `Person`, but
it carries a `limit` attribute and a `minLength` method Rails' `person.rb` does
not, so it is a trails-only model and stays local.

## Acceptance criteria

- `contact.rb`, `helicopter.rb` and `account.rb` are ported under
  `packages/activemodel/src/test-helpers/models/`, method-for-method.
- `conversion.test.ts`, `forbidden-attributes-protection.test.ts`,
  `serialization.test.ts` and `serializers/json*.test.ts` import them instead of
  declaring their own.
- No test names change; `pnpm parity:test` percent for activemodel does not drop
  and `scripts/test-compare/assertion-mismatch-mark.json` is not raised.
