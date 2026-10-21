---
title: "lint-ruby-ported-tests-ban-tobetruthy-tobefalsy-tobecloseto"
status: closed
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
closed-reason: "FALSIFIED: the repo owner ruled built-in matchers stay the default on trails#9176; no lint or ratchet on matcher names (lint-js-semantics-matchers-in-ported-tests closed for the same reason)."
updated: 2026-10-21
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
