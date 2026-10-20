---
title: "Enroll rack-test, bcrypt and did-you-mean in the naming and extra-surface gates"
status: ready
updated: 2026-10-20
rfc: "0193-small-gem-ports-parity-100"
cluster: small-residuals
packages: ["rack-test", "bcrypt", "did-you-mean"]
deps: ["rack-test-uploaded-file-append-to-receipt-prose"]
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Measured on trails `main` @ `5c642754f3` (2026-10-20). rack-test and bcrypt report 0 novel / 0 moved in `parity:api:extra` and no rows in `call-arg-mismatches.json`, and did-you-mean has no rows there either. Even so, rack-test and bcrypt are in neither gate, and did-you-mean is in the extra-surface gate but not in `NAMING_ENROLLED_PACKAGES` (`scripts/api-compare/lint-call-args.ts:106`, which lists rack, globalid and i18n from this RFC). Without enrollment, regressions in these packages stay silent after the RFC closes.

rack-test's `uploaded-file.ts:88` `@missingRailsArgs` receipt carries prose; `rack-test-uploaded-file-append-to-receipt-prose` (a deps edge) fixes it first, so the package goes in clean.

## Acceptance criteria

- [ ] rack-test, bcrypt and did-you-mean are listed in `NAMING_ENROLLED_PACKAGES`; rack-test and bcrypt are added to the extra-surface gate (`extra-surface-mark.ts`, pinned at 0 like the other rowless packages).
- [ ] `pnpm parity:api:calls:args` and `pnpm parity:api:extra:gate` are green.
