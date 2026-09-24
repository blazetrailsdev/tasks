---
title: "Sweep remaining toBeNull ports of assert_nil / assert_not_nil onto assertNil / assertNotNil"
status: draft
updated: 2026-09-24
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`activesupport-testing-lacks-assert-nil-and-assert-not-nil` exported
`assertNil` / `assertNotNil` from `packages/activesupport/src/testing/assertions.ts`
(re-exported from the package index; both treat `undefined` as Ruby `nil`) and
swept activemodel's Rails-ported tests plus activesupport's nine
`assert_not_nil` sites. The rest of the tree still ports Rails'
`assert_nil` / `assert_not_nil` (Minitest `assert_nil`;
`vendor/rails/activesupport/lib/active_support/test_case.rb:244` aliases
`assert_not_nil` to `refute_nil`) as `expect(x).toBeNull()` /
`expect(x).not.toBeNull()`. The second passes on `undefined`, which is the miss
`assert_not_nil` exists to catch.

Remaining `.not.toBeNull()` / `.toBeNull()` in non-`.trails` test files at the
time of filing: actionpack 167/119, activerecord 248/610, activesupport 0/137,
globalid 13/42, date 14/37, rack 3/80, actionview 5/25, trailties 0/21,
plus single digits in arel, i18n, ruby-compat, html-sanitizer, rack-session,
rack-test, activerecord-cli, tse-compiler.

The assertion comparer scores `toBeNull` as `nil` and `.not.toBeNull()` as
`notNil` (`scripts/test-compare/assertion-kinds.ts:52,171`), the same kinds
`assertNil` / `assertNotNil` score, so a swap is count/kind neutral.

## Acceptance criteria

- [ ] Every `.not.toBeNull()` / `.toBeNull()` that ports a Rails `assert_not_nil`
      / `assert_nil` uses `assertNotNil` / `assertNil`, one package per PR if the
      diff needs it (check each against the Rails file's `assert_nil` count).
- [ ] `pnpm parity:test:assertions` stays OK with no count/kind drift.
