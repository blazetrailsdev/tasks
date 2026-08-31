---
title: "Enroll the remaining packages in the ruby-compat call gate, activerecord last"
status: claimed
updated: 2026-08-31
rfc: "0129-ruby-compat"
cluster: null
packages:
  ["ruby-compat", "activemodel", "actionpack", "actionview", "trailties", "date", "activerecord"]
deps: ["enroll-call-mapping-i18n-and-activesupport"]
deps-rfc: []
est-loc: 260
priority: 16
pr: null
claim: "2026-08-31T20:39:10Z"
assignee: "enroll-call-mapping-remaining-packages"
blocked-by: null
closed-reason: null
---

## Context

Continues `enroll-call-mapping-i18n-and-activesupport` over the rest, in
ascending order of row count: `date`, `activemodel`, `trailties`, `actionview`,
`actionpack`, and **`activerecord` last** — it is by far the largest surface
(2551 matched parameter pairs in the RFC 0128 census, against activesupport's 761) and it holds two of the four private `fetch` helpers
(`connection-adapters/postgresql-adapter.ts:157`,
`connection-adapters/abstract-mysql-adapter.ts:127`) plus
`support/quote-regex.ts:27` and `support/run-token.ts:23`.

Same contract as the first enrollment: `ENROLLED_PACKAGES` is only-grow; each
package's rows converge in the PR that enrolls it; a row that cannot converge
takes a reviewed one-line reason.

**This will not fit in one PR.** Size it against the report's per-package counts
before starting. Ship the packages that fit, and file the remainder as a
follow-on story against this RFC (`pnpm tasks new 0129-ruby-compat <slug>
--body-file …`, carrying the per-package counts you already have) — do **not**
fan out sibling PRs, and do not stack branches.

`activerecord` in particular may warrant its own story per adapter subtree; make
that call from the measured counts, not in advance.

## Acceptance criteria

- Every package the PR enrolls is added to `ENROLLED_PACKAGES` with its rows
  converged or reason-baselined, and `pnpm parity:api:calls:ruby-compat` green.
- Packages not reached are named in a follow-on story filed against this RFC,
  with their row counts recorded in that story's `## Context`.
- No baseline reseeded, no mark raised, no package removed from the set.
- `pnpm parity:api`, `parity:api:calls`, `parity:api:calls:args`,
  `parity:api:params`, `parity:api:extra` unchanged; every touched package's
  suite green, and all three AR lanes green if activerecord is included.
- Re-run `pnpm parity:api:calls` after every rebase: a rebase re-stales a
  tightened mark and reds `lint-call-mismatches.test.ts` with no merge conflict.
