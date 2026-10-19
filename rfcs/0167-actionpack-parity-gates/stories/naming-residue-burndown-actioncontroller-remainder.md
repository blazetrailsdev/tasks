---
title: "Burn down actioncontroller's regrown naming residue (18 rows)"
status: done
updated: 2026-10-19
rfc: "0167-actionpack-parity-gates"
cluster: null
packages: []
deps:
  - test-request-assign-parameters-binary-data-b
  - instrumentation-status-code-reads-the-exception-class-path
deps-rfc: []
est-loc: 120
priority: null
pr: trails#9077
claim: "2026-10-19T17:11:40Z"
assignee: "naming-residue-burndown-actioncontroller-remainder"
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
