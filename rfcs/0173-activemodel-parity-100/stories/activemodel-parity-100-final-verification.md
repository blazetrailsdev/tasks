---
title: "activemodel: final per-axis verification once the arms residue and lint_test land"
status: ready
updated: 2026-10-04
rfc: "0173-activemodel-parity-100"
cluster: closeout
packages: ["activemodel"]
deps:
  [
    "activemodel-arms-residue-attribute-methods",
    "activemodel-arms-residue-outside-attribute-methods",
    "test-compare-lint-and-serializers-json-mapping",
  ]
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

`activemodel-parity-100-close-out` (trails PR 8496) re-measured activemodel on a clean build at
trails 55595a6218 and pinned what could be pinned: body pins 552/552, activemodel enrolled in
`parity:api:receipts:gate`, every ratchet green at 0. Three of its acceptance criteria could not
be met, so that story shipped as "measure and file residue" and this one carries the rest.

Measured after that PR:

- `pnpm parity:api:arms:report --package=activemodel`: 28 rows. 27 are owned by
  `activemodel-arms-residue-attribute-methods` and
  `activemodel-arms-residue-outside-attribute-methods`; `Model#constructor` against
  `vendor/rails/v8.0.2/activemodel/lib/active_model/api.rb` `initialize` is owned by the blocked
  `activemodel-api-initialize-concern-constructor`.
- `pnpm parity:test`: activemodel 1034/1038, 4 skipped. `attribute_test.rb` (3) and
  `type/string_test.rb` (1) are `PERMANENT-SKIP` under CLAUDE.md, "Ruby Strings are JS string
  primitives", so that count is the floor. `lint_test.rb` is outside the population until
  `test-compare-lint-and-serializers-json-mapping` lands.
- Three `CONVERGEABLE` receipts remain in `packages/activemodel/src`: `model.ts` constructor
  (`activemodel-api-initialize-concern-constructor`), `attribute-assignment.ts`
  (`update-must-call-assign-attributes-carried-from-0087`), `type/helpers/numeric.ts`
  (`type-helpers-numeric-is-a-class-factory-not-an-included-module`). All three stories are blocked.
- `pnpm parity:api:moves`: one activemodel row, `Type::SerializeCastValue#initialize`
  (`type/serialize_cast_value.rb`), the constructor exception.

## Acceptance criteria

- [ ] `pnpm parity:api:arms:report --package=activemodel` lists no row, or only `Model#constructor` while `activemodel-api-initialize-concern-constructor` is blocked.
- [ ] `pnpm parity:test` activemodel shows `lint_test.rb` in the population and no skip other than the four String-identity tests.
- [ ] Every `@noRailsEquivalent` / `@missingRailsCall` receipt in `packages/activemodel/src` is `PERMANENT`, or its `CONVERGEABLE` story is named in the PR body with its blocker.
- [ ] The story's verification line from `activemodel-parity-100-close-out` exits 0 on a clean build, and the PR body carries the final per-axis table.
