---
title: "Converge accepts-multiparameter-time's cast_from_multiparameter_hash"
status: claimed
updated: 2026-08-20
rfc: "0115-activemodel-fidelity-convergence"
cluster: "api-compare"
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: null
claim: "2026-08-20T12:52:31Z"
assignee: "converge-accepts-multiparameter-time-cast-from-multiparameter"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activemodel/lib/active_model/type/helpers/
accepts_multiparameter_time.rb` is 45 code lines over 6 methods:
`cast`, `serialize`, `assert_valid_value`, `value_from_multiparameter_assignment`,
`defaults_to`, and the `AcceptsMultiparameterTime` module wrapper.

`packages/activemodel/src/type/helpers/accepts-multiparameter-time.ts` is 149,
with **109 code lines having no Rails counterpart**:

- `castFromMultiparameter` (`:110`, 69 code lines)
- `isHash` (`:21`, 19)
- `exactSecondsToNanoseconds` (`:49`, 18)
- `isMultiparameterHash` (`:106`, 3)

Rails' `value_from_multiparameter_assignment` is ~12 lines:

```ruby
def value_from_multiparameter_assignment(values_hash)
  defaults.each do |k, v|
    values_hash[k] ||= v
  end
  return unless values_hash[1] && values_hash[2] && values_hash[3]
  values = values_hash.sort.map!(&:last)
  ::Time.public_send(default_timezone, *values)
end
```

The 69-line trails body is that plus hand-rolled fractional-second handling and
hash-shape sniffing. `isHash` is `Hash === value`, which CLAUDE.md's Ruby-idiom
list already covers; `exactSecondsToNanoseconds` is float→nsec conversion that
belongs with the `Time` construction, not here.

Note also `project_ruby_rational_canonicalizes_den_1_to_integer` and the
`set_sg` / nsec traps recorded in `topic_date_and_numeric_gotchas` — the
fractional-second path is where those bite. Read the memory notes before
touching the nsec arithmetic.

## Acceptance criteria

- `value_from_multiparameter_assignment` matches
  `accepts_multiparameter_time.rb` line for line, including the `defaults`
  fill, the `values_hash[1] && [2] && [3]` guard, the `sort.map!(&:last)` and
  the `Time.public_send(default_timezone, *values)` tail.
- `castFromMultiparameter`, `isHash`, `isMultiparameterHash` and
  `exactSecondsToNanoseconds` are gone or reduced to what Ruby's own
  expressions require.
- Sub-second behaviour is unchanged — pin it with a test at a pre-1970 instant
  with nanosecond precision (the case PR #6738 found the truncation direction
  wrong on).
- `pnpm parity:api:extra --package activemodel` shows the file at 0 novel.
- Parity deltas non-negative; `activemodel/type/helpers/time-value.json`'s row
  shrinks or holds; `pnpm parity:api:calls` / `:args` clean.

## Verification

```bash
pnpm vitest run packages/activemodel/src/type/helpers packages/activemodel/src/type/date-time.test.ts packages/activemodel/src/type/time.test.ts
```
