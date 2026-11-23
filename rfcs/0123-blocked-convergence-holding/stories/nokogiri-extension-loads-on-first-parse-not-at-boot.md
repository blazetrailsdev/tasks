---
title: "nokogiri-extension-loads-on-first-parse-not-at-boot"
status: blocked
updated: 2026-11-20
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: null
claim: "2026-11-19T23:58:01Z"
assignee: "nokogiri-extension-loads-on-first-parse-not-at-boot"
blocked-by: "Operator decision: CLAUDE.md § 'An adapter file is loaded by an awaited step' ratifies awaiting nokogiri/extension at boot (action_view.require_nokogiri) because Nokogiri parse entry points (HTML5.parse, sanitizer helpers) are synchronous; loading on first parse needs an async parse path or a reversal of that ruling. The TLA is inside libxml2-wasm/lib/libxml2.mjs:3 itself, so a CJS bundle fails whenever the module is bundled at all."
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
