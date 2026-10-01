---
title: "permit / expect type a filter as string or hash; Rails flattens nested array filters"
status: draft
updated: 2026-10-01
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: ["actionpack"]
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

`permit`, `expect`, `expect!` and `permit_filters` flatten their filters:
`filters.flatten.each` (`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/strong_parameters.rb:1133`)
and `keys = filters.flatten.flat_map { ... }` (`:774`). So `params.expect([:a, :b])`,
`params.permit(:name, [:age, :role])` and `expect(person: [...], [:id])` are all valid Rails.

trails' bodies flatten too (`filters.flat()` in `expect` and `permitFilters`,
`packages/actionpack/src/action-controller/metal/strong-parameters.ts`), but every signature
types a filter as `string | Record<string, unknown>`, so an array filter is a compile error. The
`expect` overloads added in trails#8308 inherit that: there is no overload for the array form,
and `expect(["a", "b"])`, which Rails answers with the two-value array (`:776`), cannot be
written without a cast.

## Acceptance criteria

- [ ] `permit`, `permitFilters`, `expect` and `expectBang` accept nested arrays of filters, as
      `filters.flatten` does.
- [ ] `expect(["a", "b"])` is typed `unknown[]`, and `expect(["a"])` `unknown`.
- [ ] Type tests in `strong-parameters.trails.test.ts`; no cast in
      `parameters-expect.test.ts`'s "array of keys" tests.
