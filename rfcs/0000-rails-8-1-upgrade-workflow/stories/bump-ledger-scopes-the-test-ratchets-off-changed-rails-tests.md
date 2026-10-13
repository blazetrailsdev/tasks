---
title: "The bump ledger covers matched tests whose Rails body changed"
status: draft
updated: 2026-10-13
rfc: "0000-rails-8-1-upgrade-workflow"
cluster: tooling
packages: [scripts]
deps: [bump-ledger-scopes-the-method-ratchets-off-drifted-pairs]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC § 3. The test side has no body pins. For `rails` `v8.0.2` → `v8.1.4` the
flip reds two test gates: `compare.ts --gates --check` (7 activerecord
gate-mismatches against a hard zero, `scripts/test-compare/compare.ts:103-113`)
and the assertion-mismatch ratchet, where 19 package/dimension marks grow
(activerecord count 0 → 33, kind 4 → 36; activesupport count 1 → 32; arel
count, kind and value from 0). arel also moves 187 tests to new describe
paths, which the test-name ratchet reads.

## Acceptance criteria

- [ ] The ledger accepts test rows keyed as test-compare keys a Rails test
      (`package`, Ruby file, test path), seeded from the diff of the two
      `rails-tests.json` manifests: assertion count, kinds, values or gate
      changed.
- [ ] `lint-assertion-mismatches.ts` and the gate-mismatch check do not count
      a ledgered test. Every other test is counted as today.
- [ ] The test-name ratchet either reads the ledger for a test whose describe
      path moved, or the PR body shows it is green at the flip without that.
- [ ] A test row is stale, and red, once the matched TS test agrees with the
      new Rails test on every axis the ledger suspended.
- [ ] The dry run with the ledger seeded reports both test gates green for
      `rails` at `v8.1.4`.

## Definition of done

`pnpm parity:test:assertions:reseed` or a raised mark does not close this
story.
