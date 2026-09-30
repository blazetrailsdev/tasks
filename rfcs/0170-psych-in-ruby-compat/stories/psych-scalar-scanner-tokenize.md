---
title: "Port Psych::ScalarScanner#tokenize and route ToRuby plain scalars through it"
status: draft
updated: 2026-09-29
rfc: "0170-psych-in-ruby-compat"
cluster: fidelity
packages: ["ruby-compat"]
deps:
  [
    "move-activesupport-yaml-into-ruby-compat-psych",
    "psych-restricted-class-loader-and-no-alias-ruby",
  ]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/ruby/v3.3.11/ext/psych/lib/psych/scalar_scanner.rb:6-155` (`tokenize` `:37`, `parse_int` `:109`,
`parse_time` `:115`). `ToRuby#deserialize` (`psych/visitors/to_ruby.rb:51-127`)
hands every untagged plain scalar to it. #8254's `ToRuby` returns the npm
backend's resolved value, which uses YAML 1.2 core schema: `yes`, `no`, `on`
and `off` stay Strings and `0o17` is octal, where Psych answers `true` / `false`
and octal only for a leading `0`. That divergence hits every config file
(`database.yml` `<<` blocks, credentials).
`activesupport/src/encrypted-configuration.ts:118` already works around it
with `version: "1.1"`.

Split out of `configuration-file-parse-through-psych-unsafe-load`'s third
bullet. It is not in `psych-scalar-and-tag-visitors`, which covers tag arms.

## Acceptance criteria

- [ ] `Psych.ScalarScanner` with `tokenize`, `parseInt`, `parseTime` and
      `strictInteger`, ported arm by arm in Ruby's regexp order: empty/`~`/`null`
      → nil, booleans, `.inf`/`.nan`, ints with `_`, base-60, floats, dates,
      times, and `:symbol` (a `":name"` string).
- [ ] `ToRuby` resolves plain, untagged, unquoted scalars through it. Quoted
      scalars stay Strings.
- [ ] Dates resolve as Psych resolves them: through `ClassLoader#date`
      (`class_loader.rb:9,36-43`, `load 'Date'` → `rbPathToClass("Date")`).
      So ruby-compat takes no dependency on `@blazetrails/date`, which seats
      `Date` in the constant table. With nothing seated, the load raises
      `ArgumentError "undefined class/module Date"` as MRI would with `date`
      unrequired. `parseTime` answers the class `rbPathToClass("Time")`
      resolves. If nothing seats `Time`, ruby-compat's own time primitive is
      used if one exists; otherwise it raises, and the ported test for that
      arm is `BLOCKED:` on a story filed in `0154-ruby-compat-surfaced-deviations`.
- [ ] A table test mirrors `vendor/ruby/v3.3.11/test/psych/test_scalar_scanner.rb` cases.

## Verification

`pnpm vitest run packages/ruby-compat/src/psych/scalar-scanner*.test.ts`.
