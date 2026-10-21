---
title: "port-form-with-test-remaining-tests"
status: ready
updated: 2026-10-21
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 700
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:test` (forced run, 2026-10-20) reports actionview at 2156/2562
tests (84.2%), and `template/form_helper/form_with_test.rb` is the single
largest hole: **117 of 149 tests missing**, 32 matched, 0 skipped.
`packages/actionview/src/template/form-helper/form-with.test.ts` exists, so
this is test-by-test porting into an existing file, not a new mapping.

`port-form-helper-test-form-for-and-fields-for-suite` and its `-remainder` are
both `done`, so neither covers this file; the `form_with` suite is its own
Rails file
(`vendor/rails/v8.0.2/actionview/test/template/form_helper/form_with_test.rb`).

The missing set clusters into: the bare `form with` cases and `with block and
method in erb` / `with block in erb and local true`; `to model` persisted/new
record; the collection families (`collection select`, `collection radio
buttons`, `collection checkboxes`, each also in `with custom builder block`,
`does not leak the template` and `with index` variants); `file field generate
multipart` (both `form with` and `fields`); `not outputting ids`; `button
yields translation`; `doesnt call private or protected properties on form
object skipping value`; and the `format` family.

## Acceptance criteria

- Every Rails test in `form_with_test.rb` has a counterpart in
  `template/form-helper/form-with.test.ts`, at the Rails name per
  CLAUDE.md § "NEVER rename or reword test names".
- Any test that cannot run is `it.skip` with a `BLOCKED: <story-id>` or
  `PERMANENT-SKIP:` line, never a silent omission or a reworded name.
- `pnpm parity:test --package actionview` shows 0 missing for this file.
- Larger than one PR at 700 loc: ship what fits and file the remainder as a
  `-remainder` story with the Rails test names it still owes.
