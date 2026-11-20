---
title: "turbo-rails test:compare reaches 100%"
status: ready
updated: 2026-11-20
rfc: "0235-hotwire-via-vite"
cluster: null
packages: ["turbo", "scripts"]
deps: []
deps-rfc: []
est-loc: 250
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Goal

Bring `pnpm parity:test --package turbo-rails` to 100% (operator ruling 2026-11-20).

## Measured (origin/main 6267d8913)

215/247 (87%), 8 skipped, 15/18 files, 20 misplaced:

- system/broadcasts_test.rb (13), system/form_submissions_test.rb (4), system/assertions_test.rb (3): tests live in `*.system.test.ts`, convention expects `*.test.ts`. Either move them or teach test-compare the `.system.test.ts` convention (whichever the repo's convention docs sanction).
- frames/frame_request_controller_test.rb: 4 missing, 1 skipped.

- streams/streams_controller_test.rb: 1 skipped.
- capybara_selectors_test.rb: 6 skipped.
  Unskip/port every test; no new skips.
