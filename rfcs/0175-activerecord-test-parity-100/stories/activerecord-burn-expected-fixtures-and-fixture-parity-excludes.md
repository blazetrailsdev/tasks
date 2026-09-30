---
title: "activerecord: burn expected-fixtures-exclude (3) and test-fixture-parity-exclude (1)"
status: ready
updated: 2026-09-30
rfc: "0175-activerecord-test-parity-100"
cluster: lint-registers
packages: ["activerecord"]
deps: ["parity-100-rehome-postponed-rfc-dependencies", "port-fixtures-test-rb-fixture-declarations"]
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

- `eslint/expected-fixtures-exclude.json`: `batches.test.ts`, `calculations.test.ts`, `fixtures.test.ts` —
  files whose `fixtures(...)` declaration differs from their Rails test's `fixtures :…` line.
  `port-fixtures-test-rb-fixture-declarations` (RFC 0023) owns `fixtures.test.ts`.
- `eslint/test-fixture-parity-exclude.json`: `associations/has-and-belongs-to-many-associations.test.ts`.

## Acceptance criteria

- [ ] Each file declares exactly Rails' fixture sets and leaves the exclude; both files are empty.

## Verification

```bash
pnpm lint
```
