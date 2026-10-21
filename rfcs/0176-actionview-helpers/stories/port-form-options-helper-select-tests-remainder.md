---
title: "port-form-options-helper-select-tests-remainder"
status: in-progress
updated: 2026-10-21
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9175
claim: "2026-10-21T14:30:11Z"
assignee: "port-form-options-helper-select-tests-remainder"
blocked-by: null
closed-reason: null
---

## Context

port-form-options-helper-collection-options-remainder ported 74 of the 98
missing `template/form_options_helper_test.rb` tests into
`packages/actionview/src/template/form-options-helper.test.ts` and hit the
800-LOC ceiling. These 24 Rails tests
(`vendor/rails/v8.0.2/actionview/test/template/form_options_helper_test.rb`)
still have no counterpart:

- `fields for with record inherited from hash`
- `option html attributes with multiple element hash`
- `option html attributes with multiple hashes`
- `option html attributes with multiple hashes does not modify them`
- `option html attributes with no array element`
- `option html attributes without hash`
- `option html attributes with single element hash`
- `options for select with data element`
- `options for select with data element with special characters`
- `options for select with element attributes`
- `options for select with element attributes and selection`
- `options for select with element attributes and selection array`
- `options for select with special characters`
- `required select with default and selected placeholder`
- `select under fields for`
- `select with boolean method`
- `select with disabled array`
- `select with enumerable`
- `select with grouped collection as hash`
- `select with grouped collection as nested array`
- `select with grouped collection as nested array and html attributes`
- `select without multiple`
- `select with prompt and selected value`
- `select with range`

The file already has helpers to reuse: `abeMusHest`, `postCategory`,
`abeMusHestOptions`, `newPost`, `SEL` / `DIS`. `fields for with record
inherited from hash` needs Rails' `Map < Hash` with a `category` reader
(test file lines 6-10). `select with enumerable` needs `CustomEnumerable`
(lines 12-19).

## Acceptance criteria

- Each test above exists at its Rails name in `form-options-helper.test.ts`.
- `pnpm parity:test --package actionview` shows 0 missing for the file.
