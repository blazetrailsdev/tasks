---
title: "Journey router/utils and nodes/ast test parity"
status: draft
updated: 2026-09-08
rfc: "0139-actiondispatch-journey-parity"
cluster: null
packages: ["actionpack"]
deps: ["journey-test-names-to-rails-def-test-form"]
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

- `vendor/rails/actionpack/test/journey/router/utils_test.rb` — 9 tests, 8
  re-spelled, 1 absent (`normalize path maintains string encoding`, which has no
  `test_*` twin in
  `packages/actionpack/src/action-dispatch/journey/router/utils.test.ts`), and 6
  trails-only tests covering non-BMP escaping and repeated-slash collapsing.
- `vendor/rails/actionpack/test/journey/nodes/ast_test.rb` — 9 tests, all 9
  re-spelled, 0 trails-only.

`normalize path maintains string encoding` asserts a Ruby `Encoding` property.
If it has no meaningful JS analogue, it is an `it.skip` with a REAL reason
naming the Ruby mechanism — never a silent omission and never a blanket
PERMANENT-SKIP line.

## Acceptance criteria

- `normalize path maintains string encoding` is ported, or skipped with a
  reason naming the Ruby mechanism that blocks it.
- The 6 trails-only tests move to a `journey/router/utils.trails.test.ts`
  sibling.
- `pnpm parity:test --package actiondispatch` reports
  `journey/router/utils_test.rb` at 9/9 and `journey/nodes/ast_test.rb` at 9/9,
  both 0 extra.
