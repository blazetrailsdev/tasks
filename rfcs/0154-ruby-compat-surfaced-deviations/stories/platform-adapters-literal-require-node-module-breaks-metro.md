---
title: "platform-adapters-literal-require-node-module-breaks-metro"
status: draft
updated: 2026-11-20
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: ["ruby-compat"]
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

Seven ruby-compat adapters keep a literal `require("node:module")` behind a run-time guard: `child-process-adapter.ts:158`, `crypto-adapter.ts:210`, `os-adapter.ts:38`, `async-context-adapter.ts:110`, `fs-adapter.ts:264`, `http-adapter.ts:149`, `zlib-adapter.ts:163`. Metro resolves every literal `require` at build time, so a React Native bundle fails on `node:module` even though the guard would never take that arm.

Found building `examples/react-native-notes` (trails#10425), which works around it in the example; see its README row 3.

## Acceptance criteria

- The Node probe reaches `node:module` in a form bundlers do not resolve statically (e.g. `process.getBuiltinModule` only, or a computed specifier), shared by the seven adapters.
- A Metro bundle of ruby-compat builds with no `node:module` resolver shim.
