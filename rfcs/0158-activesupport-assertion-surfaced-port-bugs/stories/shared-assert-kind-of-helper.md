---
title: "Port minitest assert_kind_of once instead of file-local assertKindOf copies"
status: draft
updated: 2026-10-01
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: ["activesupport", "activerecord", "actionpack"]
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Minitest's `assert_kind_of cls, obj, msg = nil`
(`vendor/minitest/v5.27.0/lib/minitest/assertions.rb:282-288`) has no shared trails
port. Two test files carry their own file-local copy, each hard-wired to one
class:

- `packages/activerecord/src/result.test.ts:5` — `assertKindOf(Number, actual)`,
  true only for an integer.
- `packages/actionpack/src/action-controller/controller/test-case.test.ts` —
  `assertKindOf(String, actual)`, added by trails#8340 for
  `actionpack/test/controller/test_case_test.rb:694,716`.

Every further `assert_kind_of` port either copies one of these or falls back to
`assertEqual("string", typeof x)`, which the assertion comparer
(`scripts/test-compare/assertion-kinds.ts:110`, `assert_kind_of: "instanceOf"`)
scores as a kind mismatch.

## Acceptance criteria

- [ ] One `assertKindOf(cls, obj, msg?)` exported beside `assertSame` in
      `packages/activesupport/src/testing/assertions.ts`, with minitest's
      message ("Expected … to be a kind of …, not …"). It answers `String` /
      `Number` / `Boolean` for JS primitives and `instanceof` otherwise.
- [ ] It carries the same receipt the other minitest-only helpers in that file
      carry (minitest is not a mapped gem source; see
      `minitest-assertion-ports-score-as-novel-surface`).
- [ ] The two file-local copies are deleted and their call sites use the shared
      helper; `pnpm parity:test:assertions` stays green.
