---
title: "Require a permanence claim on @missingRailsCall reasons"
status: done
updated: 2026-08-22
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6840
claim: "2026-08-21T21:20:33Z"
assignee: "port-relation-create-for-build-scope"
blocked-by: null
closed-reason: null
---

## Context

`@missingRailsArgs` requires its reason to open with `PERMANENT` or
`CONVERGEABLE` (`scripts/api-compare/missing-rails-args-tags.ts`), and PR #6836
added the report half: `parity:api:calls:report` and
`parity:api:calls:args:report` now group receipts by that claim
(`receiptsSection` in `scripts/api-compare/lint-call-mismatches.ts`).

Its older sibling `@missingRailsCall` has no permanence token at all —
`missing-rails-call-tags.ts` gates only the empty-reason contract — so all 27
call-set receipts in the tree report as `unclassified`:

```text
Call-site receipts by permanence claim (1)
  unclassified     27
```

That is the exact failure RFC 0080 found for `@noRailsEquivalent`: 42 of 79
reasons described convergeable surface while reading as permanent, and nothing
in the report could tell the populations apart.

## Converged shape

`suppressedCallsIn` enforces the same permanence claim `suppressedArgCallsIn`
does — `classifyReason` is already shared — after the 27 existing tags are
classified in place. The report then splits them, and the CONVERGEABLE ones are
burndown work rather than permanent debt.

## Acceptance criteria

- [ ] Every `@missingRailsCall` reason in the tree opens with `PERMANENT` or
      `CONVERGEABLE`.
- [ ] An unclassified reason throws, as it does for `@missingRailsArgs`.
- [ ] `parity:api:calls:report` reports zero `unclassified` receipts.
