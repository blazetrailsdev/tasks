---
title: "encryption-config-imports-node-zlib-at-load"
status: draft
updated: 2026-11-20
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/lib/encryption/config.ts:2` imports `deflateSync, inflateSync` from `zlib` at module top, and `Base` reaches this module whether or not encryption is used, so every non-Node bundle needs `zlib` resolved.

Found building `examples/react-native-notes` (trails#10425), which works around it in the example; see its README row 2.

## Acceptance criteria

- `encryption/config.ts` compresses through ruby-compat's `zlib-adapter` (as the rest of the tree does), with no top-level Node built-in import.
- Bundling `Base` for a non-Node target resolves no `zlib`.
