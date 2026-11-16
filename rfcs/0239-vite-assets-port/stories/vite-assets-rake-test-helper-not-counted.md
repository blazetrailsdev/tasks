---
title: "rake_tasks_test.rb helper test_app_dev_dependencies stops counting as a missing test"
status: in-progress
updated: 2026-11-15
rfc: "0239-vite-assets-port"
cluster: null
packages: ["vite-assets"]
deps: []
deps-rfc: []
est-loc: 30
priority: 6
pr: trails#10158
claim: "2026-11-15T22:51:38Z"
assignee: "vite-assets-names-follow-vite-assets-convention"
blocked-by: null
closed-reason: null
---

## Problem

`pnpm parity:test vite-assets` on origin/main reports `rake_tasks_test.rb` at 4/5, with 1 missing. The missing "test" is `test_app_dev_dependencies` (`rake_tasks_test.rb:53`). It is a helper that returns the test*app's `devDependencies`, not a test, and the extractor counts it only because its name starts with `test*`.

## Fix

Either port the helper into `packages/vite-assets/test/rake-tasks.test.ts` under a name the comparator credits, or teach the Ruby test extractor to skip `test_*` defs that are called as helpers by sibling tests, whichever the test-compare tooling already supports. A `PERMANENT-SKIP` is not appropriate here, because nothing is untestable.

## Done when

`parity:test vite-assets` reads 98 matched + 2 PERMANENT-SKIP = 100, or 97 + 2 against a total of 99 once the helper is excluded.
