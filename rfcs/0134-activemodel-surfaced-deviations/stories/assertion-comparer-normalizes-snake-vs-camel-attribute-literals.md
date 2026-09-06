---
title: "assertion-comparer-normalizes-snake-vs-camel-attribute-literals"
status: done
updated: 2026-09-06
rfc: "0134-activemodel-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 7525
claim: "2026-09-05T18:06:48Z"
assignee: "assertion-comparer-normalizes-snake-vs-camel-attribute-literals"
blocked-by: null
closed-reason: null
---

## Context

`scripts/test-compare`'s assertion-value comparer normalizes a Ruby Symbol to a
String (`:foo` ↔ `"foo"`) but not snake*case to camelCase, so every ported
assertion whose expected literal is an \_attribute name* is scored a
value-mismatch by construction — trails camelCases attribute names, Rails does
not.

Surfaced while retargeting `packages/activemodel/src/validations.test.ts` onto
the shared `test-helpers/models/topic.ts` for
`remaining-activemodel-tests-redeclare-shared-models`. Rails'
`validations_test.rb:237-244` ("validation order") asserts
`assert_equal :author_name, key = t.errors.attribute_names[1]`. The file's
local stand-in `Topic` declares `attribute("author_name", ...)`, so the port
asserts `"author_name"` and matches. The shared `Topic` spells the accessor
`authorName` (`test-helpers/models/topic.ts:49-55`, the repo camelCase rule, and
what `validations/length-validation.test.ts:13` already uses), and
`readAttributeForValidation` raises `NoMethodError` for a name the model does
not answer (`packages/activemodel/src/validations.ts:370-372`), so the retarget
_must_ spell it `authorName` — which raises activemodel's
`assertion-value-mismatch` from 53 to 54 and reds the only-shrink ratchet.

That blocks the `validations.test.ts` half of
`remaining-activemodel-tests-redeclare-shared-models`; the `nested-error.test.ts`
half shipped clean. The same wall will be hit by every other activemodel test
file that asserts an attribute name literal.

## Acceptance criteria

- [ ] The assertion-value comparer normalizes snake_case ↔ camelCase the way it
      already normalizes Symbol ↔ String, so an attribute-name literal that
      differs only in spelling convention is not scored a mismatch.
- [ ] `scripts/test-compare/assertion-mismatch-mark.json` is re-tightened to the
      post-normalization measurement (only-shrink; no reseed of unrelated
      shards).
- [ ] `packages/activemodel/src/validations.test.ts` can then be retargeted onto
      `test-helpers/models/topic.ts` with `authorName` and stay green.
