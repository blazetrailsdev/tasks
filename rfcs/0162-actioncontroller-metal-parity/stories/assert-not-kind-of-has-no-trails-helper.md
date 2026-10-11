---
title: "assert_not_kind_of has no trails helper, so its ports score as instanceOf"
status: draft
updated: 2026-10-11
rfc: "0162-actioncontroller-metal-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails aliases `assert_not_kind_of` to minitest's `refute_kind_of`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/test_case.rb:230`).
trails has `assertKindOf` in
`packages/activesupport/src/testing/assertions.ts` and no negated twin, so a
port spells `assert_not_kind_of ActionController::Parameters, @params.to_h` as
`expect(params.toH()).not.toBeInstanceOf(Parameters)`.

`parity:test` scores that vitest chain as an `instanceOf` assertion, while the
Rails name is unmapped in `RAILS_MAP` (`scripts/test-compare/assertion-kinds.ts`),
so each use is one kind mismatch. In
`packages/actionpack/src/action-controller/controller/parameters/parameters-permit.test.ts`
that is the two running tests "to_hash returns converted hash on permitted
params" and "to_hash returns converted hash when .permit_all_parameters is set"
(`parameters_permit_test.rb:460-465`, `:474-483`), plus three parked ones that
carry the same line.

## Acceptance criteria

- [ ] `assertNotKindOf(cls, obj, msg)` is added beside `assertKindOf`, with
      minitest's `refute_kind_of` message, and exported from the activesupport
      barrel.
- [ ] The `expect(...).not.toBeInstanceOf(...)` lines in
      `parameters-permit.test.ts` become `assertNotKindOf` calls.
- [ ] The actioncontroller `kind` mark in
      `scripts/test-compare/assertion-mismatch-mark.json` is lowered by hand to
      the new count.
