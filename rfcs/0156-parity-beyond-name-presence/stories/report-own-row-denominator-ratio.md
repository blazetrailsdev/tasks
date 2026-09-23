---
title: "Report the own-row ratio beside parity:api's percentage"
status: claimed
updated: 2026-09-23
rfc: "0156-parity-beyond-name-presence"
cluster: "denominator"
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: "2026-09-23T16:38:24Z"
assignee: "reconcile-skip-registers-with-open-stories"
blocked-by: null
closed-reason: null
---

## Context

`parity:api` prints `matched/totalMethods` (`scripts/api-compare/compare.ts:4907-4908`, `:5484`) and nothing about how much of Rails' surface reached `totalMethods`. Measured on `4e7c35e36b` (`audit-20260920.md` in this RFC's directory): activerecord has 6097 Ruby definitions in `output/rails-api.json`, of which 5069 (83.1%) are scored on a row of their own. 293 sit in excluded files, 146 carry a global SKIP name, 1 is scoped-skipped, 53 are operators, and 535 collapse into a same-named row. activesupport is 1741 of 2537 (68.6%), with a further 104 in files that get no row at all. The reported denominator (6491) is LARGER than the definition count because include-flattening adds a host copy per mixin method (`compare.ts:2676-2695`), which adds matched rows.

None of that is visible in the output, so "100%" reads as "done".

## Acceptance criteria

- `parity:api` prints, per package, the Ruby definition count and a breakdown: excluded file, rowless file, global skip, scoped skip, operator, same-name collapse, own row.
- The same breakdown is written to `api-comparison.json` per package.
- The numbers for activerecord and activesupport at the PR's base match a hand count the PR body shows.
- Report-only. No gate, no mark file.
