---
title: "Enroll i18n and activesupport in the ruby-compat call gate at zero"
status: blocked
updated: 2026-08-31
rfc: "0129-ruby-compat"
cluster: null
packages: ["ruby-compat", "i18n", "activesupport"]
deps:
  [
    "ruby-core-call-mapping-table",
    "ruby-compat-symbol-conventions",
    "move-regexp-escape-to-ruby-compat",
  ]
deps-rfc: []
est-loc: 200
priority: 15
pr: null
claim: "2026-08-31T01:19:01Z"
assignee: "enroll-call-mapping-i18n-and-activesupport"
blocked-by: "dep ruby-core-call-mapping-table is still ready: scripts/parity/ruby-compat.ts, ENROLLED_PACKAGES and the parity:api:calls:ruby-compat script do not exist on main, so there is no gate to enroll i18n/activesupport into and no rubyCompat report to burn down"
closed-reason: null
---

## Context

First enrollment. `ENROLLED_PACKAGES` for the ruby-compat call gate is
**only-grow** — the same contract as `GATED_PACKAGES`
(`scripts/api-compare/extra-surface-mark.ts:50`) and the RFC 0121
`unbacked-internal-needs-receipt` `files` set. A package joins once its rows are
converged; **no package is ever removed to turn a red run green.**

These two go first because they are the smallest and because their populations
are already converged by earlier stories: `i18n` holds four of the five private
`isSymbol` copies (`backend/base.ts:241`, `fallbacks.ts:31`, `simple.ts:43`,
`key-value.ts:64`), and `activesupport` holds the canonical `regexpEscape`
(`core-ext/regexp.ts:18`) and seven of its call sites. By the time this story
runs, `ruby-compat-symbol-conventions` and `move-regexp-escape-to-ruby-compat`
have already flipped both to shared imports, so the gate should enroll at or near
zero.

Read the report from `ruby-core-call-mapping-table` first — its recorded count is
the burndown baseline. Every surviving row is converged in this PR by importing
the ruby-compat export; a row that genuinely cannot converge is baselined with a
**reviewed one-line reason** on the row you add, never the seeded placeholder.

## Acceptance criteria

- `i18n` and `activesupport` added to the gate's `ENROLLED_PACKAGES`, with a
  comment stating the set is only-grow.
- Every `kind: "rubyCompat"` row for both packages is converged in this PR, or
  carries a reviewed per-row `reason`. The PR body lists any baselined row and
  why.
- `pnpm parity:api:calls:ruby-compat` (the gating run, not the report) is green.
- No other package is enrolled; the report for the rest is unchanged.
- No baseline reseeded (`--write` is not used), no high-water mark raised; new
  rows are inserted SORTED via `serializeBaseline`, not appended.
- `pnpm parity:api`, `parity:api:calls`, `parity:api:calls:args`,
  `parity:api:params`, `parity:api:extra` all unchanged; i18n and activesupport
  suites green.
