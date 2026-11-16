---
title: "The ledger skip is tested through each call lint's main, --write included"
status: done
updated: 2026-11-16
rfc: "0191-rails-8-0-5-1-upgrade-workflow"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: 1
pr: trails#10183
claim: "2026-11-16T15:06:34Z"
assignee: "bump-ledger-skip-is-tested-through-each-lints-main"
blocked-by: null
closed-reason: null
---

## Context

trails#10127 made the call ratchets skip rows on a bump-ledgered pair. The skip is one `skipLedgered` call per lint, inside each lint's `main`:

- `scripts/api-compare/lint-call-mismatches.ts` `main`. On `--write`, ledgered baseline rows are written back as they are, through `sortKeys([...reseed(current, baseline, …), ...ledgeredBaseline])`; `artifact.staleTags` is filtered by `ledger.tsName`.
- `scripts/api-compare/lint-call-args.ts` `main`. Shape rows, naming rows, `staleTags` and `staleNameTags` are filtered, and `--write` keeps `ledgeredBaseline`.
- `scripts/api-compare/lint-ruby-compat-calls.ts` `main` and `scripts/api-compare/receipt-audit.ts` `main`.

`bump-ledger.test.ts` covers the `ledgerScope` predicate for each lint's row shape. No test drives a lint's `main` against a fixture ledger, so a regression in that wiring is caught only by a full `parity:bump:dry-run`. Examples of such a regression: `--write` dropping or reseeding a ledgered row, or the unreviewed marks being computed from the filtered baseline instead of the full one.

## Acceptance criteria

- [ ] A test runs `lint-call-mismatches.ts --write` against a temporary baseline dir, artifact and ledger, and asserts:
  - a ledgered baseline row survives unchanged;
  - a ledgered artifact row is not seeded;
  - the unreviewed marks still count the ledgered rows.
- [ ] For each of the four lints, a test runs the gate path and asserts exit 0 when the only NEW or STALE row is on a ledgered pair, and a red exit when the same row is on an unledgered pair.
- [ ] Any seam a lint needs for this, such as an injectable directory, reuses an existing parameter or config value. It is not a new public name.
