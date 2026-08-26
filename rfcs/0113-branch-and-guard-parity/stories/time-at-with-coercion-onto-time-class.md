---
title: "time-at-with-coercion-onto-time-class"
status: draft
updated: 2026-08-26
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`core_ext/time/calculations.rb:44-60` layers a coercion chain onto `Time.at`:

```ruby
def at_with_coercion(time_or_number, *args)
  if args.empty?
    if time_or_number.is_a?(ActiveSupport::TimeWithZone)
      at_without_coercion(time_or_number.to_r).getlocal
    elsif time_or_number.is_a?(DateTime)
      at_without_coercion(time_or_number.to_f).getlocal
    else
      at_without_coercion(time_or_number)
    end
  else
    at_without_coercion(time_or_number, *args)
  end
end
ruby2_keywords :at_with_coercion
alias_method :at_without_coercion, :at
alias_method :at, :at_with_coercion
```

`at`, `at_with_coercion` and `at_without_coercion` sit in a `SCOPED_SKIP_GROUPS`
entry in `scripts/parity/conventions.ts:604-627`, scoped to this Ruby file,
whose reason covers the whole family of `alias_method` chains the file
installs — the `+`/`-`/`<=>`/`eql?` operator pairs and this one together. That
reason is accurate for the operator pairs (JS has no operator overloading, so
the `*_without_*` halves have no receiver) but NOT for `Time.at`: `at` is an
ordinary class method, and trails already reopens `Time` from activesupport
(`packages/activesupport/src/core-ext/time/calculations.ts`, landed by
`activesupport-core-ext-time-calculations-on-time-class`), so the override has a
receiver and the idiom to attach it.

`activesupport-core-ext-time-calculations-on-time-class` left this standing
rather than converging it: that PR was already over its LOC ceiling, and this
needs its own test coverage plus a decision on the skip group.

`packages/activesupport/src/core-ext/time-ext.test.ts:784-806` has Rails' `at
with time with zone`, `at with time with zone returns local time`, `at with
datetime` and `at with datetime returns local time` names already, but their
bodies assert only on a JS `Date` and never call any `at` — they are hollow and
need writing against the real receiver as part of this.

## Acceptance criteria

- `at_with_coercion` lives on trails' `Time` at the Rails name, assigned from
  `core-ext/time/calculations.ts` by the same mixin idiom the rest of that file
  uses, with `Time.at` reaching it.
- The `SCOPED_SKIP_GROUPS` entry is SPLIT: `at`/`at_with_coercion` leave it, and
  the operator-pair names keep it with the reason narrowed to what it actually
  covers. `at_without_coercion` stays skipped — it is the alias to core Ruby's
  `Time.at`, which in trails IS `Time.at`, so it has nothing to name.
- `TimeWithZone` grows `to_r` if the `at_without_coercion(x.to_r)` arm needs it
  (`toF` is already there, `time_with_zone.rb`).
- The four hollow `at with ...` tests in `time-ext.test.ts` are rewritten to
  call `Time.at`, keeping their Rails-verbatim names.
- `pnpm parity:api` activesupport ported-method count up by the two names
  leaving the skip group; `parity:api:calls`, `parity:api:extra` green.
