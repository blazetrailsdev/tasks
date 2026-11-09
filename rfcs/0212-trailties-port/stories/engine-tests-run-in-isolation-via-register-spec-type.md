---
title: "engine-tests-run-in-isolation-via-register-spec-type"
status: in-progress
updated: 2026-11-09
rfc: "0212-trailties-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9902
claim: "2026-11-09T03:08:50Z"
assignee: "action-dispatch-configure-converge-on-load-blocks"
blocked-by: null
closed-reason: null
---

# Engine tests run in isolation via registerSpecType

## Context

`packages/trailties/src/trailties/engine.test.ts` (`RailtiesEngineTest`, describe
`RailtiesTest::EngineTest`) and `engine.trails.test.ts` (`ActiveStorageInstallTest`, describe
`active_storage:install`) include `Isolation` but never call `registerSpecType`, so they run
in-process. Rails' `railties/test/railties/engine_test.rb` includes
`ActiveSupport::Testing::Isolation`. Adding
`registerSpecType(/^RailtiesTest::EngineTest$/, RailtiesEngineTest)` (and the same for
`active_storage:install`) makes the migration-copying tests ("copying migrations",
"copying migrations to specific database", "respects the order of railties when installing
migrations", "copies the create-tables migration once", "active_storage:update copies the
update migrations") fail in the child with `ArgumentError: marshal data too short`
(ruby-compat marshal load, raised while reading the child's result), found while landing
`frameworks-test-runs-in-isolation-via-register-spec-type`.

## Acceptance criteria

- Both files call `registerSpecType` for their Isolation class, and every test passes in a child process.
- The `marshal data too short` cause is fixed at its source (the child's result serialization), not worked around in the test.
