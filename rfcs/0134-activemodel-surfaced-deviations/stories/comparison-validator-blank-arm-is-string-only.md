---
title: "ComparisonValidator's blank arm narrows Ruby's blank? to strings"
status: in-progress
updated: 2026-09-05
rfc: "0134-activemodel-surfaced-deviations"
cluster: rails-deviation
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 7506
claim: "2026-09-05T02:22:17Z"
assignee: "flip-rack-deflater-onto-the-zlib-seam"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by PR #7400 while converging `ComparisonValidator#validateEach`.

`comparison.rb:29-31` guards on Ruby's own `blank?`:

```ruby
if value.nil? || value.blank?
  return record.errors.add(attr_name, :blank, **error_options(value, option_value))
```

`packages/activemodel/src/validations/comparison.ts:29` narrows that to strings:

```ts
if (value === null || value === undefined || (typeof value === "string" && isBlank(value)))
```

Ruby's `blank?` is `respond_to?(:empty?) ? !!empty? : !self` — so an empty
Array or Hash is blank and takes the `:blank` arm, and trails instead carries it
into the comparison, where `cmp` answers `nil` and `rbCmperr` raises a
`comparison of Array with ... failed` that Rails never produces. `isBlank` from
`@blazetrails/activesupport` already handles every one of those receivers; the
`typeof value === "string"` clause is the whole deviation.

## Converged shape

Drop the `typeof` narrowing: `if (value == null || isBlank(value))`, matching
`comparison.rb:29`. Check the same guard in
`packages/activemodel/src/validations/numericality.ts`, which may carry a copy.

## Acceptance criteria

- The blank arm is `value.nil? || value.blank?` with no receiver narrowing.
- `comparison-validation.test.ts` stays at 0 assertion mismatches; a
  trails-only case covers an empty-Array value taking the `:blank` arm.
