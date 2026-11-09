---
title: "trailties-port-application-initializers-frameworks-tests-rest"
status: in-progress
updated: 2026-11-09
rfc: "0212-trailties-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9932
claim: "2026-11-09T20:50:39Z"
assignee: "trailties-port-application-initializers-frameworks-tests-rest"
blocked-by: null
closed-reason: null
---

## Context

Remaining skipped tests in `packages/trailties/test/application/initializers/frameworks.test.ts` vs `vendor/rails/v8.0.2/railties/test/application/initializers/frameworks_test.rb`: "includes URL helpers as action methods" (:55-73), "allows to not load all helpers for controllers" (:75-134, rack-test + include_all_helpers), AS bare tests (:186-201, `use_frameworks` + core_ext loading), "database middleware doesn't initialize when activerecord is not in frameworks" (:209-213), six schema cache dump tests (:229-341, need `db:schema:cache:dump`), MessagePack cache serializer (:432-445).

## Acceptance criteria

- Port each with its Rails name onto the `FrameworksTest` harness; a test still blocked is `it.skip` with `// BLOCKED: <story>` naming a filed story.
