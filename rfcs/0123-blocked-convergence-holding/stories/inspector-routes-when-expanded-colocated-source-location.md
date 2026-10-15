---
title: "inspector-routes-when-expanded-colocated-source-location"
status: blocked
updated: 2026-10-15
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: "owner decision: where test/dispatch ports sit relative to src/action-dispatch, which Mapper#routeSourceLocation skips (mapper.rb:378-391)"
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actionpack/test/dispatch/routing/inspector_test.rb:338-388`
(`test_routes_when_expanded`) asserts `Source Location | <file>:<line>` rows.
`Mapping#route_source_location` (`actionpack/lib/action_dispatch/routing/mapper.rb:378-391`,
trails `packages/actionpack/src/action-dispatch/routing/mapper.ts` `routeSourceLocation`)
skips every caller frame under `action_dispatch/`. Rails' test file lives in
`actionpack/test/`, outside that dir; trails' colocated
`packages/actionpack/src/action-dispatch/dispatch/routing/inspector.test.ts` lives
under `src/action-dispatch/`, so its own draw frames are skipped and the row
reports a vitest runner frame. The test body is ported in full and parked as
`it.skip` (trails PR for `port-routes-inspector-test-skips`).

## Acceptance criteria

- `routes when expanded` runs un-skipped with Rails' body, and
  `Mapper#routeSourceLocation` keeps Rails' single `start_with?(action_dispatch_dir)`
  guard (no test-file arm). Likely by deciding where action-dispatch's
  colocated tests sit relative to the skipped dir.
- inspector_test.rb reports 31/31 with 0 skipped.
