---
title: "The bump ledger covers matched tests whose Rails body changed"
status: draft
updated: 2026-10-13
rfc: "0191-rails-8-0-5-1-upgrade-workflow"
cluster: tooling
packages: [scripts]
deps: [bump-ledger-tracks-drifted-pairs-and-the-body-pins-gate-reads-it]
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

RFC § 3 "The test half". The test side has no body pins. For `rails`
`v8.0.2` → `v8.0.5.1` the flip reds two test gates: `compare.ts --gates
--check` (1 activerecord gate-mismatch against a hard zero,
`scripts/test-compare/compare.ts:103-113`) and the assertion-mismatch ratchet,
where 7 package/dimension marks grow (actioncontroller count 92 → 99,
activesupport kind 3 → 12). No test moves in this bump; `v8.1.4` moves 187
arel tests to new describe paths, so the `moved` kind is built here and first
used there.

## Acceptance criteria

- [ ] The ledger accepts test rows keyed as test-compare keys a Rails test
      (`package`, Ruby file, test path). `kind: "changed"` is seeded from the
      diff of the two `rails-tests.json` manifests (assertion count, kinds,
      values or gate changed at the same path) and `kind: "moved"` from a
      description that reappears under a new describe path, keyed by the new
      path. Only tests trails matches get a row.
- [ ] The PR body gives the seed's size per package. The RFC's ceiling is
      36 changed (activerecord 10, activesupport 9, actioncontroller 9,
      trailties 5, and one each in actiondispatch, actionview and activejob)
      and none moved.
- [ ] Tests removed upstream (5) and added (112) get no row. The PR body
      states what each gate does with a removed test's TS port.
- [ ] `lint-assertion-mismatches.ts` and the gate-mismatch check do not count
      a ledgered test. Every other test is counted as today.
- [ ] The test-name ratchet either reads the ledger for a test whose describe
      path moved, or the PR body shows it is green at the flip without that.
- [ ] A test row is stale, and red, once the matched TS test agrees with the
      new Rails test on every axis the ledger suspended.
- [ ] The dry run with the ledger seeded reports both test gates green for
      `rails` at `v8.0.5.1`.

## Definition of done

`pnpm parity:test:assertions:reseed` or a raised mark does not close this
story.
