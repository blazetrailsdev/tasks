---
title: "Ratify 'System testing runs on Vitest' in actionpack CLAUDE.md"
status: draft
updated: 2026-10-15
rfc: "0166-actiondispatch-system-testing-parity"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: 0
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0166 ports system testing onto Vitest, Vite and Playwright with no
a third-party session library, by repo-owner ruling (2026-10-15). Every
call into that library in
`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/system_test_case.rb` and
`system_testing/**` is replaced by its Vitest-native equivalent, which needs a
ratified section so the receipts in the convergence stories have something to
cite. The section text is drafted in the RFC README, § "The ratified section".

## Acceptance criteria

- `packages/actionpack/CLAUDE.md` gains the section
  "System testing runs on Vitest (`SystemTestCase`,
  `SystemTesting::*`)", worded as the RFC drafts it, including the
  Rails-fact-to-Vitest-carrier table and the test-code-runs-in-Node rule.
- The root `CLAUDE.md` gains a one-paragraph pointer heading for it, like the
  other moved sections.
- No code changes.
