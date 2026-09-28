---
title: "Burn actioncontroller's naming-class call-argument rows to zero"
status: draft
updated: 2026-09-28
rfc: "0167-actionpack-parity-gates"
cluster: null
packages: ["actionpack"]
deps: ["metal-parity-residue", "rendering-parity-residue", "testing-harness-parity-residue"]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:calls:args:report` classifies each call-argument row as
`shape` (gated everywhere) or `naming` (a `ref:` identifier spelled differently
from Rails). `naming` rows gate only in `NAMING_ENROLLED_PACKAGES`
(`scripts/api-compare/lint-call-args.ts:105`); elsewhere they are report-only.
On 2026-09-27 the report showed 33 burndown-class naming rows in
actioncontroller, concentrated in `metal/strong-parameters.ts` (13),
`metal/request-forgery-protection.ts` (6), `metal/http-authentication.ts` (4),
`renderer.ts` (4) and `metal.ts` (3).

This runs after the three controller RFCs close, so it edits files no sibling
story is touching.

## Acceptance criteria

- Every burndown-class naming row in actioncontroller is renamed to the Rails
  identifier. A pair `classifyPair` files as permanent takes a
  `@missingRailsName <ruby_identifier> — PERMANENT` receipt instead.
- `pnpm parity:api:calls:args:report` shows 0 burndown-class naming rows for
  actioncontroller.
