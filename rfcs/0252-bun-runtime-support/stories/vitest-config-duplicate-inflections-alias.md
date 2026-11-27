---
title: "vitest.config.ts declares the inflections alias twice"
status: done
updated: 2026-11-27
rfc: "0252-bun-runtime-support"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 4
priority: null
pr: trails#10833
claim: "2026-11-27T03:44:45Z"
assignee: "vitest-config-duplicate-inflections-alias"
blocked-by: null
closed-reason: null
---

## Context

Every vitest run (seen under `bun --bun node_modules/vitest/vitest.mjs` while working trails#10782) prints esbuild's `Duplicate key "@blazetrails/activesupport/core-ext/string/inflections" in object literal` warning: `vitest.config.ts:175` and `:195` declare the same alias with the same `path.resolve(__dirname, "packages/activesupport/lib/core-ext/string/inflections.ts")` value.

## Acceptance criteria

- [ ] Delete the second entry (`vitest.config.ts:195-198`).
- [ ] A vitest run no longer prints the duplicate-key warning.
