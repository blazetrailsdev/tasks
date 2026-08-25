---
title: "Enroll number_helper_test.rb's test_number_to_human, including the round_mode: :down assertion"
status: done
updated: 2026-08-18
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: 6709
claim: "2026-08-18T18:32:42Z"
assignee: "sweep-includes-preload-call-sites-onto-the-colon-symbol-spelling"
blocked-by: null
closed-reason: null
---

## Context

`RoundingHelper` now honours every `round_mode`
(story `rounding-helper-round-mode-coverage`, PR #6538), and five of Rails'
six `round_mode` assertions in
`vendor/rails/activesupport/test/number_helper_test.rb` are live in
`packages/activesupport/src/number-helper.test.ts`.

The sixth is not:

```ruby
assert_equal "480 Thousand", number_helper.number_to_human(489939, precision: 2, round_mode: :down)
```

(number_helper_test.rb:341.) It was left out because
`packages/activesupport/src/number-helper.test.ts` has no `number to human`
test to attach it to — the only `numberToHuman` test in the file is
`"number to human with custom units that are missing the needed key"`, which
is a different Rails test, and adding the assertion there would put it under
the wrong name.

The enclosing Rails test is `test_number_to_human` (number_helper_test.rb
around `:320-360`), which trails has not enrolled at all.

## Converged shape

Port `test_number_to_human` as `it("number to human")` under the existing
`describe("NumberHelperTest")`, with Rails' assertions verbatim including
`:341`. `parity:test` then credits the whole test rather than the one
assertion.

## Acceptance criteria

- [ ] `it("number to human")` exists in
      `packages/activesupport/src/number-helper.test.ts` carrying
      number_helper_test.rb's `test_number_to_human` assertions verbatim,
      including the `round_mode: :down` one at `:341`.
- [ ] `pnpm parity:test` delta is non-negative and the file's
      assertion-count mismatch does not grow.
- [ ] Any assertion that cannot pass is left out with a story reference, not
      reworded.
