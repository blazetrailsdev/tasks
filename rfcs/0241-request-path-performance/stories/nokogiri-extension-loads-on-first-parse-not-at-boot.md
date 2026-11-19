---
title: "nokogiri-extension-loads-on-first-parse-not-at-boot"
status: draft
updated: 2026-11-19
rfc: "0241-request-path-performance"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

From `snapshot-a-bundled-minimal-app-and-measure-cold-start` (docs/trailties/boot-cost-and-bundle-findings.md).
The `action_view.require_nokogiri` initializer (`packages/trailties/lib/trailties/action-view.ts:180-186`)
awaits `Nokogiri.loadPath["nokogiri/extension"]()` on every boot, which instantiates libxml2-wasm
(`packages/nokogiri/lib/extension.ts:1-2`; TLA at `libxml2-wasm/lib/libxml2.mjs:3`). Under
`node --build-snapshot` (Node 26.13) `WebAssembly` is not defined, so no booted app can be snapshotted,
and a CJS bundle of the framework fails on that one top-level await.

## Acceptance criteria

- A booted app does not instantiate libxml2-wasm until the first HTML/XML parse (or a snapshot
  deserialize callback), with the parse path awaiting the load.
- A CJS esbuild bundle of `@blazetrails/trailties` plus its action-view/action-controller/active-record
  trailties contains no top-level await.
