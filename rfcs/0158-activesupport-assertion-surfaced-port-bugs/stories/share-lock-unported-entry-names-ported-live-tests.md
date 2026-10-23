---
title: "share_lock_test.rb unported entry still names tests trails#8943 ported live"
status: ready
updated: 2026-10-22
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
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

`scripts/parity/unported-live-test.test.ts` is red on main. The `share_lock_test.rb`
`tests:` entry in `scripts/parity/unported-files/activesupport.ts:183-218` still
lists "reentrancy", "sharing doesnt block", "sharing blocks exclusive" and the
rest. trails#8943 (`port-share-lock-test-remainder`) ported those tests live in
`packages/activesupport/src/share-lock.test.ts:71-115`. The Rails tests are in
`vendor/rails/v8.0.2/activesupport/test/share_lock_test.rb`. Because the entry
claims those tests are unported, `parity:test` subtracts them from the Ruby
count, so the live TS tests score as `extra (TS only)`.

## Acceptance criteria

- Remove every name from the entry that `share-lock.test.ts` defines as a
  live test, along with its `unported-files/baseline.json` row. Keep only
  tests that are still `it.skip`.
- `pnpm vitest run scripts/parity/unported-live-test.test.ts` passes.
- `parity:test` for `share_lock_test.rb` reports the ported tests as matched.
