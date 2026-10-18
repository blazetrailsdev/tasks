---
title: "Burn down actioncontroller's regrown naming residue (18 rows)"
status: draft
updated: 2026-10-18
rfc: "0167-actionpack-parity-gates"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`naming-residue-burndown-actioncontroller` is done, but adding `actioncontroller` to
`NAMING_ENROLLED_PACKAGES` (`scripts/api-compare/lint-call-args.ts:105`) still reports
18 unreceipted naming rows (trails 2026-10-18, found on trails#9028). Examples:
`metal/mime-responds.ts` (`custom`/`response` `new (variant)`, `isAnyResponse fetch`),
`renderer.ts` (`constructor normalize_env`, `defaults dup`), `test-case.ts`
(`process new (class)`, `build_response (responseKlass)`), plus two
receipt-on-convergeable rows (`metal/instrumentation.ts processAction`,
`test-case.ts assignParameters`). This blocks `enroll-actionpack-in-naming-gate`.

## Acceptance criteria

- Each row is renamed to the Rails identifier, or receipted `@missingRailsName … PERMANENT` where `classifyPair` files it permanent.
- With actioncontroller enrolled, `pnpm parity:api:calls:args` reports no actioncontroller rows.
