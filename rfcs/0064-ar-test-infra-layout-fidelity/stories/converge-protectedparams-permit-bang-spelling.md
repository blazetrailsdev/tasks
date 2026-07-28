---
title: "converge-protectedparams-permit-bang-spelling"
status: in-progress
updated: 2026-07-28
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5532
claim: "2026-07-28T20:54:04Z"
assignee: "converge-protectedparams-permit-bang-spelling"
blocked-by: null
closed-reason: null
---

## Context

PR #5517 renamed the AR test stub's `ProtectedParams#permit()` to
`permitBang()` to match Rails' `permit!`
(`vendor/rails/activerecord/test/support/stubs/strong_parameters.rb:16`) and the
repo's bang convention (`rubyMethodToTs`: `x!` -> `xBang`).

That leaves the three `ProtectedParams` stubs in the tree spelling the same
Ruby method two ways:

- `packages/activerecord/src/support/stubs/strong-parameters.ts` — `permitBang()`
  (renamed by #5517).
- `packages/activemodel/src/attribute-assignment.test.ts:20` — `permitBang()`
  already correct.
- `packages/activemodel/src/forbidden-attributes-protection.test.ts:26` —
  still `permit()`, with one call site at line 45
  (`new ProtectedParams({ a: "b" }).permit()`).

Rails spells it `permit!` in both ActiveModel stubs
(`vendor/rails/activemodel/test/cases/forbidden_attributes_protection_test.rb:18,37`
and `attribute_assignment_test.rb:39,133`), so the remaining `permit()` is the
odd one out.

Note this is a file-local class declared inside the test file, not an import of
the AR stub — the rename cannot break other packages.

## Acceptance criteria

- `packages/activemodel/src/forbidden-attributes-protection.test.ts` spells the
  stub method `permitBang()` and its call site is updated.
- All three `ProtectedParams` stubs in the tree agree on `permitBang()`.
- `pnpm vitest run packages/activemodel/src/forbidden-attributes-protection.test.ts`
  passes; test names are unchanged.
