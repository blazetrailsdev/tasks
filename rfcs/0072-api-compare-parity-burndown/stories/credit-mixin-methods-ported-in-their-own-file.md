---
title: "credit-mixin-methods-ported-in-their-own-file"
status: done
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6103
claim: "2026-08-04T23:23:03Z"
assignee: "credit-mixin-methods-ported-in-their-own-file"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api` re-expects every mixed-in method in each _host_ file on top
of the file that defines it. `PostgreSQL::Quoting#escape_bytea` is expected in
`connection_adapters/postgresql/quoting.rb` — where trails ports it, as
`connection-adapters/postgresql/quoting.ts`, and where it matches — and again
in `connection_adapters/postgresql_adapter.rb`, where trails does not repeat it
because Rails does not either. The host copy inflates the denominator and is
reported as a parity gap.

The triage in `docs/infrastructure/mixin-attribution-triage.md` (measured
2026-08-04) shows this accounts for **85 of the 87** data-layer gaps: crediting
them moves the data layer from 7729/7816 (98.9%) to 7814/7816 (99.97%). The
flattening comes from `flattenIncludedMethodInfos`, fed by `resolveModuleName`
(PR #5334).

## Acceptance criteria

- A flattened mixin method already matched in the TS file mirroring the mixin's
  own Ruby file is not re-expected in each host file.
- Data-layer total moves to the 99.97% floor recorded in the triage doc; the
  same duplication is checked for outside the data layer and the movement there
  is reported in the PR body.
- No exclusion-file rows added — the duplicate expectations are the defect.
