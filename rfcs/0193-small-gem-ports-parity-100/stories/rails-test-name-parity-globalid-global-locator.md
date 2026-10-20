---
title: "rails-test-name-parity-globalid-global-locator"
status: claimed
updated: 2026-10-20
rfc: "0193-small-gem-ports-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-10-20T13:55:38Z"
assignee: "globalid-extract-top-level-global-id-rb"
blocked-by: null
closed-reason: null
---

## Context

`globalid` was enrolled in `blazetrails/rails-test-name-parity` by the
`rails-test-name-parity-rollout-globalid` PR, which moved the TS-only tests of
`global-identification`, `signed-global-id` and `uri-gid` into their
`.trails.test.ts` twins. The PR LOC ceiling left one file:
`packages/globalid/src/global-locator.test.ts` keeps a mark of 12 in
`eslint/rails-test-name-parity-mark.json` (tests such as "returns null when no
finder is registered", "locatorFor returns the registered locator for the app",
"normalizeApp lowercases the app name", across the describes
"Locator (non-Rails coverage)", "Locator without model finder" and
"Locator non-Rails coverage — per-app dispatch helpers").

## Acceptance criteria

- The 12 TS-only tests move into `packages/globalid/src/global-locator.trails.test.ts`
  (with only the fixture classes they use), no test renamed.
- `pnpm parity:test:names:tighten` drops the `global-locator.test.ts` row; the
  mark file is `{}` again.
- `pnpm parity:test` globalid stays 138/138.
