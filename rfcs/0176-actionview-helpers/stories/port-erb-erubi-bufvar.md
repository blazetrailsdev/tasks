---
title: "Port ERB::Erubi's bufvar option for the TSE compiler"
status: ready
updated: 2026-10-18
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/actionview/test/template/erb/erbubi_test.rb:7-19` ("can configure bufvar") builds `ActionView::Template::Handlers::ERB::Erubi.new(template, bufvar: "boofer")` (`actionview/lib/action_view/template/handlers/erb/erubi.rb`) and compares its `src` with the baseline's. trails compiles TSE through `packages/tse-compiler/src/emit-js.ts`, whose `EmitJsOptions` has no `bufvar` and which hard-codes `context.outputBuffer` / `_ob` (`emit-js.ts:226-234`). No `Erubi` class exists. The test is parked as `it.skip` in `packages/actionview/src/template/tse/erbubi.test.ts`.

## Acceptance criteria

- [ ] The handler's compiler class is reachable at the Rails path with a `bufvar` option and a `src` reader, and "can configure bufvar" runs.
