---
title: "stubConst: test the exists:false async arm and a rejecting block"
status: draft
updated: 2026-10-18
rfc: "0156-parity-beyond-name-presence"
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

trails#9017 made `stubConst` (`packages/activesupport/src/testing/constant-stubbing.ts`)
defer its restore until an async block settles, mirroring the `ensure` of
`ActiveSupport::Testing::ConstantStubbing#stub_const`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/testing/constant_stubbing.rb:28-45`).
To stay under the LOC ceiling, its regression test
(`packages/activesupport/src/testing/constant-stubbing.test.ts`) covers only the
`exists: true` arm with a block that resolves. Two cases have no test: the
`exists: false` arm with an async block (`ensure` is `delete mod[constant]`), and
a block that rejects (the `.finally(ensure)` path).

## Acceptance criteria

- A test for an async block under `exists: false`: the constant is visible after
  an `await` and is removed once the block settles.
- A test for a rejecting async block on both arms: the rejection propagates and
  the constant is restored or removed.
