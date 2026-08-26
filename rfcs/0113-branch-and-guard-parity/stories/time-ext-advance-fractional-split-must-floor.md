---
title: "time-ext.ts advance's fractional weeks/days split truncates where Ruby's divmod(1) floors"
status: draft
updated: 2026-08-26
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Time#advance` normalises a fractional `:weeks` / `:days` with Ruby's
`divmod(1)`:

```ruby
# vendor/rails/activesupport/lib/active_support/core_ext/time/calculations.rb:195-202
unless options[:weeks].nil?
  options[:weeks], partial_weeks = options[:weeks].divmod(1)
  options[:days] = options.fetch(:days, 0) + 7 * partial_weeks
end

unless options[:days].nil?
  options[:days], partial_days = options[:days].divmod(1)
  options[:hours] = options.fetch(:hours, 0) + 24 * partial_days
end
```

`Numeric#divmod` FLOORS. On ruby 3.3.11 `(-1.5).divmod(1)` is `[-2, 0.5]`;
truncation gives `[-1, -0.5]` — a different quotient AND an
opposite-signed remainder.

`packages/activesupport/src/time-ext.ts:329-336` spells that split with
`Math.trunc`:

```ts
const partialWeeks = options.weeks - Math.trunc(options.weeks);
options.weeks = Math.trunc(options.weeks);
```

so any negative fractional `:weeks` / `:days` lands a whole week or day away
from where Rails lands it, with the wrong fractional remainder carried into
`:hours`.

This was fixed in the `Time`-receiver port
(`packages/activesupport/src/core-ext/time/calculations.ts`, PR #7078) but NOT
in `time-ext.ts`, whose `advance` still serves the JS-`Date` receiver. Note this
is NOT subsumed by `time-ext-rubytime-arms-delegate-to-time-reopening`: that
story removes only the `RubyTime` arm, and the `Date` arm keeps its own copy of
the split.

Rails has no test over a negative fractional `:weeks`/`:days`. MRI's answers for
the Rails body, for a `2005-02-28 15:15:10` receiver under `TZ=US/Eastern`:

- `advance(weeks: -1.5)` -> `2005-02-18 03:15:10`
- `advance(days: -5.5)` -> `2005-02-23 03:15:10`

(transcribed from a `ruby -e` run of the Rails body; the same two cases are
already asserted against the `Time` receiver in
`packages/activesupport/src/core-ext/time/calculations.trails.test.ts`.)

## Converged shape

`Math.floor` for both quotients, with the remainder taken off the floored value,
matching `divmod`. Add the two MRI-derived cases to the JS-`Date` arm's tests in
`packages/activesupport/src/core-ext/time-ext.test.ts` — trails-only names, so
they belong in a `.trails.test.ts` alongside it if that file is enrolled.

## Acceptance criteria

- `time-ext.ts`'s `advance` floors both the `:weeks` and `:days` splits.
- Both MRI-derived negative-fraction cases are asserted against the JS-`Date`
  receiver and fail on the truncating baseline.
- `pnpm parity:api:calls`, `pnpm parity:api:calls:args` green.
