---
title: "Four unported-files rows name tests that are live in the mirroring TS file"
status: ready
updated: 2026-10-11
rfc: "0175-activerecord-test-parity-100"
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

`scripts/parity/unported-live-test.test.ts` fails locally (it is skipped in the Unit Tests CI
job, which has no `vendor/rails`) on four `tests:` rows in `scripts/parity/unported-files/`
that name a test the mirroring TS file defines live. Each row subtracts a ported test from
the Rails count, so `parity:test` understates the ported population:

- `attribute_accessor_per_thread_test.rb` "default value is accessible from other threads" is
  live at `packages/activesupport/src/core-ext/module/attribute-accessor-per-thread.test.ts:49`.
- `core_ext/class/attribute_test.rb` "works well with singleton classes" is live at
  `packages/activesupport/src/core-ext/class/attribute.test.ts:113`.
- `connection_pool_test.rb` "reap inactive" is live at
  `packages/activerecord/src/connection-pool.test.ts:253`.
- `core_test.rb` "inspect singleton instance" is live at
  `packages/activerecord/src/core.test.ts:73`.

Seen while retiring the `fixtures_test.rb` rows on trails#8801, which left these four as
the guard's only offenders.

## Acceptance criteria

- [ ] For each row, read the Rails test and the TS test of that name. Where the TS test is
      the Rails body, delete the row; where it is not, converge the TS test to the Rails body
      and then delete the row.
- [ ] `pnpm vitest run scripts/parity/unported-live-test.test.ts` passes with `vendor/rails`
      populated.
