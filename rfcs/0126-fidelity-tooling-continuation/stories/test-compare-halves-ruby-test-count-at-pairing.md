---
title: "test-compare drops half a file's Rails tests at the pairing stage"
status: done
updated: 2026-09-01
rfc: "0126-fidelity-tooling-continuation"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: 1
pr: 7350
claim: "2026-09-01T17:32:16Z"
assignee: "shared-cache-rails-manifests-bypass-the-worktree-gate"
blocked-by: null
closed-reason: null
---

# test-compare drops half a file's Rails tests at the pairing stage

## Context

Surfaced in PR #7293 while converging
`packages/activerecord/src/adapters/postgresql/transaction-nested.test.ts` to
the model layer.

`vendor/rails/activerecord/test/cases/adapters/postgresql/transaction_nested_test.rb`
declares FOUR tests, and both extractors see all four:

- `scripts/test-compare/output/rails-tests.json` — file
  `adapters/postgresql/transaction_nested_test.rb`, `testCases` at lines
  **47, 84, 125, 166**, each `gate: {"adapters": ["postgresql"], "source": ["dir"]}`.
- `scripts/test-compare/output/ts-tests.json` — the four ported `it`s at lines
  104, 134, 185, 225, descriptions identical to the Ruby ones, each
  `gate: {"source": ["wrapper"], "adapters": ["postgresql"]}`.

But `scripts/test-compare/output/convention-comparison.json` records:

```json
{
  "rubyFile": "adapters/postgresql/transaction_nested_test.rb",
  "rubyTestCount": 2,
  "matched": 2,
  "missing": 0,
  "extra": 2
}
```

`rubyTestCount` is 2 where the manifest carries 4. Two Rails tests vanish
between extraction and comparison, and because `missing` is computed against
that halved population it stays 0 — so the file reports ✓ while two faithfully
ported tests are scored `extra (TS only)` and two Rails tests are invisible to
the parity metric.

This is NOT caused by the port: the same row (`2 0 0 0 0 2 2 ✓`) is present on
`origin/main` for the pre-PR version of the file, which also had four `it`s.
The gates match on both sides, so the usual gate-mismatch explanation
(RFC 0126's `gate-extractor-*` stories) does not apply here.

## Converged shape

`rubyTestCount` must equal the number of `testCases` the Rails manifest carries
for the file, and every one of them must be offered to the matcher. Find where
the comparison stage halves the population — a de-dupe keyed on something the
four tests collide on, or a per-file cap — and remove it, so `missing` and
`extra` are computed against the whole file. A file whose TS side ports every
Rails test must score `extra: 0`.

## Acceptance criteria

- [ ] `convention-comparison.json` reports `rubyTestCount: 4` for
      `adapters/postgresql/transaction_nested_test.rb`, with `matched: 4`,
      `missing: 0`, `extra: 0`.
- [ ] A scripts/test-compare test pins that a file with N Rails tests and N
      matching TS tests scores `rubyTestCount: N` and `extra: 0`.
- [ ] Sweep for other files whose `rubyTestCount` is below their manifest
      `testCases` length and record the count; the aggregate
      `activerecord — NNNN/NNNN tests (100%)` figure is understated by exactly
      those tests today.
