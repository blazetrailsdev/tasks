---
title: "tse-stand-in-harness-covers-actionpack-fixtures"
status: in-progress
updated: 2026-10-21
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: 12
pr: trails#9195
claim: "2026-10-21T21:15:41Z"
assignee: "tse-emitter-share-node-loop-with-stand-in"
blocked-by: null
closed-reason: null
---

## Context

`packages/trails-tsc/src/plugins/tse-stand-in.test.ts` (trails#9125) renders each actionview TSE fixture through the eval path and through the emitted stand-in, then compares the output. Each fixture needs its own render scenario. trails#9119 added ~99 fixtures under `packages/actionview/src/test-helpers/fixtures/actionpack/`, mirroring `vendor/rails/v8.0.2/actionpack/test/fixtures/`. The harness excludes that subtree for now. These fixtures use `_iteration` locals, `yield(name)` sections, nested `render`, layouts and `this.variableForLayout`.

## Acceptance criteria

- Remove the `!…/actionpack/**` exclusion from the harness glob.
- Add a render scenario for each actionpack fixture, with locals taken from the Rails test that renders it (`actionpack/test/controller/render_test.rb`, `actionview/test/template/render_test.rb`).
- Stand-in output equals eval-path output for every fixture. Fix each difference in `packages/trails-tsc/src/plugins/tse.ts`.
