---
title: "port-form-options-helper-collection-options-remainder"
status: done
updated: 2026-10-21
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 600
priority: null
pr: trails#9173
claim: "2026-10-21T14:00:57Z"
assignee: "port-form-options-helper-collection-options-remainder"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:test` (forced run, 2026-10-20) reports
`template/form_options_helper_test.rb` at 60 matched / **98 missing** of 158,
plus `kindMismatches` on the file.
`packages/actionview/src/template/form-options-helper.test.ts` exists, and both
`port-form-options-helper-and-select-tag` and
`form-options-select-tags-tests-remainder` are `done`.

The missing set is dominated by the `collection options` family:
`collection options`, `with private value method`, `with private text method`,
`with preselected value`, `with preselected value array`, `with proc for
selected`, `with disabled value`, `with disabled array`, and the variants that
follow them in
`vendor/rails/v8.0.2/actionview/test/template/form_options_helper_test.rb`.

Note the private-method cases: CLAUDE.md § "Method visibility is compile-time
only" makes a Rails test whose assertion turns on runtime visibility
permanently unportable for that arm. Port the assertions that do not depend on
it and receipt the rest rather than dropping them silently.

## Acceptance criteria

- Every Rails test in `form_options_helper_test.rb` has a counterpart at the
  Rails name in `template/form-options-helper.test.ts`.
- A visibility-dependent arm is parked per CLAUDE.md § "Method visibility is
  compile-time only" with a `PERMANENT-SKIP:` line citing that section, or its
  dropped assertion carries a row in
  `scripts/test-compare/assertion-receipts.ts`.
- `pnpm parity:test --package actionview` shows 0 missing for this file.
- Ship what fits; file a `-remainder` for the rest.
