---
title: "persistence_test increment/decrement tests should use bang+reload like Rails"
status: in-progress
updated: 2026-06-21
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 3798
claim: "2026-06-21T14:46:41Z"
assignee: "persistence-increment-decrement-reload-fidelity"
blocked-by: null
---

## Context

Surfaced during review of PR #3793 (persistence-test-canonical block 1).

The `increment attribute`, `increment attribute by`, `decrement attribute`,
and `decrement attribute by` tests in
`packages/activerecord/src/persistence.test.ts` are in-memory-only: they read a
fixture topic, set `replies_count` directly, call `.increment(...)` /
`.decrement(...)` and assert the new in-memory value — no persistence, no reload.

Rails `test_increment_attribute` (vendor/rails/activerecord/test/cases/persistence_test.rb:291-299)
exercises the bang form against a fixture and reloads:

    assert_equal 50, accounts(:signals37).credit_limit
    accounts(:signals37).increment! :credit_limit
    assert_equal 51, accounts(:signals37, :reload).credit_limit

This divergence is pre-existing (it predates the canonical conversion; PR #3793
only re-sourced the record from a fixture). Tracked here, not fixed in that PR,
to keep the conversion wave behavior-preserving.

## Acceptance criteria

- [ ] Rework the `increment`/`decrement attribute[ _by]` tests to mirror Rails:
      use the bang form (`increment!`/`decrement!`), persist, and re-read from
      the DB (reload) to assert the value round-trips — matching
      `persistence_test.rb:291-330`. Test names unchanged.
- [ ] `pnpm vitest run packages/activerecord/src/persistence.test.ts` passes;
      lint + `node scripts/typecheck.mjs` clean.
