---
title: "activerecord: triage the 131 structural duplicates of ruby-compat exports"
status: ready
updated: 2026-09-30
rfc: "0174-activerecord-api-parity-100"
cluster: tooling
packages: ["activerecord"]
deps: []
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

`pnpm parity:structural-duplicates:report` lists **131** activerecord candidates whose body shape
matches a ruby-compat export (`constructor`, `greaterThan`/`lessThan…`, `inspect`, `toString`, `first`,
…) — the report behind the gated `no-ruby-compat-reimplementation` rule. A real duplicate re-implements
Ruby core semantics ruby-compat already ports; the gated exclude
`eslint/no-ruby-compat-reimplementation-exclude.json` still lists two activerecord sites
(`abstract-mysql-adapter.ts::fetch`, `postgresql-adapter.ts::fetch`).

## Acceptance criteria

- [ ] Both `fetch` excludes are converged onto ruby-compat `fetch` and removed from the exclude file.
- [ ] Every candidate is classified in the PR body (real duplicate → converged here or filed; shape-only false positive → report fix with a test).
- [ ] The report lists no real activerecord duplicate.

## Verification

```bash
pnpm vitest run scripts/api-compare scripts/parity
```
