---
title: "activemodel: Lint::Tests call assert_respond_to / assert / assert_kind_of / assert_equal as lint.rb does"
status: draft
updated: 2026-10-01
rfc: "0173-activemodel-parity-100"
cluster: receipts
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8321 (`activemodel-audit-permanent-receipts-root`), which made
`packages/activemodel/src/lint.ts` raise ActiveSupport's `Minitest::Assertion` port (`Assertion`,
`packages/activesupport/src/testing/assertions.ts`) in place of an invented `MinitestAssertion`.

The bodies still hand-roll every check. `ActiveModel::Lint::Tests`
(`vendor/rails/v8.0.2/activemodel/lib/active_model/lint.rb:30-116`) is written entirely in minitest
assertions:

```ruby
def test_to_key
  assert_respond_to model, :to_key                                   # :32
  def model.persisted?() false end
  assert model.to_key.nil?, "to_key should return nil when `persisted?` returns false"  # :34
end
```

and likewise `assert_kind_of String, model.to_partial_path` (`:60`), `assert_boolean` (`:72,113-115`),
`assert_equal model.model_name, model.class.model_name` (`:90`),
`assert_equal [], model.errors[:hello], "…"` (`:104`). trails spells each as
`if (typeof m.toKey !== "function") throw new Assertion("model must respond to toKey")` — 18 hand-built
throws with invented messages, and a `typeof … === "function"` probe where `assert_respond_to` asks
`respond_to?` (CLAUDE.md § "Ruby protocol methods with a different JS mechanism": `rbObjRespondTo`).

ActiveSupport already ports `assert` and `assertRespondTo`
(`packages/activesupport/src/testing/assertions.ts:375,411`), with minitest's own messages.

## Acceptance criteria

- [ ] Each `Tests.test*` body and `assertBoolean` calls the ActiveSupport assertion Rails calls on that line (`assertRespondTo`, `assert`, `assertKindOf`, `assertEqual`), in the same order, with Rails' message argument where Rails passes one; no `throw new Assertion(...)` remains in `lint.ts`.
- [ ] A failure message is minitest's (e.g. `Expected … to respond to #to_key`), not a trails-invented string.
- [ ] `pnpm parity:api:calls` green; `packages/activemodel/src/lint.test.ts` green.

## Verification

```bash
pnpm parity:api:calls && pnpm parity:api:arms:report --package=activemodel && pnpm vitest run packages/activemodel/src/lint.test.ts
```
