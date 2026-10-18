---
title: "Port Parameters.const_missing (NEVER_UNPERMITTED_PARAMS shim)"
status: draft
updated: 2026-10-18
rfc: "0141-actionpack-surfaced-deviations"
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

`ActionController::Parameters.const_missing`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/strong_parameters.rb`, the
`NEVER_UNPERMITTED_PARAMS` deprecation shim) is not ported in
`packages/actionpack/src/action-controller/metal/strong-parameters.ts`.
`always_permitted_parameters_test.rb:17-21` "returns super on missing constant
other than NEVER_UNPERMITTED_PARAMS" stubs `Parameters.superclass.const_missing`
and asserts `assert_equal "super", ActionController::Parameters::NON_EXISTING_CONSTANT`.
The trails test (`packages/actionpack/src/action-controller/controller/parameters/always-permitted-parameters.test.ts`)
asserts two unrelated `toContain`s instead; it is the remaining
assertion-mismatch row (equal 1/0, includes 0/2) for that file, found by
`assertion-burndown-controller-tail`.

## Acceptance criteria

- Decide the trails shape for `const_missing` (JS has no constant-miss hook;
  see root CLAUDE.md § "Call-time constant resolution" / "Ruby protocol methods")
  and either port it or close the arm PERMANENT with an owner ruling.
- If ported, the test asserts `assertEqual("super", ...)` as Rails does and the
  mismatch row is gone.
