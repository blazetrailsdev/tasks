---
title: "test:compare: fail loudly on an unregistered describeIf*/itIf* gate wrapper"
status: ready
updated: 2026-07-25
rfc: "0025-fidelity-verification-tooling"
cluster: null
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

Discovered while shipping #5306 (`mysql-tests-self-built-adapter-burndown`).
Adding a new conditional-`describe` wrapper (`describeIfMysqlAdapter`, the port
of `current_adapter?(:Mysql2Adapter)`) made every test inside it read as
**ungated** to `scripts/test-compare`, because the extractor recognises gate
wrappers by a hard-coded identifier list:

- `scripts/test-compare/extract-ts-core.ts:287-293` — `ADAPTER_SUITE_WRAPPERS`
- `scripts/test-compare/gates.ts:75-91` — `gateFromWrapper`, whose `default`
  arm returns `null` (= "no gate") for any unknown identifier

The failure mode is silent and misleading: the hard-zero gate-mismatch check
reported `activerecord: 52 gate-mismatch (must be 0)` with no hint that the
cause was an unregistered wrapper name rather than 52 genuinely mis-gated tests.
The author has to guess.

## Acceptance criteria

- [ ] An identifier matching `describeIf*` / `itIf*` that is not registered in
      `gateFromWrapper` fails loudly (named in the error, pointing at the two
      registration sites) instead of silently resolving to "no gate".
- [ ] The check names the offending file and identifier.
- [ ] Unit coverage in `scripts/test-compare/extract-ts-gates.test.ts`
      alongside the existing `gateFromWrapper` cases.
- [ ] `pnpm test:compare` output unchanged on a clean tree (gate-mismatch 0).
