---
title: "lint-ruby-ported-tests-ban-tobetruthy-tobefalsy-tobecloseto"
status: draft
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
---

## Context

CONTRIBUTING.md § "Porting a Minitest assertion" maps Minitest's `assert` /
`refute` / `assert_in_delta` (`vendor/minitest/v5.27.0/lib/minitest/assertions.rb:171`,
`:650`, `:241`) to `@blazetrails/vitest-matchers`' `toBeRubyTruthy`,
`toBeRubyFalsy` and `toBeWithinDelta`. Vitest's `toBeTruthy` fails on `0` and
`""` (both truthy in Ruby), `toBeFalsy` passes on them, and `toBeCloseTo`
takes decimal digits, not a delta. Since each Ruby assertion now has its own
matcher name, a name-based rule can enforce the table.

## Acceptance criteria

- An ESLint rule flags `toBeTruthy`, `toBeFalsy` and `toBeCloseTo` in test
  files that `parity:test` matches to a Rails test, suggesting the
  `vitest-matchers` replacement.
- It ships enrolled per package (only-grow), starting with the packages whose
  caller-conversion stories have landed.
