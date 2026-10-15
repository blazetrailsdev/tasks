---
title: "Ratify 'System testing runs on Vitest' in actionpack CLAUDE.md"
status: in-progress
updated: 2026-10-15
rfc: "0166-actiondispatch-system-testing-parity"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: 0
priority: null
pr: trails#8948
claim: "2026-10-15T19:32:01Z"
assignee: "ratify-vitest-native-system-testing-section"
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
- The screenshot save path the section names is real when it lands (repo
  owner, 2026-10-15, trails#8948): `screenshots_dir` reads
  `ScreenshotHelper.screenshotDirectory` (seeded from
  `inject("screenshotDirectory")`, since Vitest does not serialize
  `browser.screenshotDirectory` to workers and a test cannot change an
  injected value), and `output_type` / `html_from_env?` read only the
  `RAILS_SYSTEM_TESTING_SCREENSHOT*` variables Rails names, so the section's
  table matches the code.
- `TOKEN_RENAMES` gains `capybara` → `vitest`, so the Rails test name that
  spells the library credits at the Vitest spelling.
