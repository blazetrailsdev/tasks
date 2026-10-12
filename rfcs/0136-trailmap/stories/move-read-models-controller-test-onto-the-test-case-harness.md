---
title: "trailmap: read-models-controller.test.ts still builds its rack env by hand"
status: done
updated: 2026-10-12
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trailmap#63
claim: "2026-10-12T18:09:47Z"
assignee: "live-database-tests-never-run-in-ci-and-three-have-rotted"
blocked-by: null
closed-reason: null
---

## Context

Left out of trailmap#30 on purpose. Every other controller test moved onto
`test/support/controller-test-case.ts` (`controllerTestCase`, over `ActionController::TestCase`)
because the bump broke the old harness. `test/controllers/read-models-controller.test.ts:13-28`
still constructs an `ActionDispatch` `Request` from a literal rack env and calls
`new ReadModelsController().dispatch(action, request, response)` itself. It passes at pin
`9e17ddc98d`, so the bump did not force it, but it is now the one controller test that bypasses
the route set and the test case, and the next harness change will break it alone.

## Acceptance criteria

- [ ] `read-models-controller.test.ts` uses `controllerTestCase(ReadModelsController, headers)` and builds no rack env.
- [ ] Its assertions on shape and order are unchanged and pass.
