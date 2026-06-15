---
title: "Narrow ComparisonValidator catch to ArgumentError (Rails rescue parity)"
status: draft
updated: 2026-06-15
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`ComparisonValidator#validateEach`
(`packages/activemodel/src/validations/comparison.ts:53`) wraps the per-option
compare in a bare `catch (e)` that swallows **all** thrown errors and turns the
message into a validation error:

```ts
} catch (e) {
  // Rails comparison.rb:30 — uses the ArgumentError message as the
  // error key/message and continues to the next compare option.
  record.errors.add(attribute, (e as Error).message);
}
```

Rails only rescues `ArgumentError` there
(`vendor/rails/activemodel/lib/active_model/validations/comparison.rb:30`,
`rescue ArgumentError => e`). Any other exception class propagates in Rails but
is silently converted to a validation message in trails. With the bare-throw
burndown (PR #3374) the `compare` helper now throws the ported `ArgumentError`,
so the _current_ behavior is observationally identical — but the catch is wider
than Rails and would mask an unexpected error type if one were introduced.

## Acceptance criteria

- [ ] Narrow the `catch` to only handle the ported `ArgumentError` (mirroring
      Rails' `rescue ArgumentError`); re-throw anything else.
- [ ] Comparison-validation tests stay green; add coverage asserting a
      non-`ArgumentError` thrown from a compare option propagates rather than
      being swallowed (matching Rails).
- [ ] api:compare / test:compare delta non-negative.
