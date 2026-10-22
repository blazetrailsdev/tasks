---
title: "Enroll actiondispatch in NAMING_ENROLLED_PACKAGES"
status: ready
updated: 2026-10-19
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps:
  - response-to-a-passes-rack-headers-to-hash
deps-rfc: []
est-loc: 10
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`enroll-actionpack-in-naming-gate` enrolled abstractcontroller (actioncontroller
was already in) and receipted/renamed every actiondispatch naming row but one,
so actiondispatch is still out of `NAMING_ENROLLED_PACKAGES`
(`scripts/api-compare/lint-call-args.ts:106-122`).

The row this story was filed for, `middleware/public-exceptions.ts render
render_format (publicSend)`, is gone: trails#9085 converged
`PublicExceptions#render` onto `rbObjRespondTo` / `rbFPublicSend`
(`public-exceptions.ts:47-48`). The remaining convergeable row is
`toA rack_response (toHash)`, owned by `response-to-a-passes-rack-headers-to-hash`
(this story's dep).

## Acceptance criteria

- Once the dep lands, `pnpm parity:api:calls:args:report` shows no convergeable
  `naming` row for actiondispatch; any permanent pair carries its
  `@missingRailsName` receipt.
- `actiondispatch` joins `NAMING_ENROLLED_PACKAGES` and
  `pnpm parity:api:calls:args` is green.
