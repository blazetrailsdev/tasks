---
title: "Set belongsToRequiredValidatesForeignKey=false in the AR suite (helper.rb:43)"
status: ready
updated: 2026-07-25
rfc: "0071-ar-test-helper-suite-wide-config-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: 50
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activerecord/test/cases/helper.rb:43` sets
`ActiveRecord.belongs_to_required_validates_foreign_key = false` suite-wide.

trails defaults it to `true` in both places and never overrides it for tests:
`packages/activerecord/src/ar-config.ts:213`
(`export let belongsToRequiredValidatesForeignKey = true`) and
`packages/activerecord/src/trailtie.ts:139` (the versioned-defaults hash).
`test-setup-ar.ts` calls `loadDefaults("7.0")` but nothing sets this flag, so
our `belongs_to` presence validations validate the FK where Rails' suite does
not. Found by the RFC 0064 spike (PR #5309,
`docs/infrastructure/ar-test-setup-cases-helper-layout-audit.md`).

Existing coverage to check against: `ar-config.test.ts` and
`associations/belongs-to-associations.test.ts` both already reference the flag,
so some tests may be asserting trails' `true` behavior and will need to be read
against their Rails counterparts before flipping.

## Acceptance criteria

- Set `belongsToRequiredValidatesForeignKey = false` in `test-setup-ar.ts` with
  a `// Mirror Rails activerecord/test/cases/helper.rb:43` comment, in the same
  style as the existing `:29` / `:40` / `:42` mirrors.
- Read the Rails counterparts of any test that changes behavior; where a trails
  test was asserting the `true` behavior, fix the test to match Rails — do NOT
  rename tests.
- Confirm the production default stays `true` (only the test harness flips it),
  exactly as with `raiseOnAssignToAttrReadonly`.
