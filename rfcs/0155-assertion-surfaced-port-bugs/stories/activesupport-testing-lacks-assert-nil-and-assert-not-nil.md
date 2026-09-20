---
title: "ActiveSupport::Testing::Assertions has no assertNil / assertNotNil, so assert_not_nil ports as .not.toBeNull() and passes on undefined"
status: draft
updated: 2026-09-20
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by `assertions-activemodel-dirty-serialization-callbacks` (RFC 0132,
trails#7907) while converging `dirty_test.rb` /
`attributes_dirty_test.rb`'s `assert_not_nil` assertions.

`ActiveSupport::Testing::Assertions` ports to
`packages/activesupport/src/testing/assertions.ts`, which exports `assert`,
`assertNot`, `assertPredicate`, `assertNotPredicate`, `assertRespondTo`,
`assertEmpty`, `assertRaises` and friends — but **no `assertNil` / `assertNotNil`**.
`assertNil` exists in the file at `:495` and is `function assertNil(...)`,
module-private, reachable only from `assertChanges`' internals at `:289`.

So a port of Rails' `assert_nil` / `assert_not_nil` has no helper to reach for
and falls back to a vitest matcher. Both available spellings are wrong in one
direction, because Ruby `nil` covers what JS splits into `null` and `undefined`:

- `expect(x).not.toBeNull()` — the spelling in the tree today — **passes when
  `x` is `undefined`**, so an assertion whose lookup did not resolve at all
  still goes green. That is exactly the failure mode Rails' `assert_not_nil`
  exists to catch.
- `expect(x).toBeNull()` **fails when `x` is `undefined`**, where Ruby's
  `assert_nil` would pass.

trails#7907 worked around it by spelling both arms of "changes accessible
through both strings and symbols" as `.not.toBeUndefined()`
(`packages/activemodel/src/dirty.test.ts:187-188`,
`packages/activemodel/src/attributes-dirty.test.ts:86-87`) — correct for that
hash, since a present key never holds `null` there, but it is a per-call-site
judgement every future port has to redo.

Rails cites: `assert_nil` is Minitest's (`minitest/assertions.rb`), and
`assert_not_nil` is the Rails `ActiveSupport::TestCase` alias registered in
`vendor/rails/activesupport/lib/active_support/test_case.rb` alongside the other
`assert_not_*` aliases; per repo convention the helper's trails home is
`activesupport/src/testing/assertions.ts`, where its siblings already live.

## Converged shape

Export `assertNil` and `assertNotNil` from
`packages/activesupport/src/testing/assertions.ts` (re-exported through
`packages/activesupport/src/index.ts` beside `assertNot` / `assertNotEmpty`),
both treating `null` and `undefined` as Ruby `nil` — the same `== null` test
`assert` itself already uses at `:341`. `normalizeTrailsKind` snake-cases the
helper name, so `assertNil` scores `nil` and `assertNotNil` scores `notNil`
with no `scripts/test-compare` change needed.

Then sweep the `.not.toBeNull()` / `.toBeNull()` call sites that port a Ruby
`assert_nil` / `assert_not_nil` onto the helpers. The sweep is the bulk of the
estimate; the export itself is ~20 LOC.

## Acceptance criteria

- [ ] `assertNil` and `assertNotNil` are exported from
      `activesupport/src/testing/assertions.ts` and from the package index, and
      both treat `undefined` as Ruby `nil`.
- [ ] `pnpm parity:test --assertions` still scores them `nil` / `notNil` — no
      `assertion-kinds.ts` change.
- [ ] Call sites porting a Rails `assert_nil` / `assert_not_nil` use the
      helpers; no assertion count/kind/value drift in any file touched.
- [ ] `pnpm parity:api:extra:gate` stays clean (the pair has a Ruby
      counterpart, so it is not novel surface).
