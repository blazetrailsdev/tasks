---
title: "trails-tsc: createTsePlugin still virtualizes .tse without the view scope"
status: in-progress
updated: 2026-10-01
rfc: "0035-tsserver-editor-plugin"
cluster: null
packages: ["trails-tsc"]
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#8352
claim: "2026-10-01T20:42:33Z"
assignee: "trails-tsc-build-tests-timeouts-and-stale-dev-test-name"
blocked-by: null
closed-reason: null
---

## Context

trails#8341 made the tsserver plugin (`packages/trails-tsc/src/lsp-plugin.ts`) virtualize a `.tse` file with the scope its last built shim carries (`shimScope` in `packages/trails-tsc/src/plugins/tse.ts`). `createTsePlugin` in the same file — the `TscPlugin` the `trails-tsc` compiler host loads (`packages/trails-tsc/src/program.ts:22`) — still calls `virtualizeTseWithDeltas(source)` with no scope, so a `.tse` file type-checked through that host sees the old unscoped shim: helpers, locals and ivars are unknown.

Rails compiles a template one way only (`ActionView::Template#compile`, `vendor/rails/v8.0.2/actionview/lib/action_view/template.rb`), so the names a template resolves do not depend on which tool reads it.

Nothing in the repo consumes `createTsePlugin` besides the package index (`packages/trails-tsc/src/index.ts:20`), so the first step is to decide whether it is still a supported entry point.

## Acceptance criteria

- `createTsePlugin` either virtualizes with the same scope `buildViews` and the tsserver plugin use, or is deleted along with its index export if it has no consumer.
- If kept: a test in `packages/trails-tsc/src/plugins/tse.test.ts` shows a helper call type-checked against the view scope through the plugin.
