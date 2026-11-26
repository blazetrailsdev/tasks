---
title: "A timed-out app generator test leaks its Dir.chdir into every later test"
status: draft
updated: 2026-11-26
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails#10763 CI run 45719343651, Trailties Tests (6): `AppGeneratorTest > application name is detected if it exists and app folder renamed` (`packages/trailties/test/generators/app-generator.test.ts:155`) ran past vitest's 5s timeout (5034ms). Its `runAppUpdate` was still inside a `Dir.chdir` block when vitest moved on, so every later test in the file raised `RuntimeError: conflicting chdir during another chdir block`. One slow test turned into a whole-file red. The test passed on the rerun.

Rails' counterpart (`vendor/rails/v8.0.5.2/railties/test/generators/app_generator_test.rb`, `test_application_name_is_detected_if_it_exists_and_app_folder_renamed`) runs the generator and `app:update` in-process with no timeout. Minitest has no per-test timeout, so a slow run cannot leak a chdir there.

## Acceptance criteria

- A generator test that times out cannot leave the process inside a `Dir.chdir` block. Either the suite's timeout covers the generator plus `app:update` (two full app generations), or the teardown waits for or unwinds the pending chdir before the next test starts.
- The test cases themselves stay unchanged.
