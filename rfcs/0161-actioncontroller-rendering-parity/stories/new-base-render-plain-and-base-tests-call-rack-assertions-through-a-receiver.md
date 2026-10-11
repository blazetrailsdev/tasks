---
title: "new_base render_plain and base tests call assert_body/assert_status through a receiver, so 16 tests score zero assertions"
status: draft
updated: 2026-10-11
rfc: "0161-actioncontroller-rendering-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rack::TestCase`'s `assert_body` / `assert_status` / `assert_header`
(`vendor/rails/v8.0.2/actionpack/test/abstract_unit.rb`, `class Rack::TestCase`)
are called with an implicit receiver in Rails' `new_base` tests, and the Ruby
side of the assertion comparer counts each call.

`packages/actionpack/src/action-controller/controller/new-base/render-plain.test.ts`
and `new-base/base.test.ts` call them as `t.assertBody(...)` on a per-test
instance. The TS extractor (`scripts/test-compare/extract-ts-core.ts`,
`collectHelpers` / `countAssertions`) folds only a same-file helper reached by
a bare call, so those receiver calls count as zero:
`pnpm parity:test --package actioncontroller --assertions` lists
`controller/new_base/render_plain_test.rb` with 13 mismatches and
`controller/new_base/base_test.rb` with 3.

trails#8779 hit the same thing porting four sibling files and settled on bare
consts inside each `describe`, closing over that describe's `t`
(`new-base/content-type.test.ts`,
`const assertBody = (body: string): void => t.assertBody(body);`), the idiom
`controller/redirect.test.ts` already uses for `assertResponse`.

## Acceptance criteria

- `render-plain.test.ts` and `base.test.ts` build `t` in a `beforeEach` and
  call `assertBody` / `assertStatus` / `assertHeader` through bare consts
  inside the `describe`.
- Both files leave the `--assertions` mismatch list, and
  `pnpm parity:test:assertions:tighten` (or the mark's own tighten step)
  lowers the actioncontroller `assertion-count-mismatch` mark by what
  converged.
