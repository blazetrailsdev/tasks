---
title: "json-serialization-tests-stand-ins-are-person-not-contact"
status: done
updated: 2026-09-06
rfc: "0134-activemodel-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 7577
claim: "2026-09-06T20:10:04Z"
assignee: "json-serialization-tests-stand-ins-are-person-not-contact"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activemodel/test/cases/serializers/json_serialization_test.rb:3-17`
requires `models/contact` and `models/address` and builds one `@contact` in
`setup`; every one of its 32 tests then asserts against that single fixture.

`packages/activemodel/src/serializers/json-serialization.test.ts` keeps the
Rails test NAMES but not the Rails SHAPE: each `it` declares its own local
`Person extends Model` with `include(this, Attributes)` and a single `name`
attribute, so the assertions were rewritten around whatever that stand-in can
answer rather than around Rails' `name` / `address` / `age` / `created_at` /
`awesome` / `preferences` contact.

`packages/activemodel/src/test-helpers/models/contact.ts` now exists (ported by
`conversion-and-serialization-tests-redeclare-shared-models`, PR that carries
this story's filing), so the model half of the retarget is done. What remains is
the file itself, and it is a re-port of all 32 tests plus a `models/address.rb`
port, not a mechanical import swap — which is why it was left out of that PR
rather than done there.

`serialization.test.ts` is deliberately NOT part of this: its Rails counterpart
`serialization_test.rb:7-20` declares an inline `User`, not `Contact`, so its
stand-ins are already the right shape.

## Acceptance criteria

- `vendor/rails/activemodel/test/models/address.rb` is ported under
  `packages/activemodel/src/test-helpers/models/`.
- `json-serialization.test.ts` builds one `Contact` the way `setup` does and its
  tests assert against it, importing `Contact` and `Address` instead of
  declaring local `Person` stand-ins.
- No test names change; `pnpm parity:test` percent for activemodel does not drop
  and `scripts/test-compare/assertion-mismatch-mark.json` is not raised.
